const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  managerId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Employees',
      key: 'emp_id'
    }
  },
  employeeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  activeProjects: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  averagePerformance: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  }
});

module.exports = Department;