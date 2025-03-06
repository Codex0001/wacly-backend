// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  // Configure your email service
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendLeaveRequestNotification = async (user, manager, leaveRequest) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: manager.email,
      subject: 'New Leave Request',
      html: `
        <h2>New Leave Request</h2>
        <p>Employee: ${user.first_name} ${user.last_name}</p>
        <p>Start Date: ${leaveRequest.startDate}</p>
        <p>End Date: ${leaveRequest.endDate}</p>
        <p>Reason: ${leaveRequest.reason}</p>
      `
    });
  } catch (error) {
    console.error('Email notification failed:', error);
  }
};

exports.sendLeaveStatusNotification = async (user, leaveRequest) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: `Leave Request ${leaveRequest.status}`,
      html: `
        <h2>Leave Request Update</h2>
        <p>Your leave request has been ${leaveRequest.status.toLowerCase()}</p>
        <p>Start Date: ${leaveRequest.startDate}</p>
        <p>End Date: ${leaveRequest.endDate}</p>
        ${leaveRequest.comments ? `<p>Comments: ${leaveRequest.comments}</p>` : ''}
      `
    });
  } catch (error) {
    console.error('Email notification failed:', error);
  }
};