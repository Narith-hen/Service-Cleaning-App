const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  createPayment,
  getPayments,
  getPaymentById,
  processPayment,
  refundPayment,
  verifyPayment,
  getUserPayments,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getPaymentHistory
} = require('../controllers'); // Import from index.js
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Payment creation
router.post('/', [
  body('booking_id').isInt().withMessage('Booking ID required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('payment_method').isIn(['cash', 'card', 'transfer', 'wallet']).withMessage('Invalid payment method')
], validate, createPayment);

// Payment methods management
router.get('/methods', getPaymentMethods);
router.post('/methods', [
  body('type').isIn(['card', 'bank', 'wallet']).withMessage('Invalid payment method type'),
  body('details').isObject().withMessage('Payment details required'),
  body('is_default').optional().isBoolean()
], validate, addPaymentMethod);

router.delete('/methods/:methodId', [
  param('methodId').isInt()
], validate, removePaymentMethod);

router.patch('/methods/:methodId/default', [
  param('methodId').isInt()
], validate, setDefaultPaymentMethod);

// Payment processing
router.post('/:id/process', [
  param('id').isInt(),
  body('payment_method_id').optional().isInt()
], validate, processPayment);

router.post('/:id/refund', authorize('admin'), [
  param('id').isInt(),
  body('amount').optional().isFloat({ min: 0 }),
  body('reason').optional().isString()
], validate, refundPayment);

router.post('/:id/verify', [
  param('id').isInt()
], validate, verifyPayment);

// Payment history and queries
router.get('/history', [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('status').optional().isString(),
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getPaymentHistory);

router.get('/user/:userId', authorize('admin'), [
  param('userId').isInt(),
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getUserPayments);

router.get('/', [
  query('status').optional().isString(),
  query('method').optional().isString(),
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getPayments);

router.get('/:id', [
  param('id').isInt()
], validate, getPaymentById);

module.exports = router;