const express = require("express");
const router = express.Router();
// const { auth } = require("../middleware/auth");

const {
  backup,
  restoreDataBackup,
  restoreLogBackup,
  dumpMySQL,
  restoreMySQL,
  deleteOldFIles,
} = require("../controller/backup");

router.get("/start", backup);
router.get("/restore/data/:filename", restoreDataBackup);
router.get("/restore/log/:filename", restoreLogBackup);
router.get("/dump/mysql", dumpMySQL);
router.get("/restore/mysql/:filename", restoreMySQL);
router.get("/delete", deleteOldFIles);

module.exports = router;
