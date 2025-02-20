const { Department, User } = require('../models');
const sequelize = require('../config/db');

exports.createDepartment = async (req, res) => {
  try {
    // Validate if manager exists if provided
    if (req.body.manager_id) {
      const manager = await User.findByPk(req.body.manager_id);
      if (!manager) {
        return res.status(400).json({ message: 'Manager user not found' });
      }
    }

    const department = await Department.create({
      name: req.body.name,
      description: req.body.description,
      manager_id: req.body.manager_id
    });
    
    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ message: 'Error creating department' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    // Validate new manager if provided
    if (req.body.manager_id) {
      const newManager = await User.findByPk(req.body.manager_id);
      if (!newManager) {
        return res.status(400).json({ message: 'New manager not found' });
      }
    }

    await department.update({
      name: req.body.name || department.name,
      description: req.body.description || department.description,
      manager_id: req.body.manager_id ?? department.manager_id // Nullish coalescing
    });

    res.json(department);
  } catch (error) {
    res.status(400).json({ message: 'Error updating department' });
  }
};

// Get all departments with optional manager and employee count
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'email', 'first_name', 'last_name']
      }],
      attributes: [
        'id',
        'name',
        'description',
        'created_at',
        'updated_at',
        [sequelize.literal('(SELECT COUNT(*) FROM Users WHERE Users.department_id = Department.id)'), 'employee_count']
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments' });
  }
};

exports.deleteDepartment = async (req, res) => {
    try {
      const department = await Department.findByPk(req.params.id);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
  
      // Check if department has employees
      const employeeCount = await User.count({
        where: { department_id: req.params.id }
      });
  
      if (employeeCount > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete department with active employees' 
        });
      }
  
      await department.destroy();
      res.json({ message: 'Department deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ message: 'Error deleting department' });
    }
};

exports.transferEmployee = async (req, res) => {
  const { user_id, from_department_id, to_department_id } = req.body;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Validate input
    if (!user_id || !to_department_id) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    // Find the user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Validate departments
    const toDepartment = await Department.findByPk(to_department_id);
    if (!toDepartment) {
      return res.status(404).json({
        message: 'Target department not found'
      });
    }

    // Update user's department
    await user.update(
      { department_id: to_department_id },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    res.json({
      message: 'Employee transferred successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        department_id: user.department_id
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Transfer error:', error);
    res.status(500).json({
      message: 'Error transferring employee',
      error: error.message
    });
  }
};