const express = require("express");
const router = express.Router();

const {
  getDockerContainers,
  getDockerHostMetrics,
} = require("../controller/docker");

router.get("/containers", getDockerContainers);
router.get("/metrics", getDockerHostMetrics);

module.exports = router;
