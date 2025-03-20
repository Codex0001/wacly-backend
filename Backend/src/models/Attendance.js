const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE'  // Add cascading delete
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
      allowNull: false,
      references: {
        model: 'users',  // Reference the users table
        key: 'id'
      }
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
    },
    session_date: {  // Add session date field
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    is_modified: {  // Add field to track modifications
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'attendance_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [  // Add indexes for better query performance
      {
        fields: ['user_id', 'session_date', 'status']
      },
      {
        fields: ['session_date']
      }
    ]
  });

  // Add hooks for data validation and processing
  Attendance.beforeCreate(async (attendance) => {
    // Ensure session_date is set to the date of clock_in
    attendance.session_date = attendance.clock_in.toISOString().split('T')[0];
  });

  Attendance.beforeUpdate(async (attendance) => {
    // Calculate duration when clock_out is set
    if (attendance.clock_out && attendance.changed('clock_out')) {
      const clockInTime = new Date(attendance.clock_in);
      const clockOutTime = new Date(attendance.clock_out);
      attendance.duration = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
    }
  });

  return Attendance;
};