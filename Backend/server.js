require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

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
sequelize.sync({ force: false }) // Set `force: true` to drop and recreate tables (use with caution!)
    .then(() => {
        console.log('✅ All tables synced successfully!');
    })
    .catch((err) => {
        console.error('❌ Database sync error:', err);
    });

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true,
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const leaveTypesRoutes = require('./routes/leaveTypesRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/leave-types', leaveTypesRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});