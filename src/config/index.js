const { Sequelize } = require("sequelize");

// Load environment variables
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const user = process.env.DB_USER;
const pass = process.env.DB_PASS;
const port = process.env.DB_PORT;
const dialect = process.env.DB_DIALECT;

const config = {
  dialect,
  host,
  port,
  database: dbName,
  username: user,
  password: pass,
  timezone: "+07:00",
  dialectOptions: {
    ssl: false,
    useUTC: false,
    timezone: "+07:00",
  },
  supportsSearchPath: false,
};

// Function to create database if it doesn't exist
async function createDatabaseIfNotExists() {
  const sequelize = new Sequelize("", user, pass, {
    host,
    port,
    dialect,
  });

  try {
    await sequelize
      .query(`CREATE DATABASE "${dbName}";`, { raw: true })
      .catch((err) => {
        // Error code 42P04 indicates the database already exists in PostgreSQL
        if (err.original.code !== "42P04") {
          throw err;
        }
      });
    console.log(`Database ${dbName} created or already exists.`);
  } catch (error) {
    console.error("Unable to create database:", error.message);
    return false;
  } finally {
    await sequelize.close();
    return true;
  }
}

const db = new Sequelize(config);

async function Connection() {
  try {
    await createDatabaseIfNotExists();
    await db.authenticate();
    console.log("DB Connected");
  } catch (error) {
    console.log({
      status: "DB Connection Failed",
      message: error,
    });
    await db.authenticate();
  }
}

module.exports = { db, Connection };
