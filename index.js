const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { Connection } = require("./src/config");
const { ensureFolderExisted } = require("./src/middleware/createFolder");
const { accessLog } = require("./src/middleware/accessLog");
const { formatErrorToHTML } = require("./src/middleware/convertToHtml");
const { cronBackup } = require("./src/middleware/backup");

const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");

const { activityLogger, logger } = require("./src/middleware/activityLog");

// Ensure necessary folders exist
ensureFolderExisted();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);
app.use(helmet());
app.use(xss());

// Logging
app.use(accessLog);
app.use(activityLogger);

// Routes
const backupRoutes = require("./src/routes/backup");
const getOSRoute = require("./src/routes/OSInfo");
const dockerRoutes = require("./src/routes/docker");
const k8sRoutes = require("./src/routes/k8s");
const svcListRoutes = require("./src/routes/sysctl");

// Endpoint
app.use("/backup", backupRoutes);
app.use("/info", getOSRoute);
app.use("/docker", dockerRoutes);
app.use("/k8s", k8sRoutes);
app.use("/svc", svcListRoutes);

app.get("/", (req, res) => {
  res.status(200).send({
    status: "Success",
    message: "Your API is running",
  });
});

app.get("/error", (req, res, next) => {
  const err = new Error("This is a test error");
  err.status = 500;
  next(err);
});

app.use((err, req, res, next) => {
  const errorMessage = `Error - IP: ${req.ip}, Method: ${req.method}, URL: ${
    req.originalUrl
  }, Status: ${err.status || 500}, Message: ${err.message}`;

  const errorLog = {
    message: errorMessage,
    error: err.stack,
  };

  logger.error(errorLog);

  res
    .status(err.status || 500)
    .send(formatErrorToHTML("Error Has Been Occured", err.stack));
});

Connection();
cronBackup();

const port = process.env.PORT;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  console.log(`Server is running on port ${port}`);
});
