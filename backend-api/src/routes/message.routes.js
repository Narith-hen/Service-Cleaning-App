const express = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { upload } = require('../middlewares/upload.middleware');
const {
  getMessagesByBooking,
  createMessage,
  markMessagesRead,
  uploadMessageImage,
  toggleBlockChat,
  deleteChat,
  getChatBlockStatus
} = require('../controllers/base/message.controller');

const router = express.Router();

router.use(authenticate);

router.get('/booking/:bookingId', [
  param('bookingId').isInt().withMessage('Valid booking id is required')
], validate, getMessagesByBooking);

router.post('/', [
  body('booking_id').isInt().withMessage('Booking ID is required'),
  body('message').optional().isString(),
  body('file_url').optional().isString(),
  body('file_type').optional().isString()
], validate, createMessage);

router.post('/upload', upload.single('image'), uploadMessageImage);

router.patch('/booking/:bookingId/read', [
  param('bookingId').isInt().withMessage('Valid booking id is required')
], validate, markMessagesRead);

// Block/unblock a chat
router.patch('/booking/:bookingId/block', [
  param('bookingId').isInt().withMessage('Valid booking id is required')
], validate, toggleBlockChat);

// Get chat block status
router.get('/booking/:bookingId/block-status', [
  param('bookingId').isInt().withMessage('Valid booking id is required')
], validate, getChatBlockStatus);

// Delete all messages in a chat
router.delete('/booking/:bookingId', [
  param('bookingId').isInt().withMessage('Valid booking id is required')
], validate, deleteChat);

module.exports = router;
