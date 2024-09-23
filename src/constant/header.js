const axios = require("axios");
const { API_KEY, urlAPI } = require("./env");
const https = require("https");

const getToken = async () => {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false,
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

    return response.data.jwt;
  } catch (error) {
    console.error("Error getting token:", error);
    throw new Error("Failed to retrieve token");
  }
};

const getHeader = async () => {
  try {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error("Error setting headers:", error);
    throw new Error("Failed to set headers");
  }
};

const header = { "Content-Type": "application/json", "x-api-key": API_KEY };

module.exports = { getHeader, header };
