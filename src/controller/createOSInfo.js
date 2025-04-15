const {
  CPUInfo,
  Hosts,
  HostPlatform,
  DiskInfo,
  MemoryInfo,
} = require("../models");

exports.createHost = async (req, res) => {
  try {
    const { IP, name } = req.body;

    await Hosts.findOne({ host_name: name }).then(async (host) => {
      host &&
        res.status(400).send({
          status: "Failed",
          message:
            "Hostname already exist. Please, choose another name for hostname.",
        });

      !host &&
        (await Hosts.create({ host_name: name, ipv4: IP }).then(() => {
          res.status(200).send({
            status: "Success",
            message: "Success create host",
          });
        }));
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.createPlatform = async (req, res) => {
  try {
    const { host, platform } = req.body;

    await Hosts.findOne({ host_name: host }).then(async (host) => {
      await HostPlatform.create({ host_id: host.id, platform }).then(() => {
        res.status(200).send({
          status: "Success",
          message: "Success create platform record",
        });
      });
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.createCPUUsage = async (req, res) => {
  try {
    const { host, average_usage, total_core, detail_usage_per_core } = req.body;

    await Hosts.findOne({ host_name: host }).then(async (host) => {
      await CPUInfo.create({
        host_id: host.id,
        average_usage,
        total_core,
        detail_usage_per_core,
      }).then(() => {
        res.status(200).send({
          status: "Success",
          message: "Success create CPU info record",
        });
      });
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.createDiskUsage = async (req, res) => {
  try {
    const { host, data } = req.body;

    await Hosts.findOne({ host_name: host }).then(async (host) => {
      await DiskInfo.create({ host_id: host.id, data }).then(() => {
        res.status(200).send({
          status: "Success",
          message: "Success create Disk info record",
        });
      });
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};

exports.createMemoryUsage = async (req, res) => {
  try {
    await Hosts.findOne({ host_name: host }).then(async (host) => {
      await MemoryInfo.create({ host_id: host.id, data }).then(() => {
        res.status(200).send({
          status: "Success",
          message: "Success create Disk info record",
        });
      });
    });
  } catch (error) {
    res.status(400).send({
      status: "Failed",
      message: error.message,
    });
  }
};
