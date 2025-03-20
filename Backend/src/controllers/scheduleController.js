// controllers/scheduleController.js
const { Schedule, User, Shift } = require('../models');
const { Op } = require('sequelize');

// Create schedule
exports.createSchedule = async (req, res) => {
    try {
        const {
            shiftId,
            employeeIds,
            startDate,
            endDate,
            isRecurring,
            recurringType,
            recurringDays,
            recurringInterval,
            recurringEndDate
        } = req.body;

        // Validate dates
        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        const schedule = await Schedule.create({
            shift_id: shiftId,
            start_date: startDate,
            end_date: endDate,
            is_recurring: isRecurring,
            recurring_type: recurringType,
            recurring_days: recurringDays,
            recurring_interval: recurringInterval,
            recurring_end_date: recurringEndDate
        });

        // Associate employees
        await schedule.setEmployees(employeeIds);

        // Fetch complete schedule with associations
        const completeSchedule = await Schedule.findByPk(schedule.id, {
            include: [
                {
                    model: User,
                    as: 'employees',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Shift,
                    as: 'shift'
                }
            ]
        });

        return res.status(201).json({
            success: true,
            data: completeSchedule
        });
    } catch (error) {
        console.error('Create schedule error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create schedule',
            error: error.message
        });
    }
};

// Get schedules
exports.getSchedules = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            shiftId,
            employeeId,
            status,
            page = 1,
            limit = 10
        } = req.query;

        let whereClause = {};
        
        if (startDate && endDate) {
            whereClause.start_date = { [Op.between]: [startDate, endDate] };
        }
        
        if (shiftId) {
            whereClause.shift_id = shiftId;
        }
        
        if (status) {
            whereClause.status = status;
        }

        const { rows: schedules, count } = await Schedule.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'employees',
                    attributes: ['id', 'first_name', 'last_name', 'email'],
                    ...(employeeId && { where: { id: employeeId } })
                },
                {
                    model: Shift,
                    as: 'shift'
                }
            ],
            order: [['start_date', 'ASC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            distinct: true
        });

        return res.status(200).json({
            success: true,
            data: {
                schedules,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get schedules error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch schedules',
            error: error.message
        });
    }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const schedule = await Schedule.findByPk(id);
        
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        await schedule.update(updateData);

        if (updateData.employeeIds) {
            await schedule.setEmployees(updateData.employeeIds);
        }

        const updatedSchedule = await Schedule.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'employees',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Shift,
                    as: 'shift'
                }
            ]
        });

        return res.status(200).json({
            success: true,
            data: updatedSchedule
        });
    } catch (error) {
        console.error('Update schedule error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update schedule',
            error: error.message
        });
    }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        const schedule = await Schedule.findByPk(id);
        
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        await schedule.destroy();

        return res.status(200).json({
            success: true,
            message: 'Schedule deleted successfully'
        });
    } catch (error) {
        console.error('Delete schedule error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete schedule',
            error: error.message
        });
    }
};