// src/models/Shift.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Initialize shift counter
let shiftCounter = 0;

const Shift = sequelize.define('Shift', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
        defaultValue: () => {
            shiftCounter++;
            return `WACLY-SHF-${String(shiftCounter).padStart(3, '0')}`;
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
    start_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    department_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'Departments',
            key: 'id'
        }
    },
    created_by: {
        type: DataTypes.STRING,
        allowNull: false,
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
        beforeUpdate: (shift) => {
            shift.updated_at = new Date();
        }
    }
});

// Define associations
Shift.associate = (models) => {
    Shift.hasMany(models.Schedule, {
        foreignKey: 'shift_id',
        as: 'schedules'
    });
    Shift.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
    });
    Shift.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });
};

// Static method to reset counter (useful for testing)
Shift.resetCounter = () => {
    shiftCounter = 0;
};

// Static method to get current counter value
Shift.getCurrentCounter = () => {
    return shiftCounter;
};

module.exports = Shift;