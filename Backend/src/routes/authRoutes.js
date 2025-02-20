const router = require('express').Router();
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
// Public routes (no authentication required)
router.post('/login', authController.login);
router.post('/setup-admin', authController.setupAdmin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes (require valid JWT)
router.get('/me', protect, authController.getMe); 
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', protect, authController.refreshToken);

// Conditional registration route
router.post('/register', 
  async (req, res, next) => {
    if (process.env.INITIAL_SETUP === 'true') return next();
    protect(req, res, next);
  },
  (req, res, next) => {
    if (process.env.INITIAL_SETUP !== 'true') {
      restrictTo('admin')(req, res, next);
    } else {
      next();
    }
  },
  authController.register
);
module.exports = router;