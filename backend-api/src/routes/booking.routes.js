const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
  assignCleaner,
  cancelBooking,
  getBookingsByUser,
  getBookingsByCleaner,
  getBookingHistory,
  trackBooking
} = require('../controllers'); // Import from index.js
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createBookingValidation = [
  body('booking_date').isISO8601().withMessage('Valid booking date required'),
  body('service_id').isInt().withMessage('Service ID is required'),
  body('promotion_id').optional().isInt(),
  body('address').notEmpty().withMessage('Address is required'),
  body('notes').optional().isString(),
  body('contact_phone').optional().isMobilePhone()
];

const updateBookingValidation = [
  param('id').isInt(),
  body('booking_date').optional().isISO8601(),
  body('service_id').optional().isInt(),
  body('promotion_id').optional().isInt()
];

const statusUpdateValidation = [
  param('id').isInt(),
  body('booking_status').isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
  body('reason').optional().isString()
];

const assignCleanerValidation = [
  param('id').isInt(),
  body('cleaner_id').isInt().withMessage('Cleaner ID is required')
];

// Create booking (customers only)
router.post('/', authorize('customer', 'admin'), createBookingValidation, validate, createBooking);

// Get bookings with filters
router.get('/', [
  query('status').optional().isString(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getBookings);

// Track booking (real-time)
router.get('/track/:id', [
  param('id').isInt()
], validate, trackBooking);

// Get user bookings
router.get('/user/:userId', authorize('admin', 'customer'), [
  param('userId').isInt()
], validate, getBookingsByUser);

// Get cleaner bookings
router.get('/cleaner/:cleanerId', authorize('admin', 'cleaner'), [
  param('cleanerId').isInt()
], validate, getBookingsByCleaner);

// Booking history
router.get('/history/:id', [
  param('id').isInt()
], validate, getBookingHistory);

// Single booking operations
router.get('/:id', [
  param('id').isInt()
], validate, getBookingById);

router.put('/:id', authorize('admin', 'customer'), updateBookingValidation, validate, updateBooking);
router.delete('/:id', authorize('admin'), [
  param('id').isInt()
], validate, deleteBooking);

// Status management
router.patch('/:id/status', authorize('admin', 'cleaner'), statusUpdateValidation, validate, updateBookingStatus);
router.patch('/:id/assign', authorize('admin'), assignCleanerValidation, validate, assignCleaner);
router.patch('/:id/cancel', authorize('customer', 'admin'), [
  param('id').isInt(),
  body('reason').optional().isString()
], validate, cancelBooking);

module.exports = router;