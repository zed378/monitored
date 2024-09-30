const express = require("express");
const router = express.Router();

const {
  getEnvironment,
  getAllNS,
  getServices,
  getMetrics,
  getNodeMetrics,
} = require("../controller/k8s");

router.get("/env", getEnvironment);
router.get("/ns", getAllNS);
router.get("/svc", getServices);
router.get("/metrics", getMetrics);
router.get("/nodes", getNodeMetrics);

module.exports = router;
