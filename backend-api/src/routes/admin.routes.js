const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  admin 
} = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// User management
router.get('/users', [
  query('page').optional().isInt(),
  query('limit').optional().isInt(),
  query('role').optional().isString(),
  query('search').optional().isString()
], validate, admin.getAllUsers);

router.post('/users', [
  body('username').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role_id').isInt(),
  body('phone_number').optional()
], validate, admin.createUser);

router.put('/users/:id', [
  param('id').isInt(),
  body('username').optional(),
  body('email').optional().isEmail(),
  body('role_id').optional().isInt(),
  body('is_active').optional().isBoolean()
], validate, admin.updateUser);

router.delete('/users/:id', [
  param('id').isInt()
], validate, admin.deleteUser);

// Service management
router.get('/services', [
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, admin.getAllServices);

router.post('/services', [
  body('name').notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('description').notEmpty(),
  body('category').optional(),
  body('duration').optional().isInt()
], validate, admin.createService);

router.put('/services/:id', [
  param('id').isInt(),
  body('name').optional(),
  body('price').optional().isFloat({ min: 0 }),
  body('description').optional(),
  body('category').optional(),
  body('duration').optional().isInt(),
  body('is_available').optional().isBoolean()
], validate, admin.updateService);

router.delete('/services/:id', [
  param('id').isInt()
], validate, admin.deleteService);

// Booking management
router.get('/bookings', [
  query('page').optional().isInt(),
  query('limit').optional().isInt(),
  query('status').optional().isString(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601()
], validate, admin.getAllBookings);

router.post('/bookings/:id/assign', [
  param('id').isInt(),
  body('cleaner_id').isInt()
], validate, admin.assignCleaner);

router.get('/bookings/stats', admin.getBookingStats);

// Promotion management
router.get('/promotions', [
  query('page').optional().isInt(),
  query('limit').optional().isInt(),
  query('status').optional().isIn(['active', 'expired', 'upcoming'])
], validate, admin.getAllPromotions);

router.post('/promotions', [
  body('code').notEmpty(),
  body('discount_price').isFloat({ min: 0 }),
  body('discount_type').isIn(['fixed', 'percentage']),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('min_purchase').optional().isFloat({ min: 0 }),
  body('max_discount').optional().isFloat({ min: 0 }),
  body('usage_limit').optional().isInt()
], validate, admin.createPromotion);

router.put('/promotions/:id', [
  param('id').isInt(),
  body('code').optional(),
  body('discount_price').optional().isFloat({ min: 0 }),
  body('discount_type').optional().isIn(['fixed', 'percentage']),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601()
], validate, admin.updatePromotion);

router.delete('/promotions/:id', [
  param('id').isInt()
], validate, admin.deletePromotion);

// Dashboard
router.get('/dashboard', admin.getAdminDashboard);
router.get('/health', admin.getSystemHealth);

module.exports = router;