const os = require("os");
const si = require("systeminformation");

function getCPUUsage() {
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
      rest: datas,
      average: parseFloat(averageUsage.toFixed(2)),
      total: cpusEnd.length,
    };

    return data;
  }, 100);
}

function getMemoryUsage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const data = {
    total: totalMemory,
    used: usedMemory,
    free: freeMemory,
  };

  return data;
}

async function getNetworkSpeed() {
  const firstSnapshot = await si.networkStats();

  return new Promise((resolve) => {
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
    }, 100);
  });
}

async function getNetworkStats() {
  const networkStats = await si.networkStats();
  networkStats &&
    networkStats.forEach((network, index) => {
      console.log(`Interface ${index}:`);
      console.log(`   Sent: ${(network.tx_bytes / 1024 / 1024).toFixed(2)} MB`);
      console.log(
        `   Received: ${(network.rx_bytes / 1024 / 1024).toFixed(2)} MB`
      );
    });
}

async function getDiskUsage() {
  try {
    const data = await si.fsSize();

    const res = data.map((item) => {
      return {
        fileSystem: item.fs,
        total: item.size,
        used: item.used,
        available: item.available,
        useInPercent: item.use,
      };
    });

    return res;
  } catch (err) {
    console.error("Error fetching disk usage:", err);
  }
}

function detectOperatingSystem() {
  const platform = os.platform();

  switch (platform) {
    case "aix":
      return "IBM AIX";
    case "darwin":
      return "macOS";
    case "freebsd":
      return "FreeBSD";
    case "linux":
      return "Linux";
    case "openbsd":
      return "OpenBSD";
    case "sunos":
      return "SunOS";
    case "win32":
      return "Windows";
    default:
      return "Unknown OS";
  }
}

// getCPUUsage();
// getMemoryUsage();
// getNetworkStats();
// getNetworkSpeed().then((speed) => console.log(speed));
// getDiskUsage().then((res) => console.log(res));
