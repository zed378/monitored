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
  timeout: 5000,
});

const getDockerEnvironments = async () => {
  const { data } = await api.get("/endpoints");

  return data.filter(
    (env) => (env.Type === 1 || env.Type === 2) && env.Status === 1,
  );
};

exports.getDockerContainers = async (req, res) => {
  try {
    const envs = await getDockerEnvironments();

    let globalTotal = 0;
    let globalRunning = 0;
    let globalStopped = 0;

    const environments = await Promise.all(
      envs.map(async (env) => {
        try {
          const { data } = await api.get(
            `/endpoints/${env.Id}/docker/containers/json?all=true`,
          );

          const containers = data || [];

          let running = 0;
          let stopped = 0;

          const mapped = containers.map((c) => {
            const isRunning = c.State === "running";

            if (isRunning) running++;
            else stopped++;

            globalTotal++;
            if (isRunning) globalRunning++;
            else globalStopped++;

            return {
              id: c.Id,
              name: c.Names?.[0]?.replace("/", ""),
              image: c.Image,
              state: c.State,
              status: c.Status,
              ports: c.Ports || [],
              created: c.Created,
            };
          });

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: mapped.length,
            running,
            stopped,
            containers: mapped,
          };
        } catch (err) {
          console.error(
            `Failed fetching containers for ${env.Name}:`,
            err.message,
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            total: 0,
            running: 0,
            stopped: 0,
            containers: [],
          };
        }
      }),
    );

    const sorted = environments.sort((a, b) =>
      a.environment.name.localeCompare(b.environment.name),
    );

    res.status(200).send({
      status: "Success",
      data: {
        total: {
          all: globalTotal,
          running: globalRunning,
          stopped: globalStopped,
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

exports.getDockerHostMetrics = async (req, res) => {
  try {
    const envs = await getDockerEnvironments();

    const environments = await Promise.all(
      envs.map(async (env) => {
        try {
          const { data } = await api.get(`/endpoints/${env.Id}/docker/info`);

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            system: {
              os: data.OperatingSystem,
              kernel: data.KernelVersion,
              dockerVersion: data.ServerVersion,
            },
            resources: {
              cpu: data.NCPU,
              memoryTotal: data.MemTotal,
              containers: data.Containers,
              containersRunning: data.ContainersRunning,
              containersStopped: data.ContainersStopped,
              images: data.Images,
            },
          };
        } catch (err) {
          console.error(
            `Failed fetching docker info for ${env.Name}:`,
            err.message,
          );

          return {
            environment: {
              id: env.Id,
              name: env.Name,
            },
            system: {},
            resources: {},
          };
        }
      }),
    );

    res.status(200).send({
      status: "Success",
      data: {
        environments,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};
