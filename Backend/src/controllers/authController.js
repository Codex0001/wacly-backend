const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { sequelize } = require('../config/db');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Case-sensitive direct match
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Update refresh token in DB
    await User.update(
      { refresh_token: refreshToken },
      { where: { id: user.id } }
    );

    // Set secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
    
  } catch (error) {
    console.error('Login error debug:', {
      message: error.message,
      stack: error.stack,
      original: error.original
    });
    res.status(500).json({ message: 'Authentication failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.sendStatus(204);

    // Clear refresh token in DB
    const user = await User.findOne({ where: { refresh_token: refreshToken } });
    if (user) await user.update({ refresh_token: null });

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: 'Unauthorized' });

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken: newAccessToken });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

exports.setupAdmin = async (req, res) => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ 
      where: { role: 'admin' },
      paranoid: false // Include soft-deleted users
    });

    if (adminExists) {
      return res.status(400).json({ 
        message: 'Primary admin already exists',
        solution: 'Use regular registration for additional admins'
      });
    }

    // Validate required fields
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        message: 'Email and password are required',
        example: {
          email: "admin@wacly.co",
          password: "SecurePass123!"
        }
      });
    }

    // Create admin with validation
    const admin = await User.create({
      ...req.body,
      password: await bcrypt.hash(req.body.password, 12), // Increased salt rounds
      role: 'admin',
      verified: true
    });

    // Return success without sensitive data
    res.status(201).json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        created_at: admin.createdAt
      }
    });
  } catch (error) {
    console.error('🔴 Admin Setup Error:', error);
    
    // Specific error handling
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Email already registered',
        resolution: 'Use a different email address'
      });
    }

    res.status(500).json({
      message: 'Admin creation failed',
      technical: process.env.NODE_ENV === 'development' 
        ? error.message 
        : undefined
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user) {
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_RESET_SECRET,
        { expiresIn: '1h' }
      );
      await user.update({ reset_token: resetToken });
      // Implement email sending logic here
    }

    res.json({ message: 'Password reset email sent if account exists' });

  } catch (error) {
    res.status(500).json({ message: 'Password reset failed' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.reset_token !== token) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({
      password: hashedPassword,
      reset_token: null
    });

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    res.status(400).json({ message: 'Password reset failed' });
  }
};

exports.register = async (req, res) => {
  try {
    const { password, email } = req.body;

    // Check for existing admin during initial setup
    if (process.env.INITIAL_SETUP === 'true') {
      const existingAdmin = await User.findOne({ where: { role: 'admin' } });
      if (existingAdmin) {
        delete process.env.INITIAL_SETUP;
        return res.status(400).json({ message: 'Setup already completed' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      ...req.body,
      password: hashedPassword,
      role: req.user ? req.body.role : 'employee'
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    res.status(400).json({
      message: error.name === 'SequelizeUniqueConstraintError'
        ? 'Email already exists'
        : 'Registration failed'
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) throw new Error('User not found');
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};