const prisma = require('../../config/database');
const AppError = require('../../utils/error.util');
const { uploadChatImage } = require('../../services/cloudinary.service');

const toBigInt = (value) => {
  if (value === null || value === undefined) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const serializeMessage = (message) => ({
  id: message.id?.toString(),
  booking_id: message.booking_id ? message.booking_id.toString() : null,
  service_id: message.service_id ? message.service_id.toString() : null,
  sender_id: message.sender_id?.toString(),
  receiver_id: message.receiver_id?.toString(),
  message: message.message || '',
  file_url: message.file_url || '',
  file_type: message.file_type || '',
  is_read: Boolean(message.is_read),
  created_at: message.created_at,
  updated_at: message.updated_at,
  seen_at: message.seen_at,
  sender: message.sender ? {
    user_id: message.sender.user_id,
    username: message.sender.username,
    email: message.sender.email,
    role: message.sender.role ? { role_name: message.sender.role.role_name } : null
  } : null,
  receiver: message.receiver ? {
    user_id: message.receiver.user_id,
    username: message.receiver.username,
    email: message.receiver.email,
    role: message.receiver.role ? { role_name: message.receiver.role.role_name } : null
  } : null
});

const assertBookingAccess = (booking, userId) => {
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const normalizedUserId = Number(userId);
  const isCustomer = booking.user_id === normalizedUserId;
  const isCleaner = booking.cleaner_id === normalizedUserId;

  if (!isCustomer && !isCleaner) {
    throw new AppError('Not authorized to access this conversation', 403);
  }

  return { isCustomer, isCleaner };
};

const getMessagesByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingIdValue = Number(bookingId);

    if (!Number.isFinite(bookingIdValue)) {
      return next(new AppError('Invalid booking id', 400));
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingIdValue },
      select: {
        booking_id: true,
        user_id: true,
        cleaner_id: true
      }
    });

    assertBookingAccess(booking, req.user.user_id);

    const messages = await prisma.message.findMany({
      where: { booking_id: toBigInt(bookingIdValue) },
      orderBy: { created_at: 'asc' },
      include: {
        sender: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: { select: { role_name: true } }
          }
        },
        receiver: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: { select: { role_name: true } }
          }
        }
      }
    });

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
    console.log('[Message Controller] Creating message. User:', req.user);
    const { booking_id, message, file_url, file_type } = req.body;
    const bookingIdValue = Number(booking_id);

    if (!Number.isFinite(bookingIdValue)) {
      return next(new AppError('Booking ID is required', 400));
    }

    if (!message && !file_url) {
      return next(new AppError('Message text or file is required', 400));
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingIdValue },
      select: {
        booking_id: true,
        user_id: true,
        cleaner_id: true,
        service_id: true
      }
    });

    const { isCustomer } = assertBookingAccess(booking, req.user.user_id);

    if (!booking.cleaner_id) {
      return next(new AppError('Cleaner has not been assigned to this booking yet', 400));
    }

    const senderIdValue = Number(req.user.user_id);
    const receiverIdValue = isCustomer ? booking.cleaner_id : booking.user_id;

    console.log('[Message Controller] Sender ID:', senderIdValue, 'Receiver ID:', receiverIdValue, 'Is Customer:', isCustomer);

    const savedMessage = await prisma.message.create({
      data: {
        booking_id: toBigInt(bookingIdValue),
        service_id: booking.service_id ? toBigInt(booking.service_id) : null,
        sender_id: toBigInt(senderIdValue),
        receiver_id: toBigInt(receiverIdValue),
        message: message || null,
        file_url: file_url || null,
        file_type: file_type || null,
        is_read: false
      },
      include: {
        sender: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: { select: { role_name: true } }
          }
        },
        receiver: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: { select: { role_name: true } }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: serializeMessage(savedMessage)
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

    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingIdValue },
      select: {
        booking_id: true,
        user_id: true,
        cleaner_id: true
      }
    });

    assertBookingAccess(booking, req.user.user_id);

    const updated = await prisma.message.updateMany({
      where: {
        booking_id: toBigInt(bookingIdValue),
        receiver_id: toBigInt(req.user.user_id),
        is_read: false
      },
      data: {
        is_read: true,
        seen_at: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: { updated: updated.count }
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
