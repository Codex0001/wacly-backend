const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Base department routes
router.get('/', departmentController.getAllDepartments);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

// Analytics routes (order is important - place before :id route)
router.get('/analytics', departmentController.getOverallAnalytics);
router.get('/:id/analytics', departmentController.getDepartmentAnalytics);

// Additional functionality routes
router.post('/transfer', departmentController.transferEmployee);
router.post('/announcements', departmentController.createAnnouncement);

module.exports = router;