// utils/leaveUtils.js
const { LeaveRequest, LeaveType } = require('../models');
const { Op } = require('sequelize');

exports.calculateLeaveBalance = async (userId, leaveTypeId) => {
  try {
    const leaveType = await LeaveType.findByPk(leaveTypeId);
    const usedLeaves = await LeaveRequest.sum('days', {
      where: {
        userId,
        leaveTypeId,
        status: 'Approved',
        startDate: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1)
        }
      }
    });

    return {
      total: leaveType.daysAllowed,
      used: usedLeaves || 0,
      remaining: leaveType.daysAllowed - (usedLeaves || 0)
    };
  } catch (error) {
    throw new Error('Error calculating leave balance');
  }
};

exports.getLeaveStatistics = async (userId) => {
  try {
    const currentYear = new Date().getFullYear();
    const statistics = await LeaveRequest.findAll({
      where: {
        userId,
        startDate: {
          [Op.gte]: new Date(currentYear, 0, 1)
        }
      },
      include: [{ model: LeaveType, attributes: ['name'] }],
      attributes: [
        'status',
        'leaveTypeId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status', 'leaveTypeId', 'LeaveType.name']
    });

    return statistics;
  } catch (error) {
    throw new Error('Error fetching leave statistics');
  }
};