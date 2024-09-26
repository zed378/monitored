const Docker = require("dockerode");
const docker = new Docker();

exports.listContainers = async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });

    const containerGroups = containers.reduce((acc, container) => {
      const state = container.State;

      if (!acc[state]) {
        acc[state] = {
          count: 0,
          containers: [],
        };
      }

      const ports = container.Ports.map((port) => ({
        publicPort: port.PublicPort,
        privatePort: port.PrivatePort,
        type: port.Type,
      }));

      acc[state].containers.push({
        id: container.Id,
        name: container.Names[0].replace("/", ""),
        image: container.Image,
        ports: ports,
      });

      acc[state].count += 1;

      return acc;
    }, {});

    const total = {};

    for (const state in containerGroups) {
      total[state] = containerGroups[state].count;
    }

    const data = {
      containerCount: { total: containers.length, byState: total },
      data: containerGroups,
    };

    res.status(200).send({
      status: "Success",
      data,
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};
