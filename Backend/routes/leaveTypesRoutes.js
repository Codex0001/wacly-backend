const express = require('express');
const router = express.Router();
const LeaveType = require('../models/leaveType'); // Assuming you have a LeaveType model

// GET all leave types
router.get('/', async (req, res) => {
  try {
    const leaveTypes = await LeaveType.findAll();
    res.status(200).json(leaveTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new leave type
router.post('/add', async (req, res) => {
  try {
    const newLeaveType = await LeaveType.create(req.body);
    res.status(201).json(newLeaveType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE a leave type by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await LeaveType.destroy({ where: { id } });
    res.status(204).send(); // No content response
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// edit leave
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await LeaveType.update(req.body, {
      where: { id }
    });

    if (updated) {
      const updatedType = await LeaveType.findByPk(id);
      return res.status(200).json(updatedType);
    }
    throw new Error('Leave type not found');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
