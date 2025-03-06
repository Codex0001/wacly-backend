const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Basic employee routes
router.post('/clock-in', protect, attendanceController.clockIn);
router.post('/clock-out', protect, attendanceController.clockOut);
router.get('/active-session', protect, attendanceController.getActiveSession);
router.get('/today', protect, attendanceController.getTodayAttendance);
router.get('/history', protect, attendanceController.getAttendanceHistory);
router.get('/statistics', protect, attendanceController.getStatistics);

// Manager routes
router.get(
    '/department', 
    protect,
    restrictTo('manager', 'admin'),
    attendanceController.getDepartmentAttendance
);

// Admin routes
router.get(
    '/all', 
    protect,
    restrictTo('admin'),
    attendanceController.getAllAttendance
);

router.get(
    '/report', 
    protect,
    restrictTo('admin', 'manager'),
    attendanceController.getReport
);

module.exports = router;