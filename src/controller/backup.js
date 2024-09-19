const {
  backupAndZip,
  extractZip,
  deleteOldFiles,
} = require("../middleware/backup");
const moment = require("moment-timezone");
const { exec } = require("child_process");

const mysqldump = require("mysqldump");
const mysql = require("mysql2");

const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const rootDir = path.join(__dirname, "../../");

const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const user = process.env.DB_USER;
const pass = process.env.DB_PASS;
const port = process.env.DB_PORT;

exports.backup = async (req, res) => {
  try {
    backupAndZip();

    res.status(200).send({
      status: "Success",
      message: "Backup data started successfully",
    });
  } catch (error) {
    res.status(400).send({
      status: "Error",
      message: error.message,
    });
  }
};

exports.restoreDataBackup = async (req, res) => {
  const { filename } = req.params;

  if (!filename) {
    return res.status(400).send({
      status: "Error",
      message: "Filename is required",
    });
  }

  const backupFilePath = path.join(rootDir, "backup", filename);

  if (!(await fse.pathExists(backupFilePath))) {
    return res.status(404).send({
      status: "Error",
      message: "Backup file not found",
    });
  }

  const dataDir = path.join(rootDir, "data");

  try {
    // Extract the backup zip file and replace the existing files
    await extractZip(backupFilePath, dataDir);

    res.status(200).send({
      status: "Success",
      message: `Data backup ${filename} restored successfully`,
    });
  } catch (error) {
    res.status(500).send({
      status: "Error",
      message: `Error restoring data backup: ${error.message}`,
    });
  }
};

exports.restoreLogBackup = async (req, res) => {
  const { filename } = req.params;

  if (!filename) {
    return res.status(400).send({
      status: "Error",
      message: "Filename is required",
    });
  }

  const backupFilePath = path.join(rootDir, "backup", filename);

  if (!(await fse.pathExists(backupFilePath))) {
    return res.status(404).send({
      status: "Error",
      message: "Backup file not found",
    });
  }

  const logDir = path.join(rootDir, "log");

  try {
    await extractZip(backupFilePath, logDir);

    res.status(200).send({
      status: "Success",
      message: `Log backup ${filename} restored successfully`,
    });
  } catch (error) {
    res.status(500).send({
      status: "Error",
      message: `Error restoring log backup: ${error.message}`,
    });
  }
};

exports.dumpMySQL = async (req, res) => {
  const prefix = moment().tz("Asia/Jakarta").format("YYYY-MMMM-DD__HH-mm-ss");
  try {
    const dumpFilePath = path.resolve(
      rootDir,
      `backup/${prefix}-mysql-backup.sql`
    );
    await mysqldump({
      connection: {
        host,
        user,
        password: pass,
        database: dbName,
        port,
      },
      dumpToFile: dumpFilePath,
    });

    res.status(200).send({
      status: "Success",
      message: "Database dumped started successfully.",
    });
  } catch (error) {
    res.status(500).send({
      status: "Error",
      message: `Error dumping database: ${error.message}`,
    });
  }
};

exports.restoreMySQL = async (req, res) => {
  try {
    const { filename } = req.params;

    const dumpFilePath = path.resolve(rootDir, `backup/${filename}`);
    if (!fs.existsSync(dumpFilePath)) {
      return res.status(404).send("Dump file not found.");
    }

    const conn = mysql.createConnection({
      host,
      port,
      user,
      password: pass,
      database: dbName,
      multipleStatements: true,
    });

    let dumpContent = fs.readFileSync(dumpFilePath, { encoding: "utf-8" });

    conn.query(dumpContent, (error, result) => {
      if (error) {
        console.error("Error restoring database:", error);
        return res.status(500).send({
          status: "Error",
          message: error,
        });
      }

      res.status(200).send({
        status: "Success",
        message: "Database restored successfully.",
      });
    });

    conn.end();
  } catch (error) {
    res.status(500).send({
      status: "Error",
      message: `Error restore database: ${error.message}`,
    });
  }
};

exports.deleteOldFIles = async (req, res) => {
  try {
    deleteOldFiles().then(() => {
      res.status(200).send({
        status: "Success",
        message: "Delete old files successfully.",
      });
    });
  } catch (error) {
    res.status(500).send({
      status: "Error",
      message: `Error delete old files: ${error.message}`,
    });
  }
};
