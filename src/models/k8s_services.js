const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config");

const K8sService = db.define(
  "k8s_services",
  {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    services_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    services_data: {
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

module.exports = { K8sService };
