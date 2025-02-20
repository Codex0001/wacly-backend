// src/routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public route (if needed)
router.get('/', departmentController.getAllDepartments);

// Protected routes - need to be logged in
router.use(protect);

// Admin only routes using restrictTo middleware
router.post('/', restrictTo('admin'), departmentController.createDepartment);
router.put('/:id', restrictTo('admin'), departmentController.updateDepartment);
router.delete('/:id', restrictTo('admin'), departmentController.deleteDepartment);

// Add transfer route
router.post('/transfer', restrictTo('admin'), departmentController.transferEmployee);

module.exports = router;