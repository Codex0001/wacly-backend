const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Authorization required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refresh_token'] }
    });

    if (!user) throw new Error('User not found');
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    next();
  };
};