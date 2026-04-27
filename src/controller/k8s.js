const axios = require("axios");
const https = require("https");
const { urlAPI } = require("../constant/env");
const { header } = require("../constant/header");
const pLimit = require("p-limit").default;
const limit = pLimit(5);

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const api = axios.create({
  baseURL: urlAPI,
  headers: header,
  httpsAgent: agent,
});

const getKubeEnvironments = async () => {
  const { data } = await api.get("/endpoints");

  return data.filter(
    (env) =>
      env.Type === 6 && // your case
      env.Status === 1,
  );
};

const convertNanocoresToCores = (nano) => {
  if (!nano) return 0;
  return parseFloat((parseInt(nano.replace("n", "")) / 1e9).toFixed(4));
};

const convertMemoryToBytes = (val) => {
  if (!val) return 0;

  const num = parseInt(val);
  if (val.endsWith("Ki")) return num * 1024;
  if (val.endsWith("Mi")) return num * 1024 * 1024;
  if (val.endsWith("Gi")) return num * 1024 * 1024 * 1024;

  return num; // fallback
};

const bytesToGB = (bytes) => {
  return parseFloat((bytes / 1024 ** 3).toFixed(2));
};

exports.getEnvironment = async (req, res) => {
  try {
    const result = await axios.get(urlAPI + "/endpoints", {
      headers: header,
      httpsAgent: agent,
    });

    res.status(200).send({
      status: "Success",
      data: result.data,
    });
  } catch (error) {
    console.error(
      "Error in getEnvironment:",
      error.response ? error.response.data : error.message,
    );
    res.status(400).send({
      status: "Failed",
      message: error.message,
      error: error.response ? error.response.data : error,
    });
  }
};

exports.getAllNS = async (req, res) => {
  try {
    const envs = await getKubeEnvironments();

    const results = await Promise.all(
      envs.map(async (env) => {
        try {
          const { data } = await api.get(`/kubernetes/${env.Id}/namespaces`);

          const namespaces = (data || [])
            .map((item) => ({
              name: item.Name,
              status: item?.Status?.phase || "Unknown",
              createdAt: item.CreationTimestamp,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: namespaces.length,
            namespaces,
          };
        } catch (err) {
          console.error(
            `Failed fetching namespaces for env ${env.Name}:`,
            err.message,
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: 0,
            namespaces: [],
          };
        }
      }),
    );

    // sort environments by name
    const sorted = results.sort((a, b) =>
      a.environment.name.localeCompare(b.environment.name),
    );

    // total across all environments
    const grandTotal = sorted.reduce((acc, curr) => acc + curr.total, 0);

    res.status(200).send({
      status: "Success",
      data: {
        total: grandTotal,
        environments: sorted,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const envs = await getKubeEnvironments();

    const results = await Promise.all(
      envs.map(async (env) => {
        try {
          // 1. get namespaces first
          const { data: namespacesData } = await api.get(
            `/kubernetes/${env.Id}/namespaces`,
          );

          const namespaces = namespacesData || [];

          // 2. fetch services per namespace (with limit)
          const namespaceResults = await Promise.all(
            namespaces.map((ns) =>
              limit(async () => {
                try {
                  const { data } = await api.get(
                    `/kubernetes/${env.Id}/namespaces/${ns.Name}/services?lookupapplications=true`,
                  );

                  const services = (data || []).map((item) => ({
                    name: item.Name,
                    type: item.Type,
                    ports: item.Ports || [],
                    applications: item.Applications || [],
                    createdAt: item.CreationTimestamp,
                  }));

                  return {
                    namespace: ns.Name,
                    total: services.length,
                    services,
                  };
                } catch (err) {
                  console.error(
                    `Failed services for ${env.Name}/${ns.Name}:`,
                    err.message,
                  );

                  return {
                    namespace: ns.Name,
                    total: 0,
                    services: [],
                  };
                }
              }),
            ),
          );

          // sort namespaces
          const sortedNamespaces = namespaceResults.sort((a, b) =>
            a.namespace.localeCompare(b.namespace),
          );

          // total services per environment
          const totalServices = sortedNamespaces.reduce(
            (acc, curr) => acc + curr.total,
            0,
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: totalServices,
            namespaces: sortedNamespaces,
          };
        } catch (err) {
          console.error(
            `Failed fetching namespaces for env ${env.Name}:`,
            err.message,
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: 0,
            namespaces: [],
          };
        }
      }),
    );

    // sort environments
    const sorted = results.sort((a, b) =>
      a.environment.name.localeCompare(b.environment.name),
    );

    // grand total
    const grandTotal = sorted.reduce((acc, curr) => acc + curr.total, 0);

    res.status(200).send({
      status: "Success",
      data: {
        total: grandTotal,
        environments: sorted,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.getPodsMetrics = async (req, res) => {
  try {
    const envs = await getKubeEnvironments();

    const globalPhaseTemplate = {
      Pending: 0,
      Running: 0,
      Succeeded: 0,
      Failed: 0,
      Unknown: 0,
      CrashLoopBackOff: 0,
    };

    let globalTotalPods = 0;
    let globalPhaseCount = { ...globalPhaseTemplate };

    const results = await Promise.all(
      envs.map(async (env) => {
        try {
          const { data: namespacesData } = await api.get(
            `/kubernetes/${env.Id}/namespaces`,
          );

          const namespaces = namespacesData || [];

          let envTotalPods = 0;
          let envPhaseCount = { ...globalPhaseTemplate };

          const namespaceResults = await Promise.all(
            namespaces.map((ns) =>
              limit(async () => {
                try {
                  const { data } = await api.get(
                    `/endpoints/${env.Id}/kubernetes/api/v1/namespaces/${ns.Name}/pods`,
                  );

                  const items = data?.items || [];

                  const pods = items.map((pod) => {
                    const phase = pod?.status?.phase || "Unknown";

                    // detect CrashLoopBackOff
                    const isCrashLoop = pod?.status?.containerStatuses?.some(
                      (c) => c?.state?.waiting?.reason === "CrashLoopBackOff",
                    );

                    const finalPhase = isCrashLoop ? "CrashLoopBackOff" : phase;

                    // increment counters
                    envTotalPods++;
                    globalTotalPods++;

                    envPhaseCount[finalPhase] =
                      (envPhaseCount[finalPhase] || 0) + 1;

                    globalPhaseCount[finalPhase] =
                      (globalPhaseCount[finalPhase] || 0) + 1;

                    return {
                      name: pod.metadata?.name,
                      namespace: pod.metadata?.namespace,
                      phase: finalPhase,
                      hostIP: pod.status?.hostIP,
                      podIP: pod.status?.podIP,
                      containers:
                        pod?.status?.containerStatuses?.map((c) => ({
                          name: c.name,
                          ready: c.ready,
                          restartCount: c.restartCount,
                          image: c.image,
                        })) || [],
                      createdAt: pod.metadata?.creationTimestamp,
                    };
                  });

                  return {
                    namespace: ns.Name,
                    total: pods.length,
                    pods,
                  };
                } catch (err) {
                  console.error(
                    `Failed pods for ${env.Name}/${ns.Name}:`,
                    err.message,
                  );

                  return {
                    namespace: ns.Name,
                    total: 0,
                    pods: [],
                  };
                }
              }),
            ),
          );

          const sortedNamespaces = namespaceResults.sort((a, b) =>
            a.namespace.localeCompare(b.namespace),
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: envTotalPods,
            phases: envPhaseCount,
            namespaces: sortedNamespaces,
          };
        } catch (err) {
          console.error(
            `Failed fetching pods for env ${env.Name}:`,
            err.message,
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: 0,
            phases: { ...globalPhaseTemplate },
            namespaces: [],
          };
        }
      }),
    );

    const sorted = results.sort((a, b) =>
      a.environment.name.localeCompare(b.environment.name),
    );

    res.status(200).send({
      status: "Success",
      data: {
        total: {
          all: globalTotalPods,
          byPhase: globalPhaseCount,
        },
        environments: sorted,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.getNodeMetrics = async (req, res) => {
  try {
    const envs = await getKubeEnvironments();

    const results = await Promise.all(
      envs.map(async (env) => {
        try {
          // 🚨 skip if metrics not enabled
          if (!env?.Kubernetes?.Configuration?.UseServerMetrics) {
            return {
              environment: { id: env.Id, name: env.Name },
              total: 0,
              nodes: [],
              skipped: true,
            };
          }

          // 1. get nodes
          const { data: nodeData } = await api.get(
            `/endpoints/${env.Id}/kubernetes/api/v1/nodes`,
          );

          const items = nodeData?.items || [];

          const nodes = await Promise.all(
            items.map((node) =>
              limit(async () => {
                try {
                  const name = node.metadata?.name;

                  // 2. get metrics per node
                  const { data: metric } = await api.get(
                    `/kubernetes/${env.Id}/metrics/nodes/${name}`,
                  );

                  const cpuTotal = parseInt(node.status?.capacity?.cpu || 0);

                  const cpuUsage = convertNanocoresToCores(metric?.usage?.cpu);

                  const memoryTotal = convertMemoryToBytes(
                    node.status?.capacity?.memory,
                  );

                  const memoryUsage = convertMemoryToBytes(
                    metric?.usage?.memory,
                  );

                  const memoryAvailable = memoryTotal - memoryUsage;

                  const memoryUsagePercent = parseFloat(
                    ((memoryUsage / memoryTotal) * 100 || 0).toFixed(2),
                  );

                  const memoryAvailablePercent = parseFloat(
                    ((memoryAvailable / memoryTotal) * 100 || 0).toFixed(2),
                  );

                  const memory = {
                    totalBytes: memoryTotal,
                    usedBytes: memoryUsage,
                    availableBytes: memoryAvailable,

                    // ✅ human readable
                    totalInGB: bytesToGB(memoryTotal),
                    usedInGB: bytesToGB(memoryUsage),
                    availableInGB: bytesToGB(memoryAvailable),

                    usagePercent: memoryUsagePercent,
                    availablePercent: memoryAvailablePercent,
                  };

                  const readyCondition = node.status?.conditions?.find(
                    (c) => c.type === "Ready",
                  );

                  const internalIP = node.status?.addresses?.find(
                    (a) => a.type === "InternalIP",
                  )?.address;

                  return {
                    name,
                    internalIP,
                    ready:
                      readyCondition?.status === "True" ? "Ready" : "Not Ready",

                    osImage: node.status?.nodeInfo?.osImage,
                    kernelVersion: node.status?.nodeInfo?.kernelVersion,
                    containerRuntime:
                      node.status?.nodeInfo?.containerRuntimeVersion,
                    kubeletVersion: node.status?.nodeInfo?.kubeletVersion,

                    gpu: node.status?.allocatable?.["nvidia.com/gpu"] || 0,

                    createdAt: node.metadata?.creationTimestamp,

                    usage: {
                      cpu: {
                        total: cpuTotal,
                        used: cpuUsage,
                        available: cpuTotal - cpuUsage,
                        usagePercent: parseFloat(
                          ((cpuUsage / cpuTotal) * 100 || 0).toFixed(2),
                        ),
                      },
                      memory: memory,
                    },
                  };
                } catch (err) {
                  console.error(
                    `Metrics failed for node ${node.metadata?.name}:`,
                    err.message,
                  );
                  return null;
                }
              }),
            ),
          );

          const validNodes = nodes.filter(Boolean);

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: validNodes.length,
            nodes: validNodes.sort((a, b) => a.name.localeCompare(b.name)),
          };
        } catch (err) {
          console.error(
            `Failed node metrics for env ${env.Name}:`,
            err.message,
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: 0,
            nodes: [],
          };
        }
      }),
    );

    const sorted = results.sort((a, b) =>
      a.environment.name.localeCompare(b.environment.name),
    );

    const grandTotal = sorted.reduce((acc, curr) => acc + curr.total, 0);

    res.status(200).send({
      status: "Success",
      data: {
        total: grandTotal,
        environments: sorted,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};
