// routes/leaveRequests.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const  LeaveRequest  = require('../models/LeaveRequest');
const authMiddleware = require('../middleware/authMiddleware');
const  Employee  = require('../models/Employee'); // Add this line to import Employee model


// GET all leave requests
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    const whereClause = {};
    
    if (status && status !== 'all') whereClause.status = status;
    if (type && type !== 'all') whereClause.type = type;

    const leaveRequests = await LeaveRequest.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Create a new leave request
router.post('/', async (req, res) => {
  try {
    const { employee_id, leave_type, start_date, end_date } = req.body;

    // Verify employee exists
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      employee_id,
      leave_type,
      start_date,
      end_date,
      status: 'Pending'
    });

    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// POST new leave request
router.post('/', async (req, res) => {
  try {
    const { employee_id, leave_type, start_date, end_date, department } = req.body;
    
    // Get employee from emp_id
    const employee = await Employee.findOne({ where: { emp_id: employee_id }});
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const newRequest = await LeaveRequest.create({
      employee: employee.name,
      type: leave_type,
      startDate: start_date,
      endDate: end_date,
      department,
      status: 'Pending'
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// PUT update leave request status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const validActions = ['approve', 'reject'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const request = await LeaveRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    await request.update({ status: newStatus });

    res.json(request);
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;