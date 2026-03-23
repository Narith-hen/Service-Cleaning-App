const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');
const {
  register,
  login,
  getProfile,
  updateProfile,
  uploadAvatar,
} = require('../controllers/customer/authController');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.post('/logout', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
