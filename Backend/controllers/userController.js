const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user (default role is "employee" if not provided)
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "employee",
        });

        res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login User
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        // Determine the redirect URL based on user role
        let redirectUrl = "/";
        if (user.role === "admin") redirectUrl = "/admin-dashboard";
        if (user.role === "manager") redirectUrl = "/manager-dashboard";
        if (user.role === "employee") redirectUrl = "/employee-dashboard";

        res.status(200).json({
            message: "Login successful",
            role: user.role,
            redirectUrl, // Include the redirect URL
            token, // Send the token to the client
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update User Role (Admin Only)
const updateUserRole = async (req, res) => {
    try {
        const { userId, newRole } = req.body;

        // Only admins can change roles
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized: Only admins can update roles" });
        }

        // Only allow 'manager' or 'admin' as new roles
        if (!["manager", "admin"].includes(newRole)) {
            return res.status(400).json({ message: "Invalid role assignment" });
        }

        // Find user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update role
        user.role = newRole;
        await user.save();

        res.status(200).json({ message: `User promoted to ${newRole}`, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Users (Admin Only)
const getUsers = async (req, res) => {
    try {
        // Only admins can fetch all users
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized: Only admins can view users" });
        }

        const users = await User.findAll({ attributes: { exclude: ["password"] } });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Single User (Role-Based Access)
const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;

        // Fetch user
        const user = await User.findByPk(userId, { attributes: { exclude: ["password"] } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Restrict access: Employees can only see their own data
        if (req.user.role === "employee" && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ message: "Unauthorized: You can only view your profile" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, updateUserRole, getUsers, getUserProfile };
