const { exec } = require("child_process");

exports.ServicesList = async (req, res) => {
  try {
    const LINUX = 0;
    const WINDOWS = 1;

    if (LINUX === 1) {
      // Adjusted command to read from the host's /proc
      const command = "ps -eo pid,comm --sort=pid";

      exec(command, { cwd: "/host_proc" }, (error, stdout, stderr) => {
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

        // Parse the output to create a JSON object
        const services = stdout
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

        // Output the list of running services as JSON
        console.log(JSON.stringify(services, null, 2));
      });
    } else if (WINDOWS === 1) {
      // If you want to list only running services just delete "state= all"
      // If you want to list only stopped services replace
      // "state= all" into "state= inactive"
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

        const services = [];
        const serviceBlocks = stdout.split("SERVICE_NAME:").slice(1);

        serviceBlocks.forEach((block) => {
          const lines = block.trim().split("\n");
          const serviceName = lines[0].trim();
          const statusLine = lines.find((line) => line.includes("STATE"));

          if (statusLine) {
            const status = statusLine.includes("RUNNING")
              ? "Running"
              : "Stopped";
            services.push({ serviceName, status });
          }
        });

        res.status(200).send({
          status: "Success",
          data: services,
        });

        console.log(services);
      });
    }
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};
