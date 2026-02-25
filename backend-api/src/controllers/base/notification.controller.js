const prisma = require('../../config/database');
const AppError = require('../../utils/error.util');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id: req.user.user_id },
        include: {
          booking: {
            select: {
              booking_id: true,
              booking_status: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.notification.count({
        where: { user_id: req.user.user_id }
      })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: {
        notification_id: parseInt(id),
        user_id: req.user.user_id
      },
      data: { is_read: true }
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        user_id: req.user.user_id,
        is_read: false
      },
      data: { is_read: true }
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: {
        user_id: req.user.user_id,
        is_read: false
      }
    });

    res.status(200).json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};