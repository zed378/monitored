const { Sequelize, DataTypes } = require("sequelize");
const { db } = require("../config");

const DockerService = db.define(
  "docker_services",
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
    running_container: {
      // type: DataTypes.ARRAY,
      type: DataTypes.JSONB,
      allowNull: false,
    },
    created_container: {
      // type: DataTypes.ARRAY,
      type: DataTypes.JSONB,
      allowNull: false,
    },
    exited_container: {
      // type: DataTypes.ARRAY,
      type: DataTypes.JSONB,
      allowNull: false,
    },
    restarting_container: {
      // type: DataTypes.ARRAY,
      type: DataTypes.JSONB,
      allowNull: false,
    },
    paused_container: {
      // type: DataTypes.ARRAY,
      type: DataTypes.JSONB,
      allowNull: false,
    },
    dead_container: {
      // type: DataTypes.ARRAY,
      type: DataTypes.JSONB,
      allowNull: false,
    },
    running_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exited_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    restarting_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paused_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dead_count: {
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

module.exports = { DockerService };
