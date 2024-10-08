const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config");

const Users = db.define(
  "users",
  {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
    },
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    picture: {
      type: DataTypes.STRING,
      defaultValue: "default.svg",
    },
    role: {
      type: DataTypes.ENUM,
      values: ["ADMIN", "AUTHENTICATED"],
      defaultValue: "AUTHENTICATED",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isBan: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    otp: {
      type: DataTypes.INTEGER,
      defaultValue: 101010,
    },
    otpToken: {
      type: DataTypes.STRING,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      onUpdate: Sequelize.NOW,
    },
  },
  { freezeTableName: true, timestamps: true }
);

module.exports = { Users };
