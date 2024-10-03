const express = require("express");
const router = express.Router();

const { migrate, dropTable } = require("../controller/migration");

router.get("/up", migrate);
router.get("/down", dropTable);

module.exports = router;
