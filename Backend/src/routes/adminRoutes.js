const router = require('express').Router();
const departmentController = require('../controllers/departmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply admin protection to all department routes
router.use([
  protect,
  restrictTo('admin') // Changed to generic restrictTo
]);

// Standard CRUD endpoints
router.route('/')
  .post(departmentController.createDepartment)
  .get(departmentController.getAllDepartments);

router.route('/:id')
  .put(departmentController.updateDepartment)
  .delete(departmentController.deleteDepartment);

// 404 handler for undefined department routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Department API endpoint not found'
  });
});

module.exports = router;