const express = require("express");
const { 
    registerUser, 
    loginUser, 
    updateUserRole,  // Changed from promoteUser
    getUsers,
    getUserProfile 
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Register and Login Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Update User Role (Admin Only)
router.put("/role", protect, adminOnly, updateUserRole);  // Changed from promote to role

// Get All Users (Admin Only)
router.get("/", protect, adminOnly, getUsers);

// Get Single User Profile
router.get("/:id", protect, getUserProfile);

module.exports = router;