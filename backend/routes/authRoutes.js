const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidators');

// Public auth routes
router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotPasswordValidator, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, authController.resetPassword);

// Protected auth routes
router.get('/me', authenticateUser, authController.getMe);

module.exports = router;
