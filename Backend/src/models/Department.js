const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: DataTypes.TEXT,
  manager_id: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  updated_at: DataTypes.DATE
}, {
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (department) => {
      const count = await Department.count();
      department.id = `WACLY-DEPT-${String(count + 1).padStart(3, '0')}`;
      department.updated_at = new Date();
    },
    beforeUpdate: (department) => {
      department.updated_at = new Date();
    }
  }
});

module.exports = Department;