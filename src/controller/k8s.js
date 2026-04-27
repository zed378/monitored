const axios = require('axios');
const https = require('https');
const { urlAPI } = require('../constant/env');
const { header } = require('../constant/header');
const pLimit = require('p-limit').default;
const limit = pLimit(5);

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const api = axios.create({
  baseURL: urlAPI,
  headers: header,
  httpsAgent: agent,
  timeout: 5000,
});

let cache = null;
let lastFetch = 0;
let servicesCache = null;
let servicesLastFetch = 0;
let nodeCache = null;
let nodeLastFetch = 0;
const CACHE_TTL = 30 * 1000;

const getKubeEnvironments = async () => {
  const { data } = await api.get('/endpoints');

  return data.filter(
    (env) =>
      env.Type === 6 && // your case
      env.Status === 1,
  );
};

const toCores = (nano) =>
  parseFloat((parseFloat(nano || 0) / 1_000_000_000).toFixed(4));

const kiToBytes = (val) => parseInt(val?.replace('Ki', '') || 0) * 1024;

const bytesToGB = (bytes) => parseFloat((bytes / 1024 ** 3).toFixed(2));

exports.getEnvironment = async (req, res) => {
  try {
    const result = await axios.get(urlAPI + '/endpoints', {
      headers: header,
      httpsAgent: agent,
    });

    res.status(200).send({
      status: 'Success',
      data: result.data,
    });
  } catch (error) {
    console.error(
      'Error in getEnvironment:',
      error.response ? error.response.data : error.message,
    );
    res.status(400).send({
      status: 'Failed',
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
              status: item?.Status?.phase || 'Unknown',
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
      status: 'Success',
      data: {
        total: grandTotal,
        environments: sorted,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: 'Failed',
      message: error.message,
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const now = Date.now();

    if (servicesCache && now - servicesLastFetch < CACHE_TTL) {
      return res.status(200).send(servicesCache);
    }

    const envs = await getKubeEnvironments();

    let globalTotal = 0;

    const environments = await Promise.all(
      envs.map(async (env) => {
        try {
          const { data } = await api.get(
            `/endpoints/${env.Id}/kubernetes/api/v1/services`,
          );

          const items = data?.items || [];

          let envTotal = 0;

          const namespaceMap = {};

          items.forEach((svc) => {
            const namespace = svc.metadata?.namespace || 'unknown';

            if (!namespaceMap[namespace]) {
              namespaceMap[namespace] = {
                namespace,
                total: 0,
                services: [],
              };
            }

            envTotal++;
            globalTotal++;

            namespaceMap[namespace].total++;

            namespaceMap[namespace].services.push({
              name: svc.metadata?.name,
              type: svc.spec?.type,
              clusterIP: svc.spec?.clusterIP,
              externalIP: svc.status?.loadBalancer?.ingress?.[0]?.ip || null,
              ports:
                svc.spec?.ports?.map((p) => ({
                  port: p.port,
                  targetPort: p.targetPort,
                  protocol: p.protocol,
                })) || [],
              createdAt: svc.metadata?.creationTimestamp,
            });
          });

          const namespaces = Object.values(namespaceMap).sort((a, b) =>
            a.namespace.localeCompare(b.namespace),
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: envTotal,
            namespaces,
          };
        } catch (err) {
          console.error(
            `Failed fetching services for env ${env.Name}:`,
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

    const sorted = environments.sort((a, b) =>
      a.environment.name.localeCompare(b.environment.name),
    );

    const response = {
      status: 'Success',
      data: {
        total: globalTotal,
        environments: sorted,
      },
    };

    servicesCache = response;
    servicesLastFetch = now;

    res.status(200).send(response);
  } catch (error) {
    res.status(400).send({
      status: 'Failed',
      message: error.message,
    });
  }
};

exports.getPodsMetrics = async (req, res) => {
  try {
    const now = Date.now();

    if (cache && now - lastFetch < CACHE_TTL) {
      return res.status(200).send(cache);
    }

    const envs = await getKubeEnvironments();

    const phaseTemplate = {
      Pending: 0,
      Running: 0,
      Succeeded: 0,
      Failed: 0,
      Unknown: 0,
      CrashLoopBackOff: 0,
    };

    let globalTotalPods = 0;
    let globalPhaseCount = { ...phaseTemplate };

    const environments = await Promise.all(
      envs.map(async (env) => {
        try {
          const { data } = await api.get(
            `/endpoints/${env.Id}/kubernetes/api/v1/pods`,
          );

          const items = data?.items || [];

          let envTotalPods = 0;
          let envPhaseCount = { ...phaseTemplate };

          const namespaceMap = {};

          items.forEach((pod) => {
            const namespace = pod.metadata?.namespace || 'unknown';
            const phase = pod?.status?.phase || 'Unknown';

            const isCrashLoop = pod?.status?.containerStatuses?.some(
              (c) => c?.state?.waiting?.reason === 'CrashLoopBackOff',
            );

            const finalPhase = isCrashLoop ? 'CrashLoopBackOff' : phase;

            globalTotalPods++;
            envTotalPods++;

            globalPhaseCount[finalPhase] =
              (globalPhaseCount[finalPhase] || 0) + 1;

            envPhaseCount[finalPhase] = (envPhaseCount[finalPhase] || 0) + 1;

            if (!namespaceMap[namespace]) {
              namespaceMap[namespace] = {
                namespace,
                total: 0,
                pods: [],
              };
            }

            namespaceMap[namespace].total++;

            namespaceMap[namespace].pods.push({
              name: pod.metadata?.name,
              namespace,
              phase: finalPhase,
              hostIP: pod.status?.hostIP,
              podIP: pod.status?.podIP,
              createdAt: pod.metadata?.creationTimestamp,
            });
          });

          const namespaces = Object.values(namespaceMap).sort((a, b) =>
            a.namespace.localeCompare(b.namespace),
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: envTotalPods,
            phases: envPhaseCount,
            namespaces,
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
            phases: { ...phaseTemplate },
            namespaces: [],
          };
        }
      }),
    );

    const sorted = environments.sort((a, b) =>
      a.environment.name.localeCompare(b.environment.name),
    );

    const response = {
      status: 'Success',
      data: {
        total: {
          all: globalTotalPods,
          byPhase: globalPhaseCount,
        },
        environments: sorted,
      },
    };

    cache = response;
    lastFetch = now;

    res.status(200).send(response);
  } catch (error) {
    res.status(400).send({
      status: 'Failed',
      message: error.message,
    });
  }
};

exports.getNodeMetrics = async (req, res) => {
  try {
    const now = Date.now();

    if (nodeCache && now - nodeLastFetch < CACHE_TTL) {
      return res.status(200).send(nodeCache);
    }

    const envs = await getKubeEnvironments();

    const environments = await Promise.all(
      envs.map(async (env) => {
        try {
          const [nodeRes, metricRes] = await Promise.all([
            api.get(`/endpoints/${env.Id}/kubernetes/api/v1/nodes`),
            api.get(`/kubernetes/${env.Id}/metrics/nodes`),
          ]);

          const nodes = nodeRes.data?.items || [];
          const metrics = metricRes.data?.items || [];

          const metricMap = {};
          metrics.forEach((m) => {
            metricMap[m.metadata.name] = m;
          });

          const results = nodes.map((node) => {
            const name = node.metadata?.name;
            const metric = metricMap[name];

            const cpuTotal = parseInt(node.status?.capacity?.cpu || 0);
            const memTotalBytes = kiToBytes(node.status?.capacity?.memory);

            const cpuUsed = toCores(metric?.usage?.cpu || '0n');
            const memUsedBytes = kiToBytes(metric?.usage?.memory);

            const cpuAvailable = cpuTotal - cpuUsed;
            const memAvailableBytes = memTotalBytes - memUsedBytes;

            const cpuUsagePct = cpuTotal
              ? parseFloat(((cpuUsed / cpuTotal) * 100).toFixed(2))
              : 0;

            const memUsagePct = memTotalBytes
              ? parseFloat(((memUsedBytes / memTotalBytes) * 100).toFixed(2))
              : 0;

            const readyCondition = node.status?.conditions?.find(
              (c) => c.type === 'Ready',
            );

            const internalIP = node.status?.addresses?.find(
              (a) => a.type === 'InternalIP',
            )?.address;

            return {
              name,
              internalIP,
              status: readyCondition?.status === 'True' ? 'Ready' : 'Not Ready',

              cpu: {
                total: cpuTotal,
                used: cpuUsed,
                available: cpuAvailable,
                usagePercent: cpuUsagePct,
              },

              memory: {
                totalBytes: memTotalBytes,
                usedBytes: memUsedBytes,
                availableBytes: memAvailableBytes,

                totalInGB: bytesToGB(memTotalBytes),
                usedInGB: bytesToGB(memUsedBytes),
                availableInGB: bytesToGB(memAvailableBytes),

                usagePercent: memUsagePct,
              },

              system: {
                os: node.status?.nodeInfo?.osImage,
                kernel: node.status?.nodeInfo?.kernelVersion,
                runtime: node.status?.nodeInfo?.containerRuntimeVersion,
                kubelet: node.status?.nodeInfo?.kubeletVersion,
              },

              createdAt: node.metadata?.creationTimestamp,
            };
          });

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: results.length,
            nodes: results,
          };
        } catch (err) {
          console.error(
            `Failed fetching node metrics for ${env.Name}:`,
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

    const sorted = environments.sort((a, b) =>
      a.environment.name.localeCompare(b.environment.name),
    );

    const response = {
      status: 'Success',
      data: {
        environments: sorted,
      },
    };

    nodeCache = response;
    nodeLastFetch = now;

    res.status(200).send(response);
  } catch (error) {
    res.status(400).send({
      status: 'Failed',
      message: error.message,
    });
  }
};
