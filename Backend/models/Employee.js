const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const { v4: uuidv4 } = require("uuid");  // Import UUID generator

const Employee = sequelize.define('Employee', {
    emp_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,  

    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM("admin", "manager", "employee"),
        defaultValue: "employee",
    },
}, {
    timestamps: true,
});

sequelize.sync({ alter: true })
    .then(() => console.log("✅ Employee table synced successfully!"))
    .catch((err) => console.error("❌ Error syncing Employee table:", err));

    module.exports = sequelize.model('Employee', Employee);