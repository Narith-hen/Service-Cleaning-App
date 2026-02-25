const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  updateNotificationSettings,
  getNotificationSettings,
  sendNotification,
  subscribeToTopic,
  unsubscribeFromTopic
} = require('../controllers'); // Import from index.js
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Notification listing and management
router.get('/', [
  query('page').optional().isInt(),
  query('limit').optional().isInt(),
  query('type').optional().isString(),
  query('is_read').optional().isBoolean()
], validate, getNotifications);

router.get('/unread/count', getUnreadCount);
router.get('/:id', [
  param('id').isInt()
], validate, getNotificationById);

router.patch('/:id/read', [
  param('id').isInt()
], validate, markAsRead);

router.post('/read-all', markAllAsRead);
router.delete('/:id', [
  param('id').isInt()
], validate, deleteNotification);

// Notification settings
router.get('/settings', getNotificationSettings);
router.put('/settings', [
  body('email_notifications').optional().isBoolean(),
  body('push_notifications').optional().isBoolean(),
  body('sms_notifications').optional().isBoolean(),
  body('booking_updates').optional().isBoolean(),
  body('promotions').optional().isBoolean(),
  body('quiet_hours_start').optional().isString(),
  body('quiet_hours_end').optional().isString()
], validate, updateNotificationSettings);

// Subscription management
router.post('/subscribe', [
  body('topic').notEmpty().withMessage('Topic required')
], validate, subscribeToTopic);

router.post('/unsubscribe', [
  body('topic').notEmpty().withMessage('Topic required')
], validate, unsubscribeFromTopic);

// Admin only - send notifications
router.post('/send', authorize('admin'), [
  body('user_id').optional().isInt(),
  body('user_ids').optional().isArray(),
  body('title').notEmpty().withMessage('Title required'),
  body('message').notEmpty().withMessage('Message required'),
  body('type').isIn(['booking', 'promotion', 'system', 'alert']).withMessage('Invalid notification type'),
  body('data').optional().isObject()
], validate, sendNotification);

module.exports = router;