const { exec, spawn } = require("child_process");

exports.ServicesList = async (req, res) => {
  try {
    const LINUX = process.env.LINUX;
    const WINDOWS = process.env.WINDOWS;

    if (LINUX == 1) {
      const command = "ps";
      const args = ["-eo", "pid,comm", "--sort=pid"];

      const child = spawn(command, args, { cwd: "/host_proc" });

      let output = "";
      let errorOutput = "";

      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
          console.error(`Command exited with code ${code}`);
          return res
            .status(500)
            .send({ status: "Failed", message: errorOutput });
        }

        // Parse the output to create a JSON object
        const services = output
          .split("\n")
          .slice(1) // Skip the header row
          .filter((line) => line.trim()) // Remove any empty lines
          .map((line) => {
            const parts = line.trim().split(/\s+/);
            return {
              pid: parts[0], // Process ID
              command: parts.slice(1).join(" "), // Command name (in case it has spaces)
            };
          });

        res.status(200).send({
          status: "Success",
          data: services,
        });
      });

      child.on("error", (error) => {
        console.error(`Error executing command: ${error.message}`);
        return res
          .status(500)
          .send({ status: "Failed", message: error.message });
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
