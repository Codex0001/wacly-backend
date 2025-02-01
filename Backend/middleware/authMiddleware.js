const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes (require authentication)
const protect = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findByPk(decoded.id);

        if (!req.user) {
            return res.status(401).json({ message: "User not found" });
        }

        next();
    } catch (error) {
        res.status(401).json({ message: "Not authorized, invalid token" });
    }
};

// Middleware to restrict access to admins only
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
};

module.exports = { protect, adminOnly };

export const logout = () => {
    localStorage.removeItem("token"); // Remove JWT token if stored
    localStorage.removeItem("user"); // Remove user info if stored
    sessionStorage.clear(); // Optional: Clear session storage
    window.location.href = "/login"; // Redirect to login page
  };