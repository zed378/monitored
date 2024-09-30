const Docker = require("dockerode");
const docker = new Docker();

exports.listContainers = async (req, res) => {
  try {
    // List all containers (both running and stopped)
    const containers = await docker.listContainers({ all: true });

    // Initialize the possible container states with 0 count
    const containerStates = [
      "running",
      "exited",
      "created",
      "restarting",
      "paused",
      "dead",
    ];
    const containerGroups = containerStates.reduce((acc, state) => {
      acc[state] = {
        count: 0,
        containers: [],
      };
      return acc;
    }, {});

    // Iterate over each container and group them by their state
    containers.forEach((container) => {
      const state = container.State;

      // If state exists in containerGroups, populate it, otherwise skip it
      if (containerGroups[state]) {
        const ports = container.Ports.map((port) => ({
          publicPort: port.PublicPort,
          privatePort: port.PrivatePort,
          type: port.Type,
        }));

        containerGroups[state].containers.push({
          id: container.Id,
          name: container.Names[0].replace("/", ""),
          image: container.Image,
          ports: ports,
        });

        containerGroups[state].count += 1;
      }
    });

    // Prepare the summary with total counts by state
    const total = {};
    containerStates.forEach((state) => {
      total[state] = containerGroups[state].count;
    });

    const data = {
      containerCount: { total: containers.length, byState: total },
      data: containerGroups,
    };

    // Send the response
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
