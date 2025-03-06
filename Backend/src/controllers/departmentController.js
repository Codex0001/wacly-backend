const { Department, User } = require('../models');
const sequelize = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');


  exports.createDepartment = async (req, res) => {
    try {
      // Validate if manager exists if provided
      if (req.body.manager_id) {
        const manager = await User.findByPk(req.body.manager_id);
        if (!manager) {
          return res.status(400).json({ message: 'Manager user not found' });
        }
      }

      const department = await Department.create({
        name: req.body.name,
        description: req.body.description,
        manager_id: req.body.manager_id
      });
      
      res.status(201).json(department);
    } catch (error) {
      res.status(400).json({ message: 'Error creating department' });
    }
  };

  exports.updateDepartment = async (req, res) => {
    try {
      const department = await Department.findByPk(req.params.id);
      if (!department) return res.status(404).json({ message: 'Department not found' });

      // Validate new manager if provided
      if (req.body.manager_id) {
        const newManager = await User.findByPk(req.body.manager_id);
        if (!newManager) {
          return res.status(400).json({ message: 'New manager not found' });
        }
      }

      await department.update({
        name: req.body.name || department.name,
        description: req.body.description || department.description,
        manager_id: req.body.manager_id ?? department.manager_id // Nullish coalescing
      });

      res.json(department);
    } catch (error) {
      res.status(400).json({ message: 'Error updating department' });
    }
  };

  // Get all departments with optional manager and employee count
  exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.findAll({
            include: [{
                model: User,
                as: 'manager',
                attributes: ['id', 'email', 'first_name', 'last_name'],
                required: false // Makes it a LEFT JOIN
            }],
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM Users
                            WHERE Users.department_id = Department.id
                            AND Users.id LIKE 'WACLY-EMP-%'
                        )`),
                        'employee_count'
                    ]
                ]
            },
            order: [['created_at', 'DESC']]
        });

        // Process the departments to ensure proper format
        const processedDepartments = departments.map(dept => {
            const deptData = dept.get({ plain: true });
            return {
                ...deptData,
                employee_count: parseInt(deptData.employee_count || 0),
                manager: deptData.manager ? {
                    id: deptData.manager.id,
                    first_name: deptData.manager.first_name,
                    last_name: deptData.manager.last_name,
                    email: deptData.manager.email
                } : null
            };
        });

        res.json(processedDepartments);

    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching departments',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
  };

  exports.deleteDepartment = async (req, res) => {
      try {
        const department = await Department.findByPk(req.params.id);
        if (!department) {
          return res.status(404).json({ message: 'Department not found' });
        }
    
        // Check if department has employees
        const employeeCount = await User.count({
          where: { department_id: req.params.id }
        });
    
        if (employeeCount > 0) {
          return res.status(400).json({ 
            message: 'Cannot delete department with active employees' 
          });
        }
    
        await department.destroy();
        res.json({ message: 'Department deleted successfully' });
      } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Error deleting department' });
      }
  };

  exports.transferEmployee = async (req, res) => {
    const { employeeId, toDept } = req.body;
    const transaction = await sequelize.transaction();

    try {
        if (!employeeId || !toDept) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate employee ID format
        if (!employeeId.startsWith('WACLY-EMP-')) {
            return res.status(400).json({ message: 'Invalid employee ID format' });
        }

        // Find the user
        const user = await User.findByPk(employeeId);
        if (!user) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Validate target department
        const toDepartment = await Department.findByPk(toDept);
        if (!toDepartment) {
            return res.status(404).json({ message: 'Target department not found' });
        }

        // Update user's department
        await user.update(
            { department_id: toDept },
            { transaction }
        );

        // Commit transaction
        await transaction.commit();

        res.json({
            success: true,
            message: 'Employee transferred successfully',
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                department_id: user.department_id
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Transfer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error transferring employee',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
  };


  exports.exportDepartments = async (req, res) => {
      try {
          const { format } = req.query;

          // Fetch departments with their managers
          const departments = await Department.findAll({
              include: [{
                  model: User,
                  as: 'manager',
                  attributes: ['id', 'first_name', 'last_name', 'email']
              }],
              order: [['created_at', 'DESC']]
          });

          if (format === 'csv') {
              // Create a new workbook and worksheet
              const workbook = new ExcelJS.Workbook();
              const worksheet = workbook.addWorksheet('Departments');

              // Add headers
              worksheet.columns = [
                  { header: 'ID', key: 'id', width: 10 },
                  { header: 'Name', key: 'name', width: 30 },
                  { header: 'Description', key: 'description', width: 50 },
                  { header: 'Manager', key: 'manager', width: 30 },
                  { header: 'Manager Email', key: 'managerEmail', width: 30 },
                  { header: 'Created At', key: 'createdAt', width: 20 },
                  { header: 'Updated At', key: 'updatedAt', width: 20 }
              ];

              // Add data
              departments.forEach(dept => {
                  worksheet.addRow({
                      id: dept.id,
                      name: dept.name,
                      description: dept.description,
                      manager: dept.manager ? `${dept.manager.first_name} ${dept.manager.last_name}` : 'No Manager',
                      managerEmail: dept.manager ? dept.manager.email : 'N/A',
                      createdAt: new Date(dept.created_at).toLocaleDateString(),
                      updatedAt: new Date(dept.updated_at).toLocaleDateString()
                  });
              });

              res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
              res.setHeader('Content-Disposition', 'attachment; filename=departments.xlsx');

              await workbook.xlsx.write(res);
              return res.end();

          } else if (format === 'pdf') {
              const doc = new PDFDocument();
              
              // Set response headers
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename=departments.pdf');
              
              // Pipe the PDF document to the response
              doc.pipe(res);
              
              // Add content
              doc.fontSize(16).text('Departments Report', { align: 'center' });
              doc.moveDown();
              
              departments.forEach(dept => {
                  doc.fontSize(12).text(`Department: ${dept.name}`);
                  doc.fontSize(10).text(`Description: ${dept.description || 'N/A'}`);
                  doc.fontSize(10).text(
                      `Manager: ${dept.manager ? 
                          `${dept.manager.first_name} ${dept.manager.last_name} (${dept.manager.email})` : 
                          'No Manager'}`
                  );
                  doc.moveDown();
              });
              
              // Finalize PDF file
              doc.end();

          } else {
              return res.status(400).json({ 
                  message: 'Invalid export format. Supported formats are "csv" and "pdf".' 
              });
          }

      } catch (error) {
          console.error('Export error:', error);
          res.status(500).json({ 
              message: 'Failed to export departments',
              error: error.message 
          });
      }
  };