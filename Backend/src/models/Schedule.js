// src/models/Schedule.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Initialize schedule counter
let scheduleCounter = 0;

const Schedule = sequelize.define('Schedule', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
        defaultValue: () => {
            scheduleCounter++;
            return `WACLY-SCH-${String(scheduleCounter).padStart(3, '0')}`;
        }
    },
    shift_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'Shifts',
            key: 'id'
        }
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            notEmpty: true
        }
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            notEmpty: true
        }
    },
    is_recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    recurring_type: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
        allowNull: true
    },
    recurring_days: {
        type: DataTypes.JSON, // Changed from ARRAY to JSON for MySQL compatibility
        defaultValue: [],
        allowNull: true
    },
    recurring_interval: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: true,
        validate: {
            min: 1,
            max: 31
        }
    },
    recurring_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: true
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active'
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
        beforeUpdate: (schedule) => {
            schedule.updated_at = new Date();
        },
        beforeCreate: async (schedule) => {
            // Validate that end_date is after start_date
            if (schedule.end_date <= schedule.start_date) {
                throw new Error('End date must be after start date');
            }
        }
    }
});

// Define associations
Schedule.associate = (models) => {
    Schedule.belongsTo(models.Shift, {
        foreignKey: 'shift_id',
        as: 'shift',
        onDelete: 'CASCADE'
    });
    Schedule.belongsToMany(models.User, {
        through: 'schedule_employees',
        foreignKey: 'schedule_id',
        otherKey: 'user_id',
        as: 'employees'
    });
};

// Static method to reset counter
Schedule.resetCounter = () => {
    scheduleCounter = 0;
};

// Static method to get current counter value
Schedule.getCurrentCounter = () => {
    return scheduleCounter;
};

// Instance method to check if schedule overlaps with another
Schedule.prototype.overlaps = function(otherSchedule) {
    return (
        this.start_date < otherSchedule.end_date &&
        this.end_date > otherSchedule.start_date
    );
};

module.exports = Schedule;