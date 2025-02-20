const { Sequelize } = require('sequelize');
const config = require('../config/db');
const bcrypt = require('bcrypt');

// Initialize connection pool
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  logging: false,
  define: {
    freezeTableName: true,
    timestamps: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Load models
const User = require('./User');
const Department = require('./Department');

// Fix circular dependencies
User.Department = User.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
  onDelete: 'SET NULL'
});

Department.Manager = Department.belongsTo(User, {
  foreignKey: 'manager_id',
  as: 'manager'
});

// Database startup sequence
sequelize.authenticate()
  .then(() => console.log('🔌 Connected to database'))
  .then(async () => {
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('🔄 Schema synchronization complete');
    }
  })
  .catch(error => {
    console.error('💥 Database initialization failed:', error.message);
    process.exit(1);
  });

module.exports = {
  sequelize,
  User,
  Department,
  saltRounds: 10 // For password hashing
};