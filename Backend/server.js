require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes'); // Ensure this is imported
const Department = require('./models/Department');
const Employee = require('./models/Employee');

// Initialize Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
});

// Define the LeaveType model
const LeaveType = sequelize.define('LeaveType', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    daysAllowed: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    carryForward: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    requiresApproval: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    tableName: 'LeaveTypes', // Explicitly define the table name
});

// Test database connection
sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection has been established successfully.');
    })
    .catch((err) => {
        console.error('❌ Unable to connect to the database:', err);
    });

// Sync models with the database
const syncModels = async () => {
    try {
      // First sync Department
      await Department.sync({ alter: true });
      console.log('✅ Department table synced successfully!');
      
      // Then sync Employee
      await Employee.sync({ alter: true });
      console.log('✅ Employee table synced successfully!');
      
      // Add associations after syncing
    Department.hasMany(Employee, { foreignKey: 'departmentId' });
    Employee.belongsTo(Department, { foreignKey: 'departmentId' });
      
    } catch (error) {
      console.error('❌ Error syncing tables:', error);
    }
  };

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Ensure this line is present
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const leaveTypesRoutes = require('./routes/leaveTypesRoutes');
const leaveRequestsRoutes = require('./routes/leaveRequestsRoutes');
const departmentsRoutes = require('./routes/departmentRoutes'); // Ensure this is used

app.use('/api/auth', authRoutes);
app.use('/api/leave-types', leaveTypesRoutes);
app.use('/api/employees', employeeRoutes); 
app.use('/api/leave-requests', leaveRequestsRoutes);
app.use('/api/departments', departmentsRoutes); // Ensure this is used

// Test Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});