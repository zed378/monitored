const axios = require("axios");
require("dotenv").config();
const cron = require("node-cron");

const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;
const mailHost = process.env.MAIL_HOST;
const mailPort = process.env.MAIL_PORT;
const mailRecipients = process.env.MAIL_RECIPIENTS;
const cronJob = process.env.CRON_EXPRESSION;
const teamsHook = process.env.MSTEAMS_WEBHOOK_URL;

const fs = require("fs");
const mustache = require("mustache");
const nodemailer = require("nodemailer");
const path = require("path");

const template = fs.readFileSync(path.join(__dirname, "reports.html"), "utf8");

const transporter = nodemailer.createTransport({
  host: mailHost,
  secure: false,
  port: mailPort,
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
    const response = await axios.get("http://localhost:6789/k8s/metrics", {
      timeout: 5000,
    });

    const envs = response.data?.data?.environments;

    if (!Array.isArray(envs)) {
      throw new Error("Unexpected data format");
    }

    const problematicPods = [];

    for (const env of envs) {
      for (const ns of env.namespaces || []) {
        const namespace = ns.namespace || "unknown";

        const pods = Array.isArray(ns.pods) ? ns.pods : [];

        const nonRunning = pods.filter(
          (pod) => pod.phase !== "Running" && pod.phase !== "Succeeded",
        );

        problematicPods.push(
          ...nonRunning.map((pod) => ({
            ...pod,
            environment: env.environment?.name || "unknown",
          })),
        );
      }
    }

    return problematicPods;
  } catch (err) {
    console.error("Error fetching metrics:", err.response?.data || err.message);
    return [];
  }
}

async function sendMail(pods) {
  try {
    if (!mailRecipients) {
      throw new Error("MAIL_RECIPIENTS is not defined");
    }

    if (!Array.isArray(pods) || pods.length === 0) {
      console.log("✅ No problematic pods found. Skipping email.");
      return;
    }

    const recipients = mailRecipients
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    const htmlContent = mustache.render(template, {
      pods,
      total: pods.length,
    });

    const mailOptions = {
      from: `"BPN Alert" <${mailUser}>`,
      to: recipients,
      subject: `🚨 ${pods.length} Problematic Pod(s) Detected`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`📨 Alert sent to ${recipients.join(", ")}`);
    console.log(`MessageId: ${info.messageId}`);
  } catch (err) {
    console.error("❌ Error sending emails:", err.message);
  }
}

async function sendTeamsAlert(pods) {
  try {
    if (!teamsHook) {
      console.log("⚠️ MSTEAMS_WEBHOOK_URL not set");
      return;
    }

    if (!pods || pods.length === 0) {
      console.log("✅ No problematic pods (Teams skipped)");
      return;
    }

    const chunkSize = 20;
    const chunks = chunkArray(pods, chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const facts = chunk.map((pod) => ({
        name: `${pod.environment} / ${pod.namespace}`,
        value: `**${pod.name}** → ${pod.phase}`,
      }));

      const payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        summary: "Kubernetes Alert",
        themeColor: "FF0000",
        title: `🚨 Pods Alert (${i + 1}/${chunks.length})`,
        sections: [
          {
            activityTitle: `Detected ${pods.length} problematic pods`,
            facts,
            markdown: true,
          },
        ],
      };

      await axios.post(teamsHook, payload);

      console.log(`📣 Teams alert sent (${i + 1}/${chunks.length})`);

      // small delay to avoid rate limit
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch (err) {
    console.error("❌ Teams alert error:", err.message);
  }
}

function scheduledCheckService() {
  console.log("Cron started!");

  cron.schedule(cronJob ? cronJob : "*/10 * * * *", async () => {
    try {
      const pods = (await getNonRunningPods()).map((pod) => ({
        ...pod,
        isCritical: pod.phase === "Failed" || pod.phase === "CrashLoopBackOff",
      }));

      if (!pods.length) {
        console.log("✅ No problematic pods.");
        return;
      }

      await sendMail(pods);
      await sendTeamsAlert(pods);
    } catch (error) {
      console.error("Error during alert:", error.message);
    }
  });
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

module.exports = { scheduledCheckService };
