const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const bookingRoutes = require('./booking.routes');
const serviceRoutes = require('./service.routes');
const reviewRoutes = require('./review.routes');
const paymentRoutes = require('./payment.routes');
const promotionRoutes = require('./promotion.routes');
const notificationRoutes = require('./notification.routes');
const dashboardRoutes = require('./dashboard.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

// API version
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Cleaning Service API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      bookings: '/api/bookings',
      services: '/api/services',
      reviews: '/api/reviews',
      payments: '/api/payments',
      promotions: '/api/promotions',
      notifications: '/api/notifications',
      dashboard: '/api/dashboard',
      admin: '/api/admin'
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/services', serviceRoutes);
router.use('/reviews', reviewRoutes);
router.use('/payments', paymentRoutes);
router.use('/promotions', promotionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);

module.exports = router;