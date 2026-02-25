const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  applyPromotion,
  validatePromoCode,
  getActivePromotions,
  getPromotionStats
} = require('../controllers'); // Import from index.js
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

// Public routes
router.get('/active', getActivePromotions);
router.post('/validate', [
  body('code').notEmpty().withMessage('Promo code required'),
  body('amount').optional().isFloat()
], validate, validatePromoCode);

// Protected routes (authenticated users)
router.use(authenticate);

router.post('/apply', [
  body('code').notEmpty().withMessage('Promo code required'),
  body('booking_id').isInt().withMessage('Booking ID required')
], validate, applyPromotion);

// Admin only routes
router.use(authorize('admin'));

router.post('/', [
  body('code').notEmpty().withMessage('Promo code required'),
  body('discount_price').isFloat({ min: 0 }).withMessage('Valid discount required'),
  body('discount_type').isIn(['fixed', 'percentage']).withMessage('Invalid discount type'),
  body('start_date').isISO8601().withMessage('Valid start date required'),
  body('end_date').isISO8601().withMessage('Valid end date required'),
  body('min_purchase').optional().isFloat({ min: 0 }),
  body('max_discount').optional().isFloat({ min: 0 }),
  body('usage_limit').optional().isInt()
], validate, createPromotion);

router.get('/', [
  query('status').optional().isIn(['active', 'expired', 'upcoming']),
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getPromotions);

router.get('/stats', getPromotionStats);
router.get('/:id', [
  param('id').isInt()
], validate, getPromotionById);

router.put('/:id', [
  param('id').isInt(),
  body('code').optional().notEmpty(),
  body('discount_price').optional().isFloat({ min: 0 }),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601()
], validate, updatePromotion);

router.delete('/:id', [
  param('id').isInt()
], validate, deletePromotion);

module.exports = router;