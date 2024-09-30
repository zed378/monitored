const axios = require("axios");
const https = require("https");
const { urlAPI } = require("../constant/env");
const { header } = require("../constant/header");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

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
      error.response ? error.response.data : error.message
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
    const result = await axios.get(urlAPI + "/kubernetes/8/namespaces", {
      headers: header,
      httpsAgent: agent,
    });

    const count = Object.keys(result.data).length;

    res.status(200).send({
      status: "Success",
      total: count,
      data: result.data,
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
      error: error.response ? error.response.data : error,
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { data } = await axios.get(urlAPI + "/kubernetes/8/namespaces", {
      headers: header,
      httpsAgent: agent,
    });

    const namespaces = Object.keys(data);

    const results = await Promise.all(
      namespaces.map(async (namespace) => {
        const result = await axios.get(
          `${urlAPI}/kubernetes/8/namespaces/${namespace}/services?lookupapplications=true`,
          {
            headers: header,
            httpsAgent: agent,
          }
        );

        const services =
          result.data &&
          result.data.map((item) => {
            return {
              name: item.Name,
              type: item.Type,
              ports: item.Ports,
              applications: item.Applications,
              createdAt: item.CreationTimestamp,
            };
          });

        return {
          namespace,
          total: result?.data === null ? 0 : result.data.length,
          services: services === null ? 0 : services,
        };
      })
    );

    res.status(200).send({
      status: "Success",
      data: results,
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    const { data } = await axios.get(urlAPI + "/kubernetes/8/namespaces", {
      headers: header,
      httpsAgent: agent,
    });

    const namespaces = Object.keys(data);

    const results = await Promise.all(
      namespaces.map(async (namespace) => {
        const result = await axios.get(
          `${urlAPI}/endpoints/8/kubernetes/api/v1/namespaces/${namespace}/pods`,
          {
            headers: header,
            httpsAgent: agent,
          }
        );

        const pods = result.data.items.map((pod) => ({
          name: pod.metadata.name,
          namespace: pod.metadata.namespace,
          phase: pod.status.phase,
          hostIP: pod.status.hostIP,
          podIP: pod.status.podIP,
          containerStatuses: pod.status.containerStatuses.map((container) => ({
            name: container.name,
            ready: container.ready,
            restartCount: container.restartCount,
            image: container.image,
          })),
          creationTimestamp: pod.metadata.creationTimestamp,
        }));

        return {
          namespace,
          total: pods.length,
          pods: pods.length === 0 ? 0 : pods,
        };
      })
    );

    res.status(200).send({
      status: "Success",
      data: results,
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
      error: error.response ? error.response.data : error,
    });
  }
};

exports.getNodeMetrics = async (req, res) => {
  function convertNanocoresToCores(nanocores) {
    const val = parseFloat(nanocores.replace("n", ""));
    return parseFloat((val / 1_000_000_000).toFixed(4));
  }

  function convertKiBToBytes(kib) {
    return kib * 1024;
  }

  try {
    const { data: nodeData } = await axios.get(
      `${urlAPI}/endpoints/8/kubernetes/api/v1/nodes`,
      {
        headers: header,
        httpsAgent: agent,
      }
    );

    const nodes = await Promise.all(
      nodeData.items.map(async (node) => {
        const {
          metadata: { name, creationTimestamp },
          status: {
            capacity: { cpu, memory, pods },
            allocatable: { "nvidia.com/gpu": gpu },
            conditions,
            addresses,
            nodeInfo: {
              osImage,
              kernelVersion,
              containerRuntimeVersion,
              kubeletVersion,
            },
          },
        } = node;

        const { data: metricData } = await axios.get(
          `${urlAPI}/kubernetes/8/metrics/nodes/${name}`,
          {
            headers: header,
            httpsAgent: agent,
          }
        );

        const readyCondition = conditions.find(
          (condition) => condition.type === "Ready"
        );

        const internalIP = addresses.find(
          (addr) => addr.type === "InternalIP"
        ).address;

        const convert = {
          cpuCoreTotal: parseInt(cpu),
          cpuCoreUsage: convertNanocoresToCores(metricData.usage.cpu),
          cpuCoreAvailable:
            parseInt(cpu) - convertNanocoresToCores(metricData.usage.cpu),
          cpuUsageInPercent: parseFloat(
            (
              (convertNanocoresToCores(metricData.usage.cpu) / parseInt(cpu)) *
              100
            ).toFixed(2)
          ),
          cpuAvailableInPercent: parseFloat(
            (
              ((parseInt(cpu) - convertNanocoresToCores(metricData.usage.cpu)) /
                parseInt(cpu)) *
              100
            ).toFixed(2)
          ),
          memoryTotal: convertKiBToBytes(parseInt(memory.replace("Ki", ""))),
          memoryUsage: convertKiBToBytes(
            parseInt(metricData.usage.memory.replace("Ki", ""))
          ),
          memoryAvailable:
            convertKiBToBytes(parseInt(memory.replace("Ki", ""))) -
            convertKiBToBytes(
              parseInt(metricData.usage.memory.replace("Ki", ""))
            ),
          memoryUsageInPercent: parseFloat(
            (
              (convertKiBToBytes(
                parseInt(metricData.usage.memory.replace("Ki", ""))
              ) /
                convertKiBToBytes(parseInt(memory.replace("Ki", "")))) *
              100
            ).toFixed(2)
          ),
          memoryAvailableInPercent: parseFloat(
            (
              ((convertKiBToBytes(parseInt(memory.replace("Ki", ""))) -
                convertKiBToBytes(
                  parseInt(metricData.usage.memory.replace("Ki", ""))
                )) /
                convertKiBToBytes(parseInt(memory.replace("Ki", "")))) *
              100
            ).toFixed(2)
          ),
        };

        return {
          name,
          pods,
          gpu,
          ready: readyCondition.status === "True" ? "Ready" : "Not Ready",
          osImage,
          kernelVersion,
          containerRuntimeVersion,
          kubeletVersion,
          internalIP,
          createdAt: creationTimestamp,
          usage: convert,
        };
      })
    );

    res.status(200).send({
      status: "Success",
      data: {
        total: nodes.length,
        nodes,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};
