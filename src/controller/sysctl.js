const { exec, execSync } = require("child_process");

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
              pid: null, // Placeholder for PID
            };
          });

        // Separate the services into "Running" and "Stopped"
        const runningServices = services.filter(
          (service) =>
            service.activeState === "active" && service.status === "running"
        );
        const stoppedServices = services.filter(
          (service) =>
            service.activeState !== "active" && service.status !== "running"
        );

        // Get the PIDs for running services
        runningServices.forEach((service, index) => {
          try {
            // Fetch detailed information about the service using systemctl show
            const serviceDetails = execSync(
              `systemctl show ${service.serviceName} --property=MainPID`
            ).toString();
            const pidMatch = serviceDetails.match(/MainPID=(\d+)/);
            if (pidMatch && pidMatch[1] !== "0") {
              runningServices[index].pid = pidMatch[1]; // Assign the PID if found
            } else {
              runningServices[index].pid = "N/A"; // If PID is 0 or not found, set as N/A
            }
          } catch (pidError) {
            console.error(
              `Error fetching PID for ${service.serviceName}: ${pidError.message}`
            );
            runningServices[index].pid = "N/A"; // In case of an error, set as N/A
          }
        });

        res.status(200).send({
          status: "Success",
          data: {
            total: {
              running: runningServices.length,
              stopped: stoppedServices.length,
            },
            running: runningServices,
            stopped: stoppedServices,
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
        const services = { running: [], stopped: [] };
        const serviceBlocks = stdout.split("SERVICE_NAME:").slice(1);

        serviceBlocks.forEach((block) => {
          const lines = block.trim().split("\n");
          const serviceName = lines[0].trim();
          const statusLine = lines.find((line) => line.includes("STATE"));

          if (statusLine) {
            const status = statusLine.includes("RUNNING")
              ? "running"
              : "stopped";

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

          services.running.forEach((service) => {
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
            data: {
              total: {
                running: services.running.length,
                stopped: services.stopped.length,
              },
              ...services,
            },
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
