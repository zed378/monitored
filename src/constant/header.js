const { API_KEY } = require("./env");

const header = { "Content-Type": "application/json", "x-api-key": API_KEY };

module.exports = { header };
