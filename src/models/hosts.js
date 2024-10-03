const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config");

const Hosts = db.define(
  "hosts",
  {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    host_name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    ipv4: {
      type: DataTypes.CIDR,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      onUpdate: Sequelize.NOW,
      allowNull: false,
    },
  },
  { freezeTableName: true, timestamps: true }
);

module.exports = { Hosts };
