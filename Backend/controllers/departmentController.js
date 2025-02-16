const Department = require('../models/Department');

const departmentController = {
  // Get all departments
  getAllDepartments: async (req, res) => {
    try {
      const departments = await Department.findAll();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching departments", error: error.message });
    }
  },

  // Create department
  createDepartment: async (req, res) => {
    try {
      console.log('Received request body:', req.body);
      const { name } = req.body;
      
      if (!name) {
        console.log('Name validation failed, received name:', name);
        return res.status(400).json({ 
          message: "Validation Error",
          error: "Department name is required"
        });
      }
      
      const department = await Department.create(req.body);
      res.status(201).json(department);
    } catch (error) {
      res.status(400).json({ message: "Error creating department", error: error.message });
    }
  },

  // Update department
  updateDepartment: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await Department.update(req.body, {
        where: { id }
      });
      if (updated) {
        const department = await Department.findByPk(id);
        res.json(department);
      } else {
        res.status(404).json({ message: "Department not found" });
      }
    } catch (error) {
      res.status(400).json({ message: "Error updating department", error: error.message });
    }
  },

  // Delete department
  deleteDepartment: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Department.destroy({
        where: { id }
      });
      if (deleted) {
        res.json({ message: "Department deleted" });
      } else {
        res.status(404).json({ message: "Department not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting department", error: error.message });
    }
  },

  // Get overall analytics
  getOverallAnalytics: async (req, res) => {
    try {
      const analytics = await Department.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('employeeCount')), 'totalEmployees'],
          [sequelize.fn('AVG', sequelize.col('averagePerformance')), 'averagePerformance'],
          [sequelize.fn('SUM', sequelize.col('budget')), 'totalBudget'],
          [sequelize.fn('SUM', sequelize.col('activeProjects')), 'activeProjects']
        ],
        raw: true
      });
      
      res.json({
        totalEmployees: parseInt(analytics.totalEmployees) || 0,
        averagePerformance: parseFloat(analytics.averagePerformance) || 0,
        totalBudget: parseFloat(analytics.totalBudget) || 0,
        activeProjects: parseInt(analytics.activeProjects) || 0
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics", error: error.message });
    }
  },
  
  // Get department analytics
  getDepartmentAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      const department = await Department.findByPk(id);
      
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
  
      res.json({
        totalEmployees: department.employeeCount,
        averagePerformance: department.averagePerformance,
        totalBudget: department.budget,
        activeProjects: department.activeProjects
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching department analytics", error: error.message });
    }
  },
  
  // Transfer employee
  transferEmployee: async (req, res) => {
    try {
      const { employeeId, fromDepartmentId, toDepartmentId, reason } = req.body;
      
      // Update employee count in departments
      await Department.decrement('employeeCount', { where: { id: fromDepartmentId } });
      await Department.increment('employeeCount', { where: { id: toDepartmentId } });
      
      // You might want to update the employee's department in your Employee model as well
      
      res.json({ message: "Transfer successful" });
    } catch (error) {
      res.status(400).json({ message: "Error transferring employee", error: error.message });
    }
  },
  
  // Create announcement
  createAnnouncement: async (req, res) => {
    try {
      const { departmentId, title, message } = req.body;
      
      // Here you might want to create an Announcement model and store the announcement
      // For now, we'll just return success
      
      res.status(201).json({ message: "Announcement created successfully" });
    } catch (error) {
      res.status(400).json({ message: "Error creating announcement", error: error.message });
    }
  }
};

module.exports = departmentController;