const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize } = require("../config/db");
const Employee = require("../models/Employee");
require("dotenv").config();

const router = express.Router();

// Function to generate Employee ID based on role
const generateEmpId = async (role) => {
    let prefix = "";

    if (role === "admin") prefix = "WACLY-ADM";
    else if (role === "manager") prefix = "WACLY-MNG";
    else if (role === "employee") prefix = "WACLY-EMP";

    const latestUser = await Employee.findOne({
        where: { role },
        order: [["createdAt", "DESC"]],
    });

    let newId = `${prefix}-001`; // Default for first user

    if (latestUser) {
        const lastId = latestUser.emp_id.split("-").pop();
        const nextId = String(parseInt(lastId) + 1).padStart(3, "0");
        newId = `${prefix}-${nextId}`;
    }

    return newId;
};

// Register Employee (Only Admins can create Managers, Managers can add Employees)
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, createdByRole, phone_number } = req.body;

        // Validate role permissions
        if (createdByRole === "manager" && role !== "employee") {
            return res.status(403).json({ message: "Managers can only add employees." });
        }
        if (createdByRole === "employee") {
            return res.status(403).json({ message: "Employees cannot create users." });
        }

        // Check if user exists
        const existingUser = await Employee.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate Employee ID
        const emp_id = await generateEmpId(role);

        // Create new employee
        const newEmployee = await Employee.create({
            emp_id,
            name,
            email,
            phone_number,
            password: hashedPassword,
            role
        });

        res.status(201).json({ message: "Employee registered successfully", newEmployee });
    } catch (error) {
        console.error("❌ Error in Register Route:", error);
        res.status(500).json({ message: "Server Error", error: error.message || error });
    }
});

// Login Employee
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const employee = await Employee.findOne({ where: { email } });
        if (!employee) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Validate Password
        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: employee.id, role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({ message: "Login successful", token, role: employee.role });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// Fetch User Profile
router.get("/profile", async (req, res) => {
    try {
        // Extract token from Authorization header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user details
        const employee = await Employee.findByPk(decoded.id, {
            attributes: { exclude: ["password"] }, // Exclude password from the response
        });

        if (!employee) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile fetched successfully", employee });
    } catch (error) {
        console.error("❌ Error in Profile Route:", error);
        res.status(500).json({ message: "Server Error", error: error.message || error });
    }
});

// Seed Initial Admin
router.post("/seed-admin", async (req, res) => {
    console.log("🔥 Seed Admin Route Hit");
    try {
        const adminEmail = "admin@example.com";
        console.log("🔎 Checking if admin exists...");

        const existingAdmin = await Employee.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            console.log("❌ Admin already exists");
            return res.status(400).json({ message: "Admin already exists" });
        }

        console.log("🔑 Hashing password...");
        const hashedPassword = await bcrypt.hash("Admin@123", 10);

        console.log("🛠 Creating admin user...");
        const emp_id = await generateEmpId("admin");

        const admin = await Employee.create({
            emp_id,
            name: "Admin User",
            email: adminEmail,
            phone_number: "1234567890",
            password: hashedPassword,
            role: "admin"
        });

        console.log("✅ Admin seeded successfully:", admin);
        res.status(201).json({ message: "Admin seeded successfully", admin });
    } catch (error) {
        console.error("❌ Error in seeding admin:", error);
        res.status(500).json({ message: "Server Error", error: error.message || error });
    }
});

router.get("/test", (req, res) => {
    res.send("Auth route is working!");
});

module.exports = router;