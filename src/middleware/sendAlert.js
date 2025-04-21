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

async function getNonRunningPods() {
  try {
    const response = await axios.get("http://localhost:6789/k8s/metrics");
    const data = response.data?.data?.lists;

    if (!Array.isArray(data)) {
      throw new Error("Unexpected data format");
    }

    const problematicPods = [];

    for (const ns of data) {
      if (
        !Array.isArray(ns.pods) ||
        ns.namespace.toLowerCase().includes("kube") ||
        ns.namespace.toLowerCase().includes("cert-manager")
      )
        continue;

      const nonRunning = ns.pods.filter(
        (pod) => pod.phase !== "Running" && pod.phase !== "Succeeded"
      );

      problematicPods.push(...nonRunning);
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
      console.log("✅ No problematic pods found. No emails sent.");
      return;
    }

    for (const pod of pods) {
      const { name, namespace, phase, hostIP } = pod;

      const htmlContent = mustache.render(template, {
        pod: name,
        status: phase,
        namespace,
        host: hostIP,
      });

      const mailOptions = {
        from: `"BPN Alert" <${mailUser}>`,
        to: "tech.infra@bodha.co.id",
        subject: `🚨 Pod Issue: ${name} in ${namespace}`,
        html: htmlContent,
      };

      const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        secure: false,
        port: 587,
        tls: {
          ciphers: "SSLv3",
          rejectUnauthorized: false,
        },
        auth: {
          user: mailUser,
          pass: mailPass,
        },
        debug: true,
        logger: true,
      });

      const info = await transporter.sendMail(mailOptions);
      console.log(
        `📨 Sent alert for pod "${name}" - MessageId: ${info.messageId}`
      );

      // Close SMTP connection
      transporter.close();

      // Wait for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
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
