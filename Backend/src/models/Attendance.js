const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Attendance extends Model {
        static associate(models) {
            // Define associations here if needed
            this.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });
        }
    }

    Attendance.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        clock_in: {
            type: DataTypes.DATE,
            allowNull: false
        },
        clock_out: {
            type: DataTypes.DATE,
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('In Progress', 'Completed'),
            defaultValue: 'In Progress',
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'attendance_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Attendance;
};