// src/controllers/leaveController.js
const { LeaveRequest, LeaveType, User, Department } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const { differenceInDays } = require('date-fns'); // Add this import
// Leave Types Controllers
exports.getAllLeaveTypes = async (req, res) => {
    try {
        const leaveTypes = await LeaveType.findAll({
            where: { status: 'Active' }
        });
        res.json({
            success: true,
            data: leaveTypes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching leave types',
            error: error.message
        });
    }
};

exports.createLeaveType = async (req, res) => {
    try {
        const { name, daysAllowed, carryForward, description, requiresApproval } = req.body;
        const leaveType = await LeaveType.create({
            name,
            days_allowed: daysAllowed,
            carry_forward: carryForward,
            description,
            requires_approval: requiresApproval,
            status: 'Active'
        });
        res.status(201).json({
            success: true,
            data: leaveType
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating leave type',
            error: error.message
        });
    }
};

exports.updateLeaveType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, daysAllowed, carryForward, description, requiresApproval, status } = req.body;
        
        const leaveType = await LeaveType.findByPk(id);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }

        await leaveType.update({
            name,
            days_allowed: daysAllowed,
            carry_forward: carryForward,
            description,
            requires_approval: requiresApproval,
            status
        });

        res.json({
            success: true,
            data: leaveType
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating leave type',
            error: error.message
        });
    }
};

exports.deleteLeaveType = async (req, res) => {
    try {
        const { id } = req.params;
        const leaveType = await LeaveType.findByPk(id);
        
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }

        await leaveType.update({ status: 'Inactive' });
        
        res.json({
            success: true,
            message: 'Leave type deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error deleting leave type',
            error: error.message
        });
    }
};

exports.createLeaveRequest = async (req, res) => {
    try {
        // Get user and leave type
        const user = await User.findByPk(req.leaveData.user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check leave balance
        const usedDays = await LeaveRequest.sum('number_of_days', {
            where: {
                user_id: req.leaveData.user_id,
                leave_type_id: req.leaveData.leave_type_id,
                status: 'Approved',
                created_at: {
                    [Op.gte]: new Date(new Date().getFullYear(), 0, 1)
                }
            }
        }) || 0;

        // Get leave type and check balance
        const leaveType = await LeaveType.findByPk(req.leaveData.leave_type_id);
        if (!leaveType) {
            return res.status(404).json({ success: false, message: 'Leave type not found' });
        }

        const availableDays = leaveType.days_allowed - usedDays;
        if (req.leaveData.number_of_days > availableDays) {
            return res.status(400).json({
                success: false,
                message: `Insufficient leave balance. You have ${availableDays} days available.`
            });
        }

        // Create the leave request
        const leaveRequest = await LeaveRequest.create({
            user_id: req.leaveData.user_id,
            leave_type_id: req.leaveData.leave_type_id,
            start_date: req.leaveData.start_date,
            end_date: req.leaveData.end_date,
            number_of_days: req.leaveData.number_of_days,
            reason: req.leaveData.reason,
            status: 'Pending'
        });

        // Fetch the created request with associations
        const fullLeaveRequest = await LeaveRequest.findOne({
            where: { id: leaveRequest.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name'],
                    include: [{ model: Department, as: 'department', attributes: ['name'] }]
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['name', 'days_allowed']
                }
            ]
        });

        res.status(201).json({ success: true, data: fullLeaveRequest });
    } catch (error) {
        console.error('Create leave request error:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating leave request',
            error: error.message
        });
    }
};

exports.getAllLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveRequest.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name', 'department_id'],
                    include: [{
                        model: Department,
                        as: 'department',
                        attributes: ['name']
                    }]
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['name', 'days_allowed']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching leave requests',
            error: error.message
        });
    }
};

exports.getMyLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveRequest.findAll({
            where: { user_id: req.user.id },
            include: [
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['name', 'days_allowed']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching your leave requests',
            error: error.message
        });
    }
};

exports.getTeamLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveRequest.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    where: { department_id: req.user.department_id },
                    attributes: ['first_name', 'last_name', 'department_id'],
                    include: [{
                        model: Department,
                        as: 'department',
                        attributes: ['name']
                    }]
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['name', 'days_allowed']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching team leave requests',
            error: error.message
        });
    }
};

exports.updateLeaveRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;

        const leaveRequest = await LeaveRequest.findOne({
            where: { id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['department_id', 'first_name', 'last_name']
                }
            ]
        });

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        // Check if manager has permission (same department)
        if (req.user.role === 'manager' && 
            leaveRequest.user.department_id !== req.user.department_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only manage requests from your department'
            });
        }

        await leaveRequest.update({
            status,
            comments,
            action_by: req.user.id,
            action_at: new Date()
        });

        res.json({
            success: true,
            data: leaveRequest
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating leave request status',
            error: error.message
        });
    }
};

exports.getLeaveRequestStats = async (req, res) => {
    try {
        const stats = await LeaveRequest.findAll({
            where: {
                user_id: req.user.id,
                status: 'Approved', // Only count approved leaves
                created_at: {
                    [Op.gte]: new Date(new Date().getFullYear(), 0, 1)
                }
            },
            include: [{ 
                model: LeaveType, 
                as: 'leaveType', 
                attributes: ['name', 'days_allowed']
            }],
            attributes: [
                'leave_type_id',
                [sequelize.fn('SUM', sequelize.col('LeaveRequest.number_of_days')), 'totalDays'],
                [sequelize.fn('COUNT', sequelize.col('LeaveRequest.id')), 'totalRequests']
            ],
            group: [
                'leave_type_id',
                'leaveType.id',
                'leaveType.name',
                'leaveType.days_allowed'
            ],
            raw: true,
            nest: true
        });

        const formattedStats = stats.map(stat => ({
            leaveType: stat.leaveType.name,
            daysAllowed: stat.leaveType.days_allowed,
            daysUsed: parseInt(stat.totalDays || 0),
            requestsCount: parseInt(stat.totalRequests || 0),
            daysRemaining: stat.leaveType.days_allowed - parseInt(stat.totalDays || 0)
        }));

        res.json({ success: true, data: formattedStats });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leave statistics',
            error: error.message
        });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Get pending requests
        const [pending, pendingYesterday] = await Promise.all([
            LeaveRequest.count({
                where: { status: 'Pending' }
            }),
            LeaveRequest.count({
                where: {
                    status: 'Pending',
                    created_at: {
                        [Op.lt]: now,
                        [Op.gte]: yesterday
                    }
                }
            })
        ]);

        // Get current leaves and affected departments
        const onLeaveToday = await LeaveRequest.findAll({
            where: {
                status: 'Approved',
                start_date: { [Op.lte]: now },
                end_date: { [Op.gte]: now }
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['department_id'],
                include: [{
                    model: Department,
                    as: 'department',
                    attributes: ['name']
                }]
            }]
        });

        // Count unique departments affected
        const departmentsAffected = new Set(
            onLeaveToday.map(leave => leave.user.department_id)
        ).size;

        // Get upcoming leaves (next 7 days)
        const upcoming = await LeaveRequest.count({
            where: {
                status: 'Approved',
                start_date: {
                    [Op.gt]: now,
                    [Op.lte]: nextWeek
                }
            }
        });

        // Get current month and last month totals
        const [currentMonth, previousMonth] = await Promise.all([
            LeaveRequest.count({
                where: {
                    status: 'Approved',
                    start_date: {
                        [Op.gte]: startOfMonth,
                        [Op.lte]: now
                    }
                }
            }),
            LeaveRequest.count({
                where: {
                    status: 'Approved',
                    start_date: {
                        [Op.gte]: startOfLastMonth,
                        [Op.lt]: startOfMonth
                    }
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                pending,
                pendingChange: pending - pendingYesterday,
                onLeaveToday: onLeaveToday.length,
                departmentsAffected,
                upcoming,
                currentMonth,
                previousMonth
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};