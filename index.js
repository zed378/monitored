const express = require("express");
require("dotenv").config();
const cors = require("cors");

const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");

const { scheduledCheckService } = require("./src/middleware/sendAlert");

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

// Routes
const k8sRoutes = require("./src/routes/k8s");

// Endpoint
app.use("/k8s", k8sRoutes);

app.get("/", (req, res) => {
  res.status(200).send({
    status: "Success",
    message: "Your API is running",
  });
});

scheduledCheckService();

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
