require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./config/db");
const Employee = require("./models/Employee");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import Routes
const authRoutes = require("./routes/authRoutes"); // ✅ Import routes
app.use("/api/auth", authRoutes); // ✅ Register auth routes

// Test Route
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Sync Database
sequelize.sync()
    .then(() => console.log("✅ All tables synced successfully!"))
    .catch((err) => console.error("❌ Database sync error:", err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        // Log top-level routes
        console.log(`🛠 Registered Route: ${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === "router") {
        // Log nested routes (like those inside authRoutes)
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                console.log(`🛠 Registered Route: ${Object.keys(handler.route.methods)[0].toUpperCase()} /api/auth${handler.route.path}`);
            }
        });
    }
});
