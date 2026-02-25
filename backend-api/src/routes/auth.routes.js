const express = require('express');
const { 
  register, 
  login, 
  logout, 
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile 
} = require('../controllers'); // Import from index.js
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

module.exports = router;