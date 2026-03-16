const db = require('../../config/db');
const promiseDb = db.promise();
const AppError = require('../../utils/error.util');
const { uploadChatImage } = require('../../services/cloudinary.service');

const serializeMessage = (message) => {
  return {
    id: message.message_id?.toString(),
    booking_id: message.booking_id ? message.booking_id.toString() : null,
    service_id: message.service_id ? message.service_id.toString() : null,
    sender_id: message.sender_user_id?.toString(),
    receiver_id: message.receiver_user_id?.toString(),
    message: message.message || '',
    file_url: message.file_url || '',
    file_type: message.file_type || '',
    is_read: Boolean(message.is_read),
    created_at: message.created_at,
    updated_at: message.updated_at,
    seen_at: message.seen_at,
    sender: {
      user_id: message.sender_user_id,
      username: (message.sender_first_name || '') + ' ' + (message.sender_last_name || ''),
      email: message.sender_email,
      role: { role_name: message.sender_role_id === 1 ? 'customer' : 'cleaner' }
    },
    receiver: {
      user_id: message.receiver_user_id,
      username: (message.receiver_first_name || '') + ' ' + (message.receiver_last_name || ''),
      email: message.receiver_email,
      role: { role_name: message.receiver_role_id === 1 ? 'customer' : 'cleaner' }
    }
  };
};

const assertBookingAccess = async (bookingId, userId) => {
  const [bookings] = await promiseDb.query(`SELECT * FROM bookings WHERE booking_id = ?`, [bookingId]);
  if (!bookings.length) {
    throw new AppError('Booking not found', 404);
  }
  const booking = bookings[0];
  const normalizedUserId = Number(userId);
  const isCustomer = booking.user_id === normalizedUserId;
  const isCleaner = booking.cleaner_id === normalizedUserId;

  if (!isCustomer && !isCleaner) {
    throw new AppError('Not authorized to access this conversation', 403);
  }
  return { booking, isCustomer, isCleaner };
};

const getMessagesByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingIdValue = Number(bookingId);

    if (!Number.isFinite(bookingIdValue)) {
      return next(new AppError('Invalid booking id', 400));
    }

    await assertBookingAccess(bookingIdValue, req.user.user_id);

    const [messages] = await promiseDb.query(`
      SELECT m.*, 
        s_acc.user_id as sender_user_id,
        r_acc.user_id as receiver_user_id,
        su.first_name as sender_first_name, su.last_name as sender_last_name, su.email as sender_email, su.role_id as sender_role_id,
        ru.first_name as receiver_first_name, ru.last_name as receiver_last_name, ru.email as receiver_email, ru.role_id as receiver_role_id
      FROM messages m
      LEFT JOIN acc s_acc ON m.sender_id = s_acc.acc_id
      LEFT JOIN acc r_acc ON m.receiver_id = r_acc.acc_id
      LEFT JOIN users su ON s_acc.user_id = su.user_id
      LEFT JOIN users ru ON r_acc.user_id = ru.user_id
      WHERE m.booking_id = ?
      ORDER BY m.created_at ASC
    `, [bookingIdValue]);

    res.status(200).json({
      success: true,
      data: messages.map(serializeMessage)
    });
  } catch (error) {
    next(error);
  }
};

const createMessage = async (req, res, next) => {
  try {
    const { booking_id, message, file_url, file_type } = req.body;
    const bookingIdValue = Number(booking_id);

    if (!Number.isFinite(bookingIdValue)) {
      return next(new AppError('Booking ID is required', 400));
    }

    if (!message && !file_url) {
      return next(new AppError('Message text or file is required', 400));
    }

    const { booking, isCustomer } = await assertBookingAccess(bookingIdValue, req.user.user_id);

    if (!booking.cleaner_id) {
      return next(new AppError('Cleaner has not been assigned to this booking yet', 400));
    }

    const senderUserId = Number(req.user.user_id);
    const receiverUserId = isCustomer ? booking.cleaner_id : booking.user_id;

    const [accs] = await promiseDb.query(`SELECT user_id, acc_id FROM acc WHERE user_id IN (?, ?)`, [senderUserId, receiverUserId]);
    
    let senderAccId = accs.find(a => a.user_id === senderUserId)?.acc_id;
    let receiverAccId = accs.find(a => a.user_id === receiverUserId)?.acc_id;

    if (!senderAccId) {
      const [res1] = await promiseDb.query("INSERT INTO acc (user_id) VALUES (?)", [senderUserId]);
      senderAccId = res1.insertId;
    }
    if (!receiverAccId) {
      const [res2] = await promiseDb.query("INSERT INTO acc (user_id) VALUES (?)", [receiverUserId]);
      receiverAccId = res2.insertId;
    }

    const [insertResult] = await promiseDb.query(`
      INSERT INTO messages (booking_id, service_id, sender_id, receiver_id, message, file_url, file_type, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [bookingIdValue, booking.service_id, senderAccId, receiverAccId, message || null, file_url || null, file_type || null]);
    
    const [newMessage] = await promiseDb.query(`
      SELECT m.*, 
        s_acc.user_id as sender_user_id,
        r_acc.user_id as receiver_user_id,
        su.first_name as sender_first_name, su.last_name as sender_last_name, su.email as sender_email, su.role_id as sender_role_id,
        ru.first_name as receiver_first_name, ru.last_name as receiver_last_name, ru.email as receiver_email, ru.role_id as receiver_role_id
      FROM messages m
      LEFT JOIN acc s_acc ON m.sender_id = s_acc.acc_id
      LEFT JOIN acc r_acc ON m.receiver_id = r_acc.acc_id
      LEFT JOIN users su ON s_acc.user_id = su.user_id
      LEFT JOIN users ru ON r_acc.user_id = ru.user_id
      WHERE m.message_id = ?
    `, [insertResult.insertId]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: serializeMessage(newMessage[0])
    });
  } catch (error) {
    next(error);
  }
};

const markMessagesRead = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingIdValue = Number(bookingId);

    if (!Number.isFinite(bookingIdValue)) {
      return next(new AppError('Invalid booking id', 400));
    }

    await assertBookingAccess(bookingIdValue, req.user.user_id);
    
    const [accs] = await promiseDb.query(`SELECT acc_id FROM acc WHERE user_id = ?`, [req.user.user_id]);
    if (!accs.length) {
       return res.status(200).json({ success: true, message: 'No messages to mark', data: { updated: 0 } });
    }
    const receiverAccId = accs[0].acc_id;

    const [updated] = await promiseDb.query(`
      UPDATE messages 
      SET is_read = 1, seen_at = NOW() 
      WHERE booking_id = ? AND receiver_id = ? AND is_read = 0
    `, [bookingIdValue, receiverAccId]);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: { updated: updated.affectedRows }
    });
  } catch (error) {
    next(error);
  }
};

const uploadMessageImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Image file is required', 400));
    }

    const uploaded = await uploadChatImage(req.file.path);
    const fileUrl = uploaded?.url || `/uploads/misc/${req.file.filename}`;
    const fileType = req.file.originalname || req.file.mimetype || 'image';

    res.status(200).json({
      success: true,
      data: {
        file_url: fileUrl,
        file_type: fileType
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessagesByBooking,
  createMessage,
  markMessagesRead,
  uploadMessageImage
};
