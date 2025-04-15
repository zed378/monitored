const express = require("express");
const router = express.Router();

const {
  getCPUUsage,
  detectOperatingSystem,
  getDiskUsage,
  getMemoryUsage,
  getNetworkSpeed,
  getNetworkStats,
} = require("../controller/getOSInfo");

const {
  createHost,
  createCPUUsage,
  createPlatform,
  createDiskUsage,
} = require("../controller/createOSInfo");

// get Info
router.get("/cpu", getCPUUsage);
router.get("/platform", detectOperatingSystem);
router.get("/disk", getDiskUsage);
router.get("/network", getNetworkSpeed);
router.get("/netstat", getNetworkStats);
router.get("/memory", getMemoryUsage);

// create info
router.post("/host", createHost);
router.post("/cpu", createCPUUsage);
router.post("/platform", createPlatform);
router.post("/disk", createDiskUsage);

module.exports = router;
