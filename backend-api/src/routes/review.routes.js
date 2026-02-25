const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsByUser,
  getReviewsByCleaner,
  getReviewsByBooking,
  reportReview,
  markHelpful,
  getReviewStats
} = require('../controllers'); // Import from index.js
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

// Public routes
router.get('/', [
  query('serviceId').optional().isInt(),
  query('cleanerId').optional().isInt(),
  query('rating').optional().isInt({ min: 1, max: 5 }),
  query('page').optional().isInt(),
  query('limit').optional().isInt(),
  query('sort').optional().isIn(['newest', 'oldest', 'highest', 'lowest'])
], validate, getReviews);

router.get('/stats', [
  query('serviceId').optional().isInt(),
  query('cleanerId').optional().isInt()
], validate, getReviewStats);

router.get('/:id', [
  param('id').isInt()
], validate, getReviewById);

// Protected routes
router.use(authenticate);

router.post('/', [
  body('booking_id').isInt().withMessage('Booking ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
  body('comment').optional().isString().trim(),
  body('cleaner_id').optional().isInt()
], validate, createReview);

router.put('/:id', [
  param('id').isInt(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().isString().trim()
], validate, updateReview);

router.delete('/:id', [
  param('id').isInt()
], validate, deleteReview);

// User reviews
router.get('/user/:userId', [
  param('userId').isInt(),
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getReviewsByUser);

// Cleaner reviews
router.get('/cleaner/:cleanerId', [
  param('cleanerId').isInt(),
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getReviewsByCleaner);

// Booking review
router.get('/booking/:bookingId', [
  param('bookingId').isInt()
], validate, getReviewsByBooking);

// Review interactions
router.post('/:id/helpful', [
  param('id').isInt()
], validate, markHelpful);

router.post('/:id/report', [
  param('id').isInt(),
  body('reason').notEmpty().withMessage('Report reason required')
], validate, reportReview);

module.exports = router;