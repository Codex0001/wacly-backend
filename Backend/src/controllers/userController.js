const bcrypt = require('bcrypt');
const { User, Department } = require('../models');

exports.createUser = async (req, res) => {
    try {
        const { department_id, password, dob, gender, ...userData } = req.body;

        // Required fields check
        if (!password || !userData.email || !userData.role) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate email format
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userData.email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Validate role
        if (!['admin', 'manager', 'employee'].includes(userData.role)) {
            return res.status(400).json({ message: 'Invalid user role' });
        }

        // Validate DOB if provided
        if (dob) {
            const dobDate = new Date(dob);
            const today = new Date();
            const age = today.getFullYear() - dobDate.getFullYear();
            
            if (dobDate > today) {
                return res.status(400).json({ message: 'Date of birth cannot be in the future' });
            }
            
            if (age < 16 || age > 100) {
                return res.status(400).json({ message: 'Employee must be between 16 and 100 years old' });
            }
        }

        // Validate gender if provided
        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ message: 'Invalid gender value' });
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

        // Role management validation
        // Only admin can create admin or manager roles
        if (['admin', 'manager'].includes(userData.role) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to create this role type' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            ...userData,
            password: hashedPassword,
            department_id,
            dob,
            gender
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
        // Add pagination and filtering
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const role = req.query.role;
        const search = req.query.search;

        let whereClause = {};
        
        // Add role filter
        if (role && role !== 'all') {
            whereClause.role = role;
        }

        // Add search functionality
        if (search) {
            whereClause = {
                ...whereClause,
                [Op.or]: [
                    { first_name: { [Op.iLike]: `%${search}%` } },
                    { last_name: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const users = await User.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            include: [{
                model: Department,
                as: 'department',
                attributes: ['id', 'name']
            }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            users: users.rows,
            total: users.count,
            page,
            totalPages: Math.ceil(users.count / limit)
        });

    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, dob, gender, role, ...updates } = req.body;

        // Find existing user
        const existingUser = await User.findByPk(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Role update validation
        if (role) {
            // Only admin can change roles
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Unauthorized to change user roles' });
            }
            // Validate role value
            if (!['admin', 'manager', 'employee'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role value' });
            }
            updates.role = role;
        }

        // Validate DOB if provided
        if (dob) {
            const dobDate = new Date(dob);
            const today = new Date();
            const age = today.getFullYear() - dobDate.getFullYear();
            
            if (dobDate > today) {
                return res.status(400).json({ message: 'Date of birth cannot be in the future' });
            }
            
            if (age < 16 || age > 100) {
                return res.status(400).json({ message: 'Employee must be between 16 and 100 years old' });
            }
            updates.dob = dob;
        }

        // Validate gender if provided
        if (gender) {
            if (!['male', 'female', 'other'].includes(gender)) {
                return res.status(400).json({ message: 'Invalid gender value' });
            }
            updates.gender = gender;
        }

        // Hash new password if provided
        if (password) {
            updates.password = await bcrypt.hash(password, 10);
        }

        // Validate department if changing
        if (updates.department_id) {
            const department = await Department.findByPk(updates.department_id);
            if (!department) {
                return res.status(400).json({ message: 'Department not found' });
            }
        }

        await existingUser.update(updates);

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
        const userToDelete = await User.findByPk(req.params.id);
        
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting the last admin
        if (userToDelete.role === 'admin') {
            const adminCount = await User.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last admin user' });
            }
        }

        await userToDelete.destroy();
        res.status(204).send();

    } catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

exports.getManagers = async (req, res) => {
    try {
        const managers = await User.findAll({
            where: { role: 'manager' },
            attributes: [
                'id',
                'first_name',
                'last_name',
                'email',
                'role',
                'department_id'
            ],
            include: [{
                model: Department,
                as: 'department',
                attributes: ['id', 'name']
            }],
            order: [['first_name', 'ASC']]
        });

        res.json(managers);
    } catch (error) {
        console.error('Error fetching managers:', error);
        res.status(500).json({ message: 'Error fetching managers' });
    }
};