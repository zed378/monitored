const urlAPI = process.env.PURL;
const API_KEY = process.env.PTOKEN;
const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;
const mailHost = process.env.MAIL_HOST;
const mailPort = process.env.MAIL_PORT;
const mailRecipients = process.env.MAIL_RECIPIENTS;
const portUser = process.env.PUSER;
const portPass = process.env.PPASS;
const cronJob = process.env.CRON_EXPRESSION;
const teamsHook = process.env.MSTEAMS_WEBHOOK_URL;

module.exports = {
  urlAPI,
  API_KEY,
  mailUser,
  mailPass,
  mailRecipients,
  mailHost,
  mailPort,
  portPass,
  portUser,
  cronJob,
  teamsHook,
};
