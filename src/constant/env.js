const urlAPI = process.env.PURL;
const API_KEY = process.env.PTOKEN;
const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;
const mailRecipients = process.env.MAIL_RECIPIENTS;

module.exports = { urlAPI, API_KEY, mailUser, mailPass, mailRecipients };
