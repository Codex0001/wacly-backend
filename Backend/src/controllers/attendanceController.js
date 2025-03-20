const { User, Attendance } = require('../models');
const { Op } = require('sequelize');

// Helper function for date handling
const getTodayDateString = () => new Date().toISOString().split('T')[0];

// Clock in
const clockIn = async (req, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();
      const todayDate = getTodayDateString();
  
      // First, check for active session
      const activeSession = await Attendance.findOne({
        where: {
          user_id: userId,
          status: 'In Progress',
          session_date: todayDate
        }
      });
  
      if (activeSession) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active session today'
        });
      }
  
      // Create new attendance record
      const attendance = await Attendance.create({
        user_id: userId,
        clock_in: now,
        status: 'In Progress',
        session_date: todayDate
      });
  
      return res.status(201).json({
        success: true,
        message: 'Clock in successful',
        data: attendance
      });
    } catch (error) {
      console.error('Clock in error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

// Clock out
const clockOut = async (req, res) => {
    try {
      const userId = req.user.id;
      const todayDate = getTodayDateString();
      const now = new Date();
  
      const activeSession = await Attendance.findOne({
        where: {
          user_id: userId,
          status: 'In Progress',
          session_date: todayDate
        }
      });
  
      if (!activeSession) {
        return res.status(400).json({
          success: false,
          message: 'No active session found for today'
        });
      }
  
      const clockOutTime = now;
      const clockInTime = new Date(activeSession.clock_in);
      const durationMinutes = Math.floor(
        (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60)
      );
  
      activeSession.clock_out = clockOutTime;
      activeSession.duration = durationMinutes;
      activeSession.status = 'Completed';
      await activeSession.save();
  
      return res.status(200).json({
        success: true,
        message: 'Clock out successful',
        data: activeSession
      });
    } catch (error) {
      console.error('Clock out error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};  
// Get current day's attendance
const getTodayAttendance = async (req, res) => {
    try {
      const userId = req.user.id;
      const todayDate = getTodayDateString();
  
      const todayAttendance = await Attendance.findAll({
        where: {
          user_id: userId,
          session_date: todayDate
        },
        order: [['created_at', 'DESC']],
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email', 'department_id']
        }]
      });
  
      return res.status(200).json({
        success: true,
        data: todayAttendance
      });
    } catch (error) {
      console.error('Get today attendance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

// Get attendance history
const getAttendanceHistory = async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startDate = req.query.startDate ? req.query.startDate : null;
      const endDate = req.query.endDate ? req.query.endDate : null;
  
      let whereClause = { user_id: userId };
      if (startDate && endDate) {
        whereClause.session_date = { [Op.between]: [startDate, endDate] }; // Changed from created_at to session_date
      }
  
      const { rows: attendance, count: total } = await Attendance.findAndCountAll({
        where: whereClause,
        order: [['session_date', 'DESC'], ['clock_in', 'DESC']], // Updated ordering
        limit: limit,
        offset: (page - 1) * limit,
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email', 'department_id']
        }]
      });
  
      return res.status(200).json({
        success: true,
        data: {
          attendance,
          pagination: {
            total,
            page,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get attendance history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

// Get active session
const getActiveSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayDate = new Date().toISOString().split('T')[0];

    const activeSession = await Attendance.findOne({
      where: {
        user_id: userId,
        status: 'In Progress',
        session_date: todayDate
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['first_name', 'last_name', 'email', 'department_id']
      }]
    });

    return res.status(200).json({
      success: true,
      data: activeSession || null,
      message: activeSession ? 'Active session found' : 'No active session'
    });

  } catch (error) {
    console.error('Get active session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active session',
      error: error.message
    });
  }
};

module.exports = {
  getActiveSession
};

// Get statistics
const getStatistics = async (req, res) => {
    try {
      const userId = req.user.id;
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = today.toISOString().split('T')[0];
  
      const monthlyAttendance = await Attendance.findAll({
        where: {
          user_id: userId,
          session_date: { [Op.between]: [startOfMonth, endOfMonth] }, // Changed from created_at to session_date
          status: 'Completed'
        }
      });
  
      const totalMinutes = monthlyAttendance.reduce((acc, curr) => {
        return acc + (curr.duration || 0);
      }, 0);
  
      const totalHours = totalMinutes / 60;
      const averageHoursPerDay = monthlyAttendance.length ? totalHours / monthlyAttendance.length : 0;
  
      return res.status(200).json({
        success: true,
        data: {
          totalDays: monthlyAttendance.length,
          totalHours: Math.round(totalHours * 100) / 100,
          averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100
        }
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

// Get department attendance
const getDepartmentAttendance = async (req, res) => {
    try {
      const { startDate, endDate, page = 1, limit = 10 } = req.query;
      const departmentId = req.user.department_id;
  
      if (!departmentId && req.user.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'No department assigned'
        });
      }
  
      let whereClause = {};
      if (startDate && endDate) {
        whereClause.session_date = { [Op.between]: [startDate, endDate] }; // Changed from created_at to session_date
      }
  
      const { rows: attendance, count } = await Attendance.findAndCountAll({
        include: [{
          model: User,
          as: 'user',
          where: departmentId ? { department_id: departmentId } : {},
          attributes: ['id', 'first_name', 'last_name', 'email', 'department_id']
        }],
        where: whereClause,
        order: [['session_date', 'DESC'], ['clock_in', 'DESC']], // Updated ordering
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });
  
      return res.status(200).json({
        success: true,
        data: {
          attendance,
          pagination: {
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Department attendance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch department attendance',
        error: error.message
      });
    }
};

// Get all attendance
const getAllAttendance = async (req, res) => {
    try {
      const { startDate, endDate, department_id, page = 1, limit = 10, status } = req.query;
      let whereClause = {};
      let userWhereClause = {};
  
      // Update date filtering to use session_date
      if (startDate && endDate) {
        whereClause.session_date = {
          [Op.between]: [startDate, endDate]
        };
      }
  
      if (department_id) {
        userWhereClause.department_id = department_id;
      }
  
      if (status) {
        whereClause.status = status;
      }
  
      const { rows: attendance, count } = await Attendance.findAndCountAll({
        include: [{
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['id', 'first_name', 'last_name', 'email', 'department_id']
        }],
        where: whereClause,
        order: [
          ['session_date', 'DESC'],
          ['clock_in', 'DESC']
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });
  
      return res.status(200).json({
        success: true,
        data: {
          attendance,
          pagination: {
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get all attendance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance records',
        error: error.message
      });
    }
};

// Get report
const getReport = async (req, res) => {
    try {
      const { startDate, endDate, department_id } = req.query;
      let whereClause = {};
      let userWhereClause = {};
  
      // Update date filtering to use session_date
      if (startDate && endDate) {
        whereClause.session_date = {
          [Op.between]: [startDate, endDate]
        };
      }
  
      // Handle department filtering based on user role
      if (req.user.role === 'manager') {
        userWhereClause.department_id = req.user.department_id;
      } else if (department_id) {
        userWhereClause.department_id = department_id;
      }
  
      const attendance = await Attendance.findAll({
        include: [{
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['id', 'first_name', 'last_name', 'email', 'department_id']
        }],
        where: whereClause,
        order: [
          ['session_date', 'DESC'],
          ['clock_in', 'DESC']
        ]
      });
  
      // Calculate statistics with improved accuracy
      const stats = attendance.reduce((acc, curr) => {
        const userId = curr.user.id;
        const userName = `${curr.user.first_name} ${curr.user.last_name}`;
  
        // Initialize user stats if not exists
        if (!acc.userStats[userId]) {
          acc.userStats[userId] = {
            name: userName,
            totalHours: 0,
            totalDays: new Set(), // Use Set to count unique days
            averageHoursPerDay: 0,
            totalAttendance: 0,
            completedSessions: 0
          };
        }
  
        // Update statistics
        if (curr.duration) {
          acc.userStats[userId].totalHours += curr.duration / 60;
          acc.userStats[userId].totalDays.add(curr.session_date);
          acc.departmentTotalHours += curr.duration / 60;
          
          if (curr.status === 'Completed') {
            acc.userStats[userId].completedSessions += 1;
          }
        }
  
        acc.userStats[userId].totalAttendance += 1;
        acc.totalEntries += 1;
  
        return acc;
      }, {
        userStats: {},
        departmentTotalHours: 0,
        totalEntries: 0
      });
  
      // Calculate final statistics
      Object.keys(stats.userStats).forEach(userId => {
        const userStat = stats.userStats[userId];
        const uniqueDaysCount = userStat.totalDays.size;
  
        userStat.totalDays = uniqueDaysCount; // Replace Set with count
        userStat.averageHoursPerDay = uniqueDaysCount ? 
          Math.round((userStat.totalHours / uniqueDaysCount) * 100) / 100 : 0;
        userStat.totalHours = Math.round(userStat.totalHours * 100) / 100;
      });
  
      return res.status(200).json({
        success: true,
        data: {
          attendance,
          statistics: {
            departmentTotalHours: Math.round(stats.departmentTotalHours * 100) / 100,
            totalEntries: stats.totalEntries,
            averageHoursPerDay: stats.totalEntries ? 
              Math.round((stats.departmentTotalHours / stats.totalEntries) * 100) / 100 : 0,
            userStatistics: stats.userStats
          }
        }
      });
    } catch (error) {
      console.error('Report generation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate attendance report',
        error: error.message
      });
    }
};

module.exports = {
    clockIn,
    clockOut,
    getActiveSession,
    getTodayAttendance,
    getAttendanceHistory,
    getStatistics,
    getDepartmentAttendance,
    getAllAttendance,
    getReport
};