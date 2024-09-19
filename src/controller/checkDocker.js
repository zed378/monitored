const Docker = require("dockerode");
const docker = new Docker();

async function listContainers() {
  try {
    const containers = await docker.listContainers({ all: true });

    const containerGroups = containers.reduce((acc, container) => {
      const state = container.State;

      if (!acc[state]) {
        acc[state] = [];
      }

      const ports = container.Ports.map((port) => ({
        publicPort: port.publicPort,
        privatePort: port.privatePort,
        type: port.type,
      }));

      acc[state].push({
        id: container.Id,
        name: container.Names[0].replace("/", ""),
        image: container.Image,
        ports,
      });

      return acc;
    }, {});

    console.log(containerGroups);
  } catch (error) {
    console.error("Error fetching containers:", error);
  }
}

listContainers();
