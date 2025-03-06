// src/models/Department.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Initialize department counter
let departmentCounter = 0;

const Department = sequelize.define('Department', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
        defaultValue: () => {
            departmentCounter++;
            return `WACLY-DEPT-${String(departmentCounter).padStart(3, '0')}`;
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
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
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    timestamps: true,
    underscored: true,
    hooks: {
        beforeUpdate: (department) => {
            department.updated_at = new Date();
        }
    }
});

// Define associations
Department.associate = (models) => {
    Department.hasMany(models.User, {
        foreignKey: 'department_id',
        as: 'employees'
    });

    Department.belongsTo(models.User, {
        foreignKey: 'manager_id',
        as: 'manager',
        constraints: false // To avoid circular dependency issues
    });
};

// Static method to reset counter (useful for testing)
Department.resetCounter = () => {
    departmentCounter = 0;
};

// Static method to get current counter value
Department.getCurrentCounter = () => {
    return departmentCounter;
};

module.exports = Department;