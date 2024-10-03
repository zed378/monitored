// const { Up, Down } = require("../config/migrate");
const { Up, Down } = require("../models");

exports.migrate = async (req, res) => {
  try {
    Up();

    res.status(200).send({
      status: "Success",
      message: "Database table migrate success",
    });
  } catch (error) {
    res.status(400).send({
      status: "Error",
      message: error.message,
    });
  }
};

exports.dropTable = async (req, res) => {
  try {
    Down();

    res.status(200).send({
      status: "Success",
      message: "Database table drop successfully",
    });
  } catch (error) {
    res.status(400).send({
      status: "Error",
      message: error.message,
    });
  }
};
