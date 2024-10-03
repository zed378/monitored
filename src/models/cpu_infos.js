const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config");

const CPUInfo = db.define(
  "cpu_infos",
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
    average_usage: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_core: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    detail_usage_per_core: {
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

module.exports = { CPUInfo };
