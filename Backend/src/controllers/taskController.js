// src/controllers/taskController.js
const { Task, User, Department } = require('../models');
const { Op } = require('sequelize');

const taskController = {
    // Get all tasks
    getAllTasks: async (req, res) => {
        try {
            const tasks = await Task.findAll({
                include: [
                    {
                        model: User,
                        as: 'assignee',
                        attributes: ['id', 'first_name', 'last_name']
                    },
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
                order: [['created_at', 'DESC']]
            });
            res.json({
                success: true,
                count: tasks.length,
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching tasks',
                error: error.message
            });
        }
    },

    // Get tasks by department
    getTasksByDepartment: async (req, res) => {
        try {
            const { departmentId } = req.params;
            
            const tasks = await Task.findAll({
                where: { department_id: departmentId },
                include: [
                    {
                        model: User,
                        as: 'assignee',
                        attributes: ['id', 'first_name', 'last_name']
                    },
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
                order: [['created_at', 'DESC']]
            });

            res.json({
                success: true,
                count: tasks.length,
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching department tasks',
                error: error.message
            });
        }
    },

    // Get task by ID
    getTaskById: async (req, res) => {
        try {
            const task = await Task.findByPk(req.params.id, {
                include: [
                    {
                        model: User,
                        as: 'assignee',
                        attributes: ['id', 'first_name', 'last_name']
                    },
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
            
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            res.json({
                success: true,
                data: task
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching task',
                error: error.message
            });
        }
    },

    // Get overdue tasks
    getOverdueTasks: async (req, res) => {
        try {
            const tasks = await Task.findAll({
                where: {
                    deadline: {
                        [Op.lt]: new Date()
                    },
                    status: {
                        [Op.not]: 'completed'
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'assignee',
                        attributes: ['id', 'first_name', 'last_name']
                    },
                    {
                        model: Department,
                        as: 'department',
                        attributes: ['id', 'name']
                    }
                ],
                order: [['deadline', 'ASC']]
            });

            res.json({
                success: true,
                count: tasks.length,
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching overdue tasks',
                error: error.message
            });
        }
    },

    // Get tasks assigned to user
    getAssignedTasks: async (req, res) => {
        try {
            const { userId } = req.params;
            const tasks = await Task.findAll({
                where: { assigned_to: userId },
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
                order: [['created_at', 'DESC']]
            });

            res.json({
                success: true,
                count: tasks.length,
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching assigned tasks',
                error: error.message
            });
        }
    },

    // Create new task
    createTask: async (req, res) => {
        try {
            const {
                title,
                description,
                assigned_to,
                department_id,
                deadline,
                priority,
                status
            } = req.body;

            // Validation
            if (!title || !description || !assigned_to || !deadline) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            const task = await Task.create({
                title,
                description,
                assigned_to,
                department_id,
                deadline: new Date(deadline),
                priority,
                status,
                created_by: req.user.id
            });

            const taskWithRelations = await Task.findByPk(task.id, {
                include: [
                    {
                        model: User,
                        as: 'assignee',
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
                message: 'Task created successfully',
                data: taskWithRelations
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating task',
                error: error.message
            });
        }
    },

    // Update task
    updateTask: async (req, res) => {
        try {
            const task = await Task.findByPk(req.params.id);
            
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            const {
                title,
                description,
                assigned_to,
                department_id,
                deadline,
                status,
                priority
            } = req.body;

            await task.update({
                title,
                description,
                assigned_to,
                department_id,
                deadline: deadline ? new Date(deadline) : task.deadline,
                status,
                priority
            });

            const updatedTask = await Task.findByPk(task.id, {
                include: [
                    {
                        model: User,
                        as: 'assignee',
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
                message: 'Task updated successfully',
                data: updatedTask
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating task',
                error: error.message
            });
        }
    },

    // Update task status
    updateTaskStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const task = await Task.findByPk(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            await task.update({
                status,
                completion_date: status === 'completed' ? new Date() : null
            });

            res.json({
                success: true,
                message: 'Task status updated successfully',
                data: task
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating task status',
                error: error.message
            });
        }
    },

    // Delete task
    deleteTask: async (req, res) => {
        try {
            const task = await Task.findByPk(req.params.id);
            
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            await task.destroy();
            
            res.json({
                success: true,
                message: 'Task deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting task',
                error: error.message
            });
        }
    },

    // Get department task statistics
    getDepartmentTaskStats: async (req, res) => {
        try {
            const { departmentId } = req.params;
            const tasks = await Task.findAll({
                where: { department_id: departmentId },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['status']
            });

            res.json({
                success: true,
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching department statistics',
                error: error.message
            });
        }
    },

    // Get user task statistics
    getUserTaskStats: async (req, res) => {
        try {
            const { userId } = req.params;
            const tasks = await Task.findAll({
                where: { assigned_to: userId },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['status']
            });

            res.json({
                success: true,
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching user statistics',
                error: error.message
            });
        }
    }
};

module.exports = taskController;