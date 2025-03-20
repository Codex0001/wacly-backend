// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Basic task routes
router.get('/all', protect, taskController.getAllTasks);
router.get('/:id', protect, taskController.getTaskById);

// Task management routes
router.post(
    '/create', 
    protect, 
    restrictTo('admin', 'manager'), 
    taskController.createTask
);

router.put(
    '/:id', 
    protect, 
    taskController.updateTask
);

router.delete(
    '/:id', 
    protect, 
    restrictTo('admin', 'manager'), 
    taskController.deleteTask
);

module.exports = router;