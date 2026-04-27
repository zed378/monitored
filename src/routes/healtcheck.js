const express = require('express');
const router = express.Router();

const { healthCheck, portainerHealth } = require('../controller/healthcheck');

router.get('/check', healthCheck);
router.get('/ready', portainerHealth);

module.exports = router;
