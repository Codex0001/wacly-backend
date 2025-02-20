const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    validate: {
      is: /^\+\d{1,3}\d{6,14}$/ // E.164 format
    }
  },
  dob: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true
    }
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other')
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'employee'),
    allowNull: false,
    defaultValue: 'employee'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 100]
    }
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      const roleCount = await User.count({
        where: { role: user.role }
      });
      user.id = generateEmployeeId(user.role, roleCount + 1);
    },
    beforeUpdate: (user) => {
      if (user.changed('password')) {
        user.password = bcrypt.hashSync(user.password, 10);
      }
    }
  }
});

User.prototype.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// Enhanced ID generation
const generateEmployeeId = (role, count) => {
  const roleMap = {
    admin: 'ADM',
    manager: 'MNG',
    employee: 'EMP'
  };
  return `WACLY-${roleMap[role]}-${String(count).padStart(4, '0')}`;
};

User.associate = (models) => {
  User.belongsTo(models.Department, {
    foreignKey: 'department_id',
    as: 'department',
    onDelete: 'SET NULL'
  });
};

// Instance methods
User.prototype.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = User;