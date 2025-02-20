// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sequelize = require('./src/config/db');
const { User } = require('./src/models');

const app = express();
const port = process.env.PORT || 5000;

// Move departmentRoutes to src/routes and update import
const departmentRoutes = require('./src/routes/departmentRoutes');

// Create default admin after DB connection
async function initializeSystem() {
  await sequelize.authenticate();
  console.log('✅ Database connected');

  await sequelize.sync({ alter: true });
  console.log('🔄 Database synchronized');

  const adminExists = await User.findOne({ 
    where: { email: 'admin@wacly.com' } 
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Admin@1234', 10);
    await User.create({
      id: 'WACLY-ADM-0001',
      first_name: 'System',
      last_name: 'Admin',
      email: 'admin@wacly.com',
      password: hashedPassword,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log('💼 Default admin created');
  }
}

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/manager', require('./src/routes/managerRoutes'));
app.use('/api/employee', require('./src/routes/employeeRoutes'));
app.use('/api/departments', departmentRoutes);
app.use('/api/users', require('./src/routes/userRoutes'));

// Server startup
initializeSystem()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('💥 Failed to initialize:', error);
    process.exit(1);
  });