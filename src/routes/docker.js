const express = require("express");
const router = express.Router();

const { listContainers } = require("../controller/checkDocker");

router.get("/containers", listContainers);

module.exports = router;
