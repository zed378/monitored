const Docker = require("dockerode");
const docker = new Docker();

async function listContainers() {
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
        publicPort: port.publicPort,
        privatePort: port.privatePort,
        type: port.type,
      }));

      acc[state].containers.push({
        id: container.Id,
        names: container.Names,
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

    console.log(data);
  } catch (error) {
    console.error("Error fetching containers:", error);
  }
}

listContainers();
