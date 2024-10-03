const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config");

const NetSpeedInfo = db.define(
  "net_speed_infos",
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
    data: {
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

module.exports = { NetSpeedInfo };
