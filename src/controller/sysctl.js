const { exec, spawn } = require("child_process");

exports.ServicesList = async (req, res) => {
  try {
    const LINUX = process.env.LINUX;
    const WINDOWS = process.env.WINDOWS;

    if (LINUX == 1) {
      const command = "systemctl list-units --type=service --all --no-pager";

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          return res
            .status(500)
            .send({ status: "Failed", message: error.message });
        }

        if (stderr) {
          console.error(`Error output: ${stderr}`);
          return res.status(500).send({ status: "Failed", message: stderr });
        }

        // Parse the output from systemctl to create a JSON object
        const services = stdout
          .split("\n")
          .slice(1) // Skip the header row
          .filter((line) => line.trim()) // Remove empty lines
          .map((line) => {
            const parts = line.trim().split(/\s+/);
            return {
              serviceName: parts[0], // Service name
              loadState: parts[1], // Load state (loaded, not-found, etc.)
              activeState: parts[2], // Active state (active, inactive, etc.)
              status: parts[3], // Sub-state (running, exited, etc.)
            };
          });

        // Separate the services into "Running" and "Stopped"
        const runningServices = services.filter(
          (service) => service.activeState === "active"
        );
        const stoppedServices = services.filter(
          (service) => service.activeState !== "active"
        );

        res.status(200).send({
          status: "Success",
          data: {
            Running: runningServices,
            Stopped: stoppedServices,
          },
        });
      });
    } else if (WINDOWS == 1) {
      const command = "sc query type= service state= all";

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return res
            .status(500)
            .send({ status: "Failed", message: error.message });
        }

        if (stderr) {
          console.error(`Stderr: ${stderr}`);
          return res.status(500).send({ status: "Failed", message: stderr });
        }

        // Parse and categorize services into 'Running' and 'Stopped'
        const services = { Running: [], Stopped: [] };
        const serviceBlocks = stdout.split("SERVICE_NAME:").slice(1);

        serviceBlocks.forEach((block) => {
          const lines = block.trim().split("\n");
          const serviceName = lines[0].trim();
          const statusLine = lines.find((line) => line.includes("STATE"));

          if (statusLine) {
            const status = statusLine.includes("RUNNING")
              ? "Running"
              : "Stopped";

            // Add the service to the corresponding category (Running or Stopped)
            services[status].push({ serviceName, status });
          }
        });

        // Now we get the PIDs for running services using tasklist
        const tasklistCommand = "tasklist /svc";
        exec(tasklistCommand, (taskError, taskStdout, taskStderr) => {
          if (taskError) {
            console.error(`Error executing tasklist: ${taskError.message}`);
            return res
              .status(500)
              .send({ status: "Failed", message: taskError.message });
          }

          // Parse the output of tasklist to extract service PIDs
          const taskList = taskStdout
            .split("\n")
            .filter((line) => line.trim() && !line.startsWith("Image Name"));

          services.Running.forEach((service) => {
            const task = taskList.find((taskLine) =>
              taskLine.includes(service.serviceName)
            );
            if (task) {
              const parts = task.trim().split(/\s+/);
              service.pid = parts[1]; // PID is the second part in tasklist output
            } else {
              service.pid = "N/A";
            }
          });

          res.status(200).send({
            status: "Success",
            data: services,
          });
        });
      });
    }
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};
