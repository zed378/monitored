const express = require("express");
const router = express.Router();

const { ServicesList } = require("../controller/sysctl");

router.get("/lists", ServicesList);

module.exports = router;
