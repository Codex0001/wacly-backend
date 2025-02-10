// controllers/LeaveTypeController.js
const LeaveType = require('../models/LeaveType');

exports.getAllLeaveTypes = async (req, res) => {
    try {
        const leaveTypes = await LeaveType.findAll();
        res.json(leaveTypes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leave types' });
    }
};

// Define other methods similarly...