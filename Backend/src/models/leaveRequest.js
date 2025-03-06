// src/models/LeaveRequest.js
module.exports = (sequelize, DataTypes) => {
    const LeaveRequest = sequelize.define('LeaveRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        leave_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        number_of_days: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
            defaultValue: 'Pending'
        },
        reason: {
            type: DataTypes.TEXT
        },
        comments: {
            type: DataTypes.TEXT
        },
        action_by: {
            type: DataTypes.STRING
        },
        action_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'leave_requests',
        timestamps: true,
        underscored: true
    });

    return LeaveRequest;
};