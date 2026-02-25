const express = require('express');
const { 
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getUserSettings,
  updateSettings,
  getUserBookings,
  getUserReviews,
  getCleaners,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers'); // Import from index.js
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes (for logged-in user)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// Settings routes
router.get('/settings', getUserSettings);
router.put('/settings', updateSettings);

// Bookings and reviews for logged-in user
router.get('/my-bookings', getUserBookings);
router.get('/my-reviews', getUserReviews);

// Cleaners list (public within authenticated)
router.get('/cleaners', getCleaners);

// Admin only routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;