const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config");

const MemoryInfo = db.define(
  "memory_infos",
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
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    used: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    free: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usedInPercent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    freeInPercent: {
      type: DataTypes.INTEGER,
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

module.exports = { MemoryInfo };
