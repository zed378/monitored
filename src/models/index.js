const { db } = require("../config");
const { logger } = require("../middleware/activityLog");

const { Users } = require("./users");
const { Hosts } = require("./hosts");
const { CPUInfo } = require("./cpu_infos");
const { DiskInfo } = require("./disk_infos");
const { DockerService } = require("./docker_services");
const { HostPlatform } = require("./host_platform");
const { HostService } = require("./host_services");
const { K8sNamsepace } = require("./k8s_namespaces");
const { K8sNode } = require("./k8s_nodes");
const { K8sPods } = require("./k8s_pods");
const { K8sService } = require("./k8s_services");
const { MemoryInfo } = require("./memory_infos");
const { NetSpeedInfo } = require("./net_speed_infos");
const { NetStatInfo } = require("./net_stat_infos");

CPUInfo.belongsTo(Hosts, {
  foreignKey: "host_id",
  targetKey: "id",
  as: "host",
});

DiskInfo.belongsTo(Hosts, {
  foreignKey: "host_id",
  targetKey: "id",
  as: "host",
});

DockerService.belongsTo(Hosts, {
  foreignKey: "host_id",
  targetKey: "id",
  as: "host",
});

HostPlatform.belongsTo(Hosts, {
  foreignKey: "host_id",
  targetKey: "id",
  as: "host",
});

HostService.belongsTo(Hosts, {
  foreignKey: "host_id",
  targetKey: "id",
  as: "host",
});

MemoryInfo.belongsTo(Hosts, {
  foreignKey: "host_id",
  targetKey: "id",
  as: "host",
});

NetSpeedInfo.belongsTo(Hosts, {
  foreignKey: "host_id",
  targetKey: "id",
  as: "host",
});

NetStatInfo.belongsTo(Hosts, {
  foreignKey: "host_id",
  targetKey: "id",
  as: "host",
});

async function Up() {
  try {
    await db.sync({ alter: true }); // Await the sync process
    console.log("Database Synced");
    logger.info("Database Synced");
  } catch (error) {
    console.error("Error syncing database:", error);
    logger.error("Error syncing database:", error);
  }
}

async function Down() {
  try {
    await db.drop({}); // Await the drop process
    console.log("Tables Dropped");
    logger.info("Tables Dropped");
  } catch (error) {
    console.error("Error dropping tables:", error);
    logger.error("Error dropping tables:", error);
  }
}

module.exports = {
  Up,
  Down,
  Users,
  CPUInfo,
  DiskInfo,
  DockerService,
  HostPlatform,
  HostService,
  Hosts,
  K8sNamsepace,
  K8sNode,
  K8sPods,
  K8sService,
  MemoryInfo,
  NetSpeedInfo,
  NetStatInfo,
};
