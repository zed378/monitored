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

        const services = result.data.pods.map((items) => {
          return {
            Name: items.metadata.name,
            UID: items.metadata.uid,
            Type: items.spec.type,
            Namespace: items.metadata.namespace,
            Annotations: items.metadata.annotations || {},
            CreationTimestamp: items.metadata.creationTimestamp,
            Labels: items.metadata.labels || {},
            Ports: items.spec.ports.map((port) => ({
              Name: port.name,
              NodePort: port.nodePort,
              Port: port.port,
              Protocol: port.protocol,
              TargetPort: port.targetPort,
            })),
            Selector: items.spec.selector || null,
            Applications: items.spec.applications || [],
            ClusterIPs: items.spec.clusterIPs || [],
          };
        });

        return { namespace, services };
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

        return { namespace, pods };
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
