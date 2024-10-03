const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config");

const HostService = db.define(
  "host_services",
  {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    host_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    service_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    running_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stopped_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    running_service: {
      // type: DataTypes.ARRAY,
      type: DataTypes.JSONB,
      allowNull: false,
    },
    stopped_service: {
      // type: DataTypes.ARRAY,
      type: DataTypes.JSONB,
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

module.exports = { HostService };
