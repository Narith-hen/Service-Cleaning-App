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
  getMyBookingHistory,
  getBookingsByCleaner,
  getBookingHistory,
  trackBooking,
  getAvailableBookings,
  claimBooking,
  addBookingImages,
  updateNegotiatedPrice
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
  body('booking_status').optional().isIn(['pending', 'confirmed', 'in_progress', 'payment_required', 'completed', 'cancelled']),
  body('service_status').optional().isIn(['pending', 'booked', 'started', 'in_progress', 'completed', 'cancelled']),
  body().custom((value) => {
    if (!value?.booking_status && !value?.service_status) {
      throw new Error('booking_status or service_status is required');
    }
    return true;
  }),
  body('reason').optional().isString()
];

const assignCleanerValidation = [
  param('id').isInt(),
  body('cleaner_id').isInt().withMessage('Cleaner ID is required')
];

const negotiatedPriceValidation = [
  param('id').isInt(),
  body('negotiated_price').isFloat({ min: 0.01 }).withMessage('Valid negotiated price required')
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

// Logged-in customer booking history
router.get('/my-history', authorize('customer', 'admin'), [
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getMyBookingHistory);

// Get user bookings
router.get('/user/:userId', authorize('admin', 'customer'), [
  param('userId').isInt()
], validate, getBookingsByUser);

// Get cleaner bookings
router.get('/cleaner/:cleanerId', authorize('admin', 'cleaner'), [
  param('cleanerId').isInt()
], validate, getBookingsByCleaner);

// Available jobs for cleaners
// Cleaner fetch available jobs (auth required, no role gate to avoid role mismatches)
router.get('/available', [
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getAvailableBookings);

// Cleaner claim a job
router.patch('/:id/claim', [
  param('id').isInt()
], validate, claimBooking);

// Booking history
router.get('/history/:id', [
  param('id').isInt()
], validate, getBookingHistory);

// Booking images
router.post('/:id/images', [
  param('id').isInt(),
  body('images').isArray({ min: 1 })
], validate, addBookingImages);

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
router.patch('/:id/price', authorize('admin', 'cleaner'), negotiatedPriceValidation, validate, updateNegotiatedPrice);
router.patch('/:id/cancel', authorize('customer', 'admin'), [
  param('id').isInt(),
  body('reason').optional().isString()
], validate, cancelBooking);

module.exports = router;
