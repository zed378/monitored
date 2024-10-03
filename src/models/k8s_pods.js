const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config");

const K8sPods = db.define(
  "k8s_pods",
  {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    pods_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pods_pending: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pods_running: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pods_succeeded: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pods_failed: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pods_unknown: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pods_crashloopback: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pods_data: {
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

module.exports = { K8sPods };
