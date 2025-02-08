const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const authMiddleware = require("../middleware/authMiddleware");

// Update Employee Details
router.put("/update/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone_number } = req.body;
        
        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        
        await employee.update({ name, phone_number });
        res.status(200).json({ message: "Employee updated successfully", employee });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// Delete Employee
router.delete("/delete/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        
        await employee.destroy();
        res.status(200).json({ message: "Employee deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// List Employees with Filtering & Pagination
router.get("/employees", authMiddleware, async (req, res) => {
    try {
        const { role, page = 1, limit = 10 } = req.query;
        const whereClause = role ? { role } : {};
        
        const employees = await Employee.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
        });
        
        res.status(200).json({ total: employees.count, employees: employees.rows });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

module.exports = router;
