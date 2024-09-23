const axios = require("axios");
const https = require("https");
const { urlAPI } = require("../constant/env");

const getToken = async () => {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false, // Disable SSL certificate validation
    });

    const response = await axios.post(
      urlAPI + "/auth",
      {
        username: "admin",
        password: "1qaz2wsx3edc",
      },
      {
        httpsAgent: agent,
      }
    );

    // Ensure the token (JWT) is returned correctly
    return response.data.jwt;
  } catch (error) {
    console.error("Error getting token:", error);
    throw new Error("Failed to retrieve token");
  }
};

module.exports = { getToken };
