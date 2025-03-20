const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Basic employee routes
router.post('/clock-in', protect, attendanceController.clockIn);
router.post('/clock-out', protect, attendanceController.clockOut);
router.get('/active-session', protect, attendanceController.getActiveSession);

// Get attendance records
router.get('/all', protect, attendanceController.getAllAttendance);

// Statistics and Reports
router.get('/statistics', protect, attendanceController.getStatistics);
router.get('/report', protect, restrictTo('admin', 'manager'), attendanceController.getReport);

// Department specific routes
router.get('/department', protect, restrictTo('manager', 'admin'), attendanceController.getDepartmentAttendance);

// Export routes
module.exports = router;