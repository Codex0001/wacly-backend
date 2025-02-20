// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protected routes
router.use(protect);

// Get all users
router.get('/', userController.getAllUsers);

// Create new user
router.post('/', restrictTo('admin'), userController.createUser);

// Update user
router.put('/:id', restrictTo('admin'), userController.updateUser);

// Delete user
router.delete('/:id', restrictTo('admin'), userController.deleteUser);

// Get all managers - accessible by admins
router.get('/managers', restrictTo('admin'), userController.getManagers);

module.exports = router;