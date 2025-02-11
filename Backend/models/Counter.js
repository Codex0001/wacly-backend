module.exports = (sequelize, DataTypes) => {
    const Counter = sequelize.define('Counter', {
      role: {
        type: DataTypes.ENUM('admin', 'manager', 'employee'),
        primaryKey: true,
        unique: true
      },
      seq: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    });
    return Counter;
  };