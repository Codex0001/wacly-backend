require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sequelize = require('./src/config/db');
const { User, Department, LeaveType, LeaveRequest, Attendance } = require('./src/models');

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', ],
    allowedHeaders: ['Content-Type', 'Authorization','Accept'],
}));

// Body parser
app.use(express.json());

// Routes setup...
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/manager', require('./src/routes/managerRoutes'));
app.use('/api/employee', require('./src/routes/employeeRoutes'));
app.use('/api/departments', require('./src/routes/departmentRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/leave-types', require('./src/routes/leaveRoutes'));
app.use('/api/leave-requests', require('./src/routes/leaveRequestRoutes'));
app.use('/api/attendance', require('./src/routes/attendanceRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Verify and create tables if needed
async function verifyTables() {
    console.log('\n📊 Checking database tables:');
    try {
        // Force sync specific tables that don't exist
        await LeaveType.sync();
        console.log('✨ Created leave_types table');
        await LeaveRequest.sync();
        console.log('✨ Created leave_requests table');
        await Attendance.sync();
        console.log('✨ Created attendance_logs table');

        // Verify all tables
        const tables = {
            users: User,
            departments: Department,
            leave_types: LeaveType,
            leave_requests: LeaveRequest,
            attendance_logs: Attendance
        };

        for (const [tableName, model] of Object.entries(tables)) {
            try {
                await model.findOne();
                console.log(`✅ ${tableName} table exists and is accessible`);
            } catch (error) {
                console.log(`❌ ${tableName} table error:`, error.message);
            }
        }

        // Create default leave types if table is empty
        const leaveTypesCount = await LeaveType.count();
        if (leaveTypesCount === 0) {
            await LeaveType.bulkCreate([
                {
                    name: 'Annual Leave',
                    description: 'Regular annual leave entitlement',
                    days_allowed: 20,
                    carry_forward: true,
                    requires_approval: true,
                    status: 'Active'
                },
                {
                    name: 'Sick Leave',
                    description: 'Medical related leave',
                    days_allowed: 10,
                    carry_forward: false,
                    requires_approval: true,
                    status: 'Active'
                },
                {
                    name: 'Emergency Leave',
                    description: 'For urgent personal matters',
                    days_allowed: 5,
                    carry_forward: false,
                    requires_approval: true,
                    status: 'Active'
                }
            ]);
            console.log('📝 Created default leave types');
        }
    } catch (error) {
        console.error('❌ Error during table verification:', error);
        throw error;
    }
    console.log(); // Empty line for spacing
}

// Initialize system and start server
async function initializeSystem() {
    try {
        // Verify and create tables
        await verifyTables();

        // Create default admin if not exists
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
                role: 'admin'
            });
            console.log('💼 Default admin created');
        }

        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });
    } catch (error) {
        console.error('💥 Failed to initialize:', error);
        process.exit(1);
    }
}

initializeSystem();