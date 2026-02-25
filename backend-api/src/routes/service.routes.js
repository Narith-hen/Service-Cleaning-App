const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  uploadServiceImage,
  deleteServiceImage,
  getServiceReviews,
  toggleServiceAvailability,
  getPopularServices,
  searchServices
} = require('../controllers'); // Import from index.js
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { upload } = require('../middlewares/upload.middleware');

const router = express.Router();

// Public routes
router.get('/', [
  query('category').optional().isString(),
  query('minPrice').optional().isFloat(),
  query('maxPrice').optional().isFloat(),
  query('page').optional().isInt(),
  query('limit').optional().isInt(),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'popular', 'newest'])
], validate, getServices);

router.get('/search', [
  query('q').notEmpty().withMessage('Search query required'),
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, searchServices);

router.get('/popular', getPopularServices);
router.get('/:id', [
  param('id').isInt()
], validate, getServiceById);

router.get('/:id/reviews', [
  param('id').isInt(),
  query('page').optional().isInt(),
  query('limit').optional().isInt()
], validate, getServiceReviews);

// Protected routes (admin only)
router.use(authenticate);
router.use(authorize('admin'));

router.post('/', [
  body('name').notEmpty().withMessage('Service name required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('description').notEmpty().withMessage('Description required'),
  body('category').optional().isString(),
  body('duration').optional().isInt()
], validate, createService);

router.put('/:id', [
  param('id').isInt(),
  body('name').optional().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('description').optional().notEmpty(),
  body('is_available').optional().isBoolean()
], validate, updateService);

router.delete('/:id', [
  param('id').isInt()
], validate, deleteService);

router.post('/:id/images', upload.array('images', 5), uploadServiceImage);
router.delete('/:id/images/:imageId', [
  param('id').isInt(),
  param('imageId').isInt()
], validate, deleteServiceImage);

router.patch('/:id/toggle', [
  param('id').isInt()
], validate, toggleServiceAvailability);

module.exports = router;