// src/routes/leaveRequestRoutes.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateLeaveRequest, validateLeaveAction } = require('../middleware/leaveMiddleware');
const { 
    createLeaveRequest, 
    getAllLeaveRequests, 
    getMyLeaveRequests, 
    getTeamLeaveRequests, 
    updateLeaveRequestStatus, 
    getLeaveRequestStats, 
    getDashboardStats,
    getDepartmentStats
} = require('../controllers/leaveController');

// Leave Requests routes
router.post('/', 
    protect, 
    validateLeaveRequest, 
    createLeaveRequest
);

router.get('/', 
    protect, 
    restrictTo('admin'), 
    getAllLeaveRequests
);

router.get('/my-requests', 
    protect, 
    getMyLeaveRequests
);

router.get('/team', 
    protect, 
    restrictTo('manager', 'admin'), 
    getTeamLeaveRequests
);

router.get('/stats', 
    protect, 
    getLeaveRequestStats
);

router.put('/:id/status', 
    protect, 
    restrictTo('manager', 'admin'), 
    validateLeaveAction, 
    updateLeaveRequestStatus
);

router.get('/dashboard-stats', 
    protect, 
    getDashboardStats
);

// New department statistics route
router.get('/department-stats',
    protect,
    restrictTo('manager'),
    getDepartmentStats
);

module.exports = router;