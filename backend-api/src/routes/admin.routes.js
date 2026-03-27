const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  admin 
} = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { upload } = require('../middlewares/upload.middleware');

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

router.get('/services/:id', [
  param('id').isInt()
], validate, admin.getServiceById);

router.post('/services', [
  body('name').notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'Active', 'Inactive']),
  body('description').notEmpty(),
  body('image_url').optional().isString()
], validate, admin.createService);

router.put('/services/:id', [
  param('id').isInt(),
  body('name').optional(),
  body('description').optional(),
  body('status').optional().isIn(['active', 'inactive', 'Active', 'Inactive']),
  body('image_url').optional().isString()
], validate, admin.updateService);

router.post('/services/:id/image', [
  param('id').isInt()
], validate, upload.single('images'), admin.updateService);

router.delete('/services/:id', [
  param('id').isInt()
], validate, admin.deleteService);

// Cleaner management
router.get('/cleaners', admin.getAllCleaners);

router.post('/cleaners',
  upload.single('avatar'),
[
  body('companyName').notEmpty(),
  body('companyEmail').isEmail(),
  body('phoneNumber').notEmpty(),
  body('teamMember').notEmpty(),
  body('serviceType').optional().notEmpty(),
  body('address').optional(),
  body('latitude').optional(),
  body('longitude').optional(),
  body('password').isLength({ min: 6 }),
], validate, admin.createCleaner);

router.put('/cleaners/:id',
  upload.single('avatar'),
[
  param('id').notEmpty(),
  body('companyEmail').optional().isEmail(),
  body('password').optional().isLength({ min: 6 }),
], validate, admin.updateCleaner);

router.delete('/cleaners/:id', [
  param('id').notEmpty(),
], validate, admin.deleteCleaner);

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

// Review management
router.get('/reviews', [
  query('page').optional().isInt(),
  query('limit').optional().isInt(),
  query('rating').optional().isInt({ min: 1, max: 5 }),
  query('search').optional().isString(),
  query('sort').optional().isIn(['newest', 'oldest', 'highest', 'lowest'])
], validate, admin.getAllReviews);

router.get('/reviews/stats', admin.getReviewStats);

router.delete('/reviews/:id', [
  param('id').isInt()
], validate, admin.deleteReview);

// Reports
router.get('/reports/revenue', [
  query('range').optional().isIn(['week', 'month', 'total'])
], validate, admin.getRevenueReport);

router.get('/reports/performance', [
  query('range').optional().isIn(['week', 'month', 'total'])
], validate, admin.getPerformanceReport);

// Dashboard
router.get('/dashboard', admin.getAdminDashboard);
router.get('/dashboard/top-cleaners', admin.getTopCleaners);
router.get('/health', admin.getSystemHealth);

module.exports = router;
