// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Schedule management routes
router.post(
    '/',
    protect,
    restrictTo('admin', 'manager'),
    scheduleController.createSchedule
);

router.get(
    '/',
    protect,
    scheduleController.getSchedules
);

router.patch(
    '/:id',
    protect,
    restrictTo('admin', 'manager'),
    scheduleController.updateSchedule
);

router.delete(
    '/:id',
    protect,
    restrictTo('admin', 'manager'),
    scheduleController.deleteSchedule
);

module.exports = router;