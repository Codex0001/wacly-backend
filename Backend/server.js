const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { sequelize, connectDB } = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MySQL database
connectDB();

// Initialize app
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", require("./routes/userRoutes"));

app.get("/", (req, res) => {
    res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await sequelize.sync(); // Sync models with database
});
