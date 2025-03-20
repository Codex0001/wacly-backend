// src/routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public route (if needed)
router.get('/', departmentController.getAllDepartments);

// Protected routes - need to be logged in
router.use(protect);

// Get department details by ID (accessible to manager and admin)
router.get('/:id', restrictTo('admin', 'manager'), departmentController.getDepartmentById);

// Get users in a department (accessible to manager and admin)
router.get('/:id/users', restrictTo('admin', 'manager'), departmentController.getDepartmentUsers);

// Admin only routes using restrictTo middleware
router.post('/', restrictTo('admin'), departmentController.createDepartment);
router.put('/:id', restrictTo('admin'), departmentController.updateDepartment);
router.delete('/:id', restrictTo('admin'), departmentController.deleteDepartment);
router.get('/export', restrictTo('admin'), departmentController.exportDepartments);
router.post('/transfer', restrictTo('admin'), departmentController.transferEmployee);

module.exports = router;