const { Employee } = require('../models/Employee');

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have user ID in the request object
    const user = await Employee.findByPk(userId, {
      attributes: ['name', 'role', 'email', 'phone_number'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUserProfile };