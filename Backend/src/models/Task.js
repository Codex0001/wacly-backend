// models/Task.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

let taskCounter = 0;

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
        defaultValue: () => {
            taskCounter++;
            return `WACLY-TASK-${String(taskCounter).padStart(4, '0')}`;
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    assigned_to: {
        type: DataTypes.STRING,
        allowNull: true, // Changed to allow null for ON DELETE SET NULL
        references: {
            model: 'Users',
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
    department_id: {
        type: DataTypes.STRING,
        allowNull: true, // Changed to allow null for ON DELETE SET NULL
        references: {
            model: 'Departments',
            key: 'id'
        }
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            isAfter: new Date().toISOString() // Ensure deadline is in the future
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    completion_date: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: 'tasks', // Explicitly set table name
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (task) => {
            // Set created_at and updated_at
            const now = new Date();
            task.created_at = now;
            task.updated_at = now;
        },
        beforeUpdate: (task) => {
            // Update the updated_at timestamp
            task.updated_at = new Date();
            if (task.changed('status') && task.status === 'completed' && !task.completion_date) {
                task.completion_date = new Date();
            }
        }
    }
});

// Associations
Task.associate = (models) => {
    Task.belongsTo(models.User, {
        foreignKey: 'assigned_to',
        as: 'assignee',
        onDelete: 'SET NULL'
    });

    Task.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'NO ACTION'
    });

    Task.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department',
        onDelete: 'SET NULL'
    });
};

// Static methods
Task.resetCounter = () => {
    taskCounter = 0;
};

Task.getCurrentCounter = () => {
    return taskCounter;
};

// Instance methods
Task.prototype.isOverdue = function() {
    return new Date() > this.deadline;
};

Task.prototype.getDurationInDays = function() {
    const start = this.created_at;
    const end = this.completion_date || new Date();
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

// Model methods
Task.getTasksByDepartment = async function(departmentId) {
    return await this.findAll({
        where: { department_id: departmentId },
        include: [
            {
                model: sequelize.models.User,
                as: 'assignee',
                attributes: ['id', 'first_name', 'last_name']
            },
            {
                model: sequelize.models.Department,
                as: 'department',
                attributes: ['id', 'name']
            }
        ]
    });
};

Task.getOverdueTasks = async function() {
    return await this.findAll({
        where: {
            deadline: {
                [Sequelize.Op.lt]: new Date()
            },
            status: {
                [Sequelize.Op.not]: 'completed'
            }
        },
        include: [
            {
                model: sequelize.models.User,
                as: 'assignee',
                attributes: ['id', 'first_name', 'last_name']
            },
            {
                model: sequelize.models.Department,
                as: 'department',
                attributes: ['id', 'name']
            }
        ]
    });
};

module.exports = Task;