const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');

// Function to generate Employee ID based on role
const generateEmployeeId = async (role) => {
  let prefix = "";

  if (role === "admin") prefix = "WACLY-ADM";
  else if (role === "manager") prefix = "WACLY-MNG";
  else if (role === "employee") prefix = "WACLY-EMP";

  const latestEmployee = await Employee.findOne({
    where: { role },
    order: [["createdAt", "DESC"]],
  });

  let newId = `${prefix}-001`; // Default for first employee

  if (latestEmployee) {
    const lastId = latestEmployee.emp_id.split("-").pop();
    const nextId = String(parseInt(lastId) + 1).padStart(3, "0");
    newId = `${prefix}-${nextId}`;
  }

  return newId;
};

// Create Employee
router.post('/', async (req, res) => {
  try {
    const { name, email, phone_number, role, password } = req.body;
    const emp_id = await generateEmployeeId(role);
    
    const employee = await Employee.create({
      emp_id,
      name,
      email,
      phone_number,
      role,
      password: await bcrypt.hash(password, 10)
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update Employee
router.put('/update/:emp_id', async (req, res) => {
  try {
    const { emp_id } = req.params;
    const { name, email, phone_number, role } = req.body;

    const employee = await Employee.findByPk(emp_id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Generate new ID if role changed
    let new_emp_id = emp_id;
    if (role !== employee.role) {
      new_emp_id = await generateEmployeeId(role);
    }

    await employee.update({
      emp_id: new_emp_id,
      name,
      email,
      phone_number,
      role
    });

    res.status(200).json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete Employee
router.delete('/delete/:emp_id', async (req, res) => {
  try {
    const { emp_id } = req.params;
    const employee = await Employee.findByPk(emp_id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.destroy();
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// List Employees with Filtering & Pagination
router.get('/', async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search = '' } = req.query;
    const whereClause = {};

    if (role && role !== 'all') {
      whereClause.role = role;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { emp_id: { [Op.like]: `%${search}%` } }
      ];
    }

    const employees = await Employee.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.status(200).json({
      total: employees.count,
      employees: employees.rows,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
