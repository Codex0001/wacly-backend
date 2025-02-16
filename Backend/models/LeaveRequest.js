const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Employee = require('./Employee');

const LeaveRequest = sequelize.define('LeaveRequest', {
  employee_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
        model: Employee,
        key: 'emp_id'
    }
},

  type: {
    type: DataTypes.ENUM('annual', 'sick', 'personal'),
    allowNull: false
  },

  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  }
}, {
  timestamps: true,
  tableName: 'leave_requests'
});

LeaveRequest.belongsTo(Employee, { foreignKey: 'employee_id' });


module.exports = LeaveRequest;