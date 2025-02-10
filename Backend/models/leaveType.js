const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Correct path

const LeaveType = sequelize.define('LeaveType', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  daysAllowed: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  carryForward: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  tableName: 'LeaveTypes', // Explicitly define the table name
});

module.exports = LeaveType;