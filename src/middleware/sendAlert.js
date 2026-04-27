const axios = require("axios");
require("dotenv").config();
const cron = require("node-cron");

const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;

const fs = require("fs");
const mustache = require("mustache");
const nodemailer = require("nodemailer");
const path = require("path");

const template = fs.readFileSync(path.join(__dirname, "reports.html"), "utf8");

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  secure: false,
  port: 587,
  tls: {
    rejectUnauthorized: false,
  },
  auth: {
    user: mailUser,
    pass: mailPass,
  },
});

async function getNonRunningPods() {
  try {
    const response = await axios.get("http://localhost:6789/k8s/metrics");

    const envs = response.data?.data?.environments;

    if (!Array.isArray(envs)) {
      throw new Error("Unexpected data format");
    }

    const problematicPods = [];

    for (const env of envs) {
      for (const ns of env.namespaces || []) {
        const namespace = ns.namespace;

        if (
          !Array.isArray(ns.pods) ||
          namespace.toLowerCase().includes("kube") ||
          namespace.toLowerCase().includes("cert-manager")
        ) {
          continue;
        }

        const nonRunning = ns.pods.filter(
          (pod) => pod.phase !== "Running" && pod.phase !== "Succeeded",
        );

        problematicPods.push(
          ...nonRunning.map((pod) => ({
            ...pod,
            environment: env.environment?.name,
          })),
        );
      }
    }

    return problematicPods;
  } catch (err) {
    console.error("Error fetching metrics:", err.message);
    return [];
  }
}

async function sendMail() {
  try {
    const pods = await getNonRunningPods();

    if (pods.length === 0) {
      console.log("✅ No problematic pods found.");
      return;
    }

    const htmlContent = mustache.render(template, {
      pods, // <-- pass array instead of single pod
    });

    const mailOptions = {
      from: `"BPN Alert" <${mailUser}>`,
      to: "tech.infra@bodha.co.id",
      subject: `🚨 ${pods.length} Problematic Pods Detected`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`📨 Alert sent. MessageId: ${info.messageId}`);
  } catch (err) {
    console.error("❌ Error sending emails:", err.message);
  }
}

function scheduledCheckService() {
  console.log("Cron started!");

  cron.schedule("*/10 * * * *", async () => {
    try {
      sendMail();
    } catch (error) {
      console.error("Error during sending alert request:", error.message);
    }
  });
}

module.exports = { scheduledCheckService };
