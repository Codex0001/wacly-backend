// src/routes/shiftRoutes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Shift, User, Department } = require('../models');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Get all shifts with pagination and filters
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search || '';
        const status = req.query.status;
        const departmentId = req.query.department_id;

        // Build where clause
        const whereClause = {};
        if (searchTerm) {
            whereClause.name = { [Op.like]: `%${searchTerm}%` };
        }
        if (status) {
            whereClause.status = status;
        }
        if (departmentId) {
            whereClause.department_id = departmentId;
        }

        const shifts = await Shift.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        res.json({
            success: true,
            data: shifts.rows,
            pagination: {
                total: shifts.count,
                page,
                totalPages: Math.ceil(shifts.count / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shifts',
            error: error.message
        });
    }
});

// Get shift by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const shift = await Shift.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        res.json({
            success: true,
            data: shift
        });
    } catch (error) {
        console.error('Error fetching shift:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shift',
            error: error.message
        });
    }
});

// Create new shift
router.post('/', protect, restrictTo('admin', 'manager'), async (req, res) => {
    try {
        const {
            name,
            start_time,
            end_time,
            description,
            department_id,
            status = 'active'
        } = req.body;

        // Validate required fields
        if (!name || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Name, start time, and end time are required'
            });
        }

        // Validate time format
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
        if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format. Use HH:MM:SS'
            });
        }

        const shift = await Shift.create({
            name,
            start_time,
            end_time,
            description,
            department_id,
            status,
            created_by: req.user.id
        });

        const shiftWithAssociations = await Shift.findByPk(shift.id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Shift created successfully',
            data: shiftWithAssociations
        });
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create shift',
            error: error.message
        });
    }
});

// Update shift
router.put('/:id', protect, restrictTo('admin', 'manager'), async (req, res) => {
    try {
        const shift = await Shift.findByPk(req.params.id);

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        const {
            name,
            start_time,
            end_time,
            description,
            department_id,
            status
        } = req.body;

        // Validate time format if provided
        if (start_time || end_time) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (start_time && !timeRegex.test(start_time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid start time format. Use HH:MM:SS'
                });
            }
            if (end_time && !timeRegex.test(end_time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid end time format. Use HH:MM:SS'
                });
            }
        }

        await shift.update({
            name: name || shift.name,
            start_time: start_time || shift.start_time,
            end_time: end_time || shift.end_time,
            description: description !== undefined ? description : shift.description,
            department_id: department_id || shift.department_id,
            status: status || shift.status
        });

        const updatedShift = await Shift.findByPk(shift.id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Shift updated successfully',
            data: updatedShift
        });
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update shift',
            error: error.message
        });
    }
});

// Delete shift
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const shift = await Shift.findByPk(req.params.id);

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        await shift.destroy();

        res.json({
            success: true,
            message: 'Shift deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete shift',
            error: error.message
        });
    }
});

// Get shifts by department
router.get('/department/:departmentId', protect, async (req, res) => {
    try {
        const shifts = await Shift.findAll({
            where: {
                department_id: req.params.departmentId,
                status: 'active'
            },
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name']
                }
            ],
            order: [['start_time', 'ASC']]
        });

        res.json({
            success: true,
            data: shifts
        });
    } catch (error) {
        console.error('Error fetching department shifts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department shifts',
            error: error.message
        });
    }
});

module.exports = router;