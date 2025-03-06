// src/models/LeaveType.js
module.exports = (sequelize, DataTypes) => {
    const LeaveType = sequelize.define('LeaveType', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        days_allowed: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        carry_forward: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        description: {
            type: DataTypes.TEXT
        },
        requires_approval: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        status: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            defaultValue: 'Active'
        }
    }, {
        tableName: 'leave_types',
        timestamps: true,
        underscored: true
    });

    return LeaveType;
};