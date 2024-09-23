const express = require("express");
const router = express.Router();

const {
  getCPUUsage,
  detectOperatingSystem,
  getDiskUsage,
  getMemoryUsage,
  getNetworkSpeed,
} = require("../controller/getOSInfo");

router.get("/cpu", getCPUUsage);
router.get("/platform", detectOperatingSystem);
router.get("/disk", getDiskUsage);
router.get("/network", getNetworkSpeed);
router.get("/memory", getMemoryUsage);

module.exports = router;
