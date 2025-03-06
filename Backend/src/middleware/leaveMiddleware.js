const { LeaveRequest, LeaveType, User } = require('../models');
const { Op } = require('sequelize');

exports.validateLeaveRequest = async (req, res, next) => {
    try {
        const { leaveTypeId, startDate, endDate, reason } = req.body;

        // Check if all required fields are present
        if (!leaveTypeId || !startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: leaveTypeId, startDate, endDate, and reason'
            });
        }

        // Validate date formats
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Please use YYYY-MM-DD format'
            });
        }

        // Check if leave type exists and is active
        const leaveType = await LeaveType.findOne({
            where: {
                id: leaveTypeId,
                status: 'Active'
            }
        });

        if (!leaveType) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive leave type'
            });
        }

        // Calculate number of days (excluding weekends optionally)
        const diffTime = Math.abs(end - start);
        const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Validate dates
        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date cannot be before start date'
            });
        }

        // Check if start date is in the past
        if (start < new Date().setHours(0, 0, 0, 0)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create leave request for past dates'
            });
        }

        // Check against allowed days
        if (numberOfDays > leaveType.days_allowed) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${leaveType.days_allowed} days allowed for ${leaveType.name}. Requested: ${numberOfDays} days`
            });
        }

        // Check for overlapping requests
        const overlapping = await LeaveRequest.findOne({
            where: {
                user_id: req.user.id,
                status: {
                    [Op.in]: ['Pending', 'Approved']
                },
                [Op.or]: [
                    {
                        start_date: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    {
                        end_date: {
                            [Op.between]: [startDate, endDate]
                        }
                    }
                ]
            }
        });

        if (overlapping) {
            return res.status(400).json({
                success: false,
                message: 'You have an overlapping leave request for these dates'
            });
        }

        // Add validated data to request
        req.leaveData = {
            user_id: req.user.id,
            leave_type_id: leaveTypeId,
            start_date: startDate,
            end_date: endDate,
            number_of_days: numberOfDays,  // Changed to match database column name
            reason: reason.trim(),
            status: 'Pending'
        };

        next();
    } catch (error) {
        console.error('Leave validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating leave request',
            error: error.message
        });
    }
};

exports.validateLeaveAction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be either Approved or Rejected'
            });
        }

        const leaveRequest = await LeaveRequest.findOne({
            where: { id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'department_id', 'first_name', 'last_name']
                }
            ]
        });

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        // Prevent self-approval
        if (leaveRequest.user_id === req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You cannot approve/reject your own leave request'
            });
        }

        // Check manager's department permission
        if (req.user.role === 'manager' && leaveRequest.user.department_id !== req.user.department_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only manage requests from your department'
            });
        }

        req.leaveRequest = leaveRequest;
        next();
    } catch (error) {
        console.error('Leave action validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating leave action',
            error: error.message
        });
    }
};