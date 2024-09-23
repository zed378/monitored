const os = require("os");
const si = require("systeminformation");

exports.getCPUUsage = async (req, res) => {
  try {
    const cpusStart = os.cpus();

    setTimeout(() => {
      const cpusEnd = os.cpus();

      let datas = cpusEnd.map((item, index) => {
        let totalStart = 0;
        let idleStart = cpusStart[index].times.idle;
        let totalEnd = 0;
        let idleEnd = item.times.idle;

        for (let type in cpusStart[index].times) {
          totalStart += cpusStart[index].times[type];
          totalEnd += item.times[type];
        }

        let totalDiff = totalEnd - totalStart;
        let idleDiff = idleEnd - idleStart;
        let usage = 100 - Math.round((100 * idleDiff) / totalDiff);

        return {
          name: "CPU " + index,
          usage,
        };
      });

      let totalUsage = datas.reduce((sum, cpu) => sum + cpu.usage, 0);
      let averageUsage = totalUsage / cpusEnd.length;

      let data = {
        average: parseFloat(averageUsage.toFixed(2)),
        total: cpusEnd.length,
        details: datas,
      };

      res.status(200).send({
        status: "Success",
        data,
      });
    }, 100);
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.getMemoryUsage = async (req, res) => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const data = {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
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

exports.getNetworkSpeed = async (req, res) => {
  try {
    const firstSnapshot = await si.networkStats();

    new Promise((resolve) => {
      setTimeout(async () => {
        const secondSnapshot = await si.networkStats();
        const results = [];

        secondSnapshot.forEach((network, index) => {
          const first = firstSnapshot[index];

          const downloadSpeed = network.rx_bytes - first.rx_bytes;
          const uploadSpeed = network.tx_bytes - first.tx_bytes;

          results.push({
            interface: network.iface,
            downloadSpeed,
            uploadSpeed,
          });
        });

        resolve(results);
      }, 1000);
    }).then((result) => {
      res.status(200).send({
        status: "Success",
        data: result,
      });
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

// exports.getNetworkStats = async (req, res) => {
//   const networkStats = await si.networkStats();
//   networkStats &&
//     networkStats.forEach((network, index) => {
//       console.log(`Interface ${index}:`);
//       console.log(`   Sent: ${(network.tx_bytes / 1024 / 1024).toFixed(2)} MB`);
//       console.log(
//         `   Received: ${(network.rx_bytes / 1024 / 1024).toFixed(2)} MB`
//       );
//     });
// };

exports.getDiskUsage = async (req, res) => {
  try {
    const data = await si.fsSize();

    const result = data.map((item) => {
      return {
        fileSystem: item.fs,
        total: item.size,
        used: item.used,
        available: item.available,
        useInPercent: item.use,
      };
    });

    res.status(200).send({
      status: "Success",
      data: result,
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.detectOperatingSystem = async (req, res) => {
  try {
    const platform = os.platform();

    let OS;

    switch (platform) {
      case "aix":
        OS = "IBM AIX";
        break;
      case "darwin":
        OS = "macOS";
        break;
      case "freebsd":
        OS = "FreeBSD";
        break;
      case "linux":
        OS = "Linux";
        break;
      case "openbsd":
        OS = "OpenBSD";
        break;
      case "sunos":
        OS = "SunOS";
        break;
      case "win32":
        OS = "Windows";
        break;
      default:
        OS = "Unknown OS";
    }

    res.status(200).send({
      status: "Success",
      data: { platform: OS },
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};
