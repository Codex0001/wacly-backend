// src/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    getAllLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType
} = require('../controllers/leaveController');

// Leave Types routes
router.get('/', protect, getAllLeaveTypes);
router.post('/', protect, restrictTo('admin'), createLeaveType);
router.put('/:id', protect, restrictTo('admin'), updateLeaveType);
router.delete('/:id', protect, restrictTo('admin'), deleteLeaveType);



module.exports = router;