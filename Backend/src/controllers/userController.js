const bcrypt = require('bcrypt');
const { User, Department } = require('../models');

exports.createUser = async (req, res) => {
  try {
    const { department_id, password, ...userData } = req.body;

    // Required fields check
    if (!password || !userData.email || !userData.role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate email format
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(userData.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if role is valid
    if (!['admin', 'manager', 'employee'].includes(userData.role)) {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    // Validate department exists if provided
    if (department_id) {
      const department = await Department.findByPk(department_id);
      if (!department) {
        return res.status(400).json({ message: 'Department not found' });
      }
    }

    // Check for existing email
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      ...userData,
      password: hashedPassword,
      department_id
    });

    // Return user without sensitive data
    const { password: _, ...safeUser } = user.toJSON();
    res.status(201).json(safeUser);

  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }]
    });
    res.json(users);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent ID and role changes
    delete updates.id;
    delete updates.role;

    // Hash new password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Validate department if changing
    if (updates.department_id) {
      const department = await Department.findByPk(updates.department_id);
      if (!department) {
        return res.status(400).json({ message: 'Department not found' });
      }
    }

    const [affectedCount] = await User.update(updates, {
      where: { id }
    });

    if (affectedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }]
    });

    res.json(updatedUser);

  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { id: req.params.id }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(204).json();
    
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

exports.getManagers = async (req, res) => {
    try {
        const managers = await User.findAll({
            where: {
                role: 'manager'
            },
            attributes: [
                'id',
                'first_name',
                'last_name',
                'email',
                'role'
            ],
            order: [
                ['first_name', 'ASC']
            ]
        });

        res.json(managers);
    } catch (error) {
        console.error('Error fetching managers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching managers' 
        });
    }
};