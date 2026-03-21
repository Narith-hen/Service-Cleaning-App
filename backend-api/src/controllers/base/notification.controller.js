const db = require('../../config/db');
const AppError = require('../../utils/error.util');

const parsePositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const parseBooleanFilter = (value) => {
  if (value === true || value === 'true' || value === 1 || value === '1') return 1;
  if (value === false || value === 'false' || value === 0 || value === '0') return 0;
  return null;
};

const getNotifications = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(100, Math.max(1, parsePositiveInt(req.query?.limit, 10)));
    const offset = (page - 1) * limit;
    const typeFilter = String(req.query?.type || '').trim().toLowerCase();
    const readFilter = parseBooleanFilter(req.query?.is_read);
    const userId = Number(req.user?.user_id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return next(new AppError('Unauthorized', 401));
    }

    const whereClauses = ['n.user_id = ?'];
    const params = [userId];

    if (typeFilter) {
      whereClauses.push('LOWER(n.type_notification) = ?');
      params.push(typeFilter);
    }

    if (readFilter !== null) {
      whereClauses.push('n.is_read = ?');
      params.push(readFilter);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const [notificationsRows] = await promiseDb.query(
      `
        SELECT
          n.notification_id,
          n.title,
          n.message,
          n.type_notification,
          n.is_read,
          n.created_at,
          n.user_id,
          n.booking_id,
          b.booking_status
        FROM notifications n
        LEFT JOIN bookings b ON b.booking_id = n.booking_id
        ${whereSql}
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const [countRows] = await promiseDb.query(
      `
        SELECT COUNT(*) AS total
        FROM notifications n
        ${whereSql}
      `,
      params
    );

    const total = Number(countRows?.[0]?.total || 0);
    const notifications = (notificationsRows || []).map((row) => ({
      notification_id: row.notification_id,
      title: row.title,
      message: row.message,
      type_notification: row.type_notification,
      is_read: Boolean(row.is_read),
      created_at: row.created_at,
      user_id: row.user_id,
      booking_id: row.booking_id,
      booking: row.booking_id ? { booking_id: row.booking_id, booking_status: row.booking_status } : null
    }));

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getNotificationById = async (req, res, next) => {
  try {
    const notificationId = parsePositiveInt(req.params?.id);
    const userId = Number(req.user?.user_id);

    if (!notificationId) return next(new AppError('Invalid notification id', 400));
    if (!Number.isInteger(userId) || userId <= 0) return next(new AppError('Unauthorized', 401));

    const [rows] = await db.promise().query(
      `
        SELECT
          n.notification_id,
          n.title,
          n.message,
          n.type_notification,
          n.is_read,
          n.created_at,
          n.user_id,
          n.booking_id,
          b.booking_status
        FROM notifications n
        LEFT JOIN bookings b ON b.booking_id = n.booking_id
        WHERE n.notification_id = ? AND n.user_id = ?
        LIMIT 1
      `,
      [notificationId, userId]
    );

    const row = rows?.[0];
    if (!row) return next(new AppError('Notification not found', 404));

    return res.status(200).json({
      success: true,
      data: {
        notification_id: row.notification_id,
        title: row.title,
        message: row.message,
        type_notification: row.type_notification,
        is_read: Boolean(row.is_read),
        created_at: row.created_at,
        user_id: row.user_id,
        booking_id: row.booking_id,
        booking: row.booking_id ? { booking_id: row.booking_id, booking_status: row.booking_status } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notificationId = parsePositiveInt(req.params?.id);
    const userId = Number(req.user?.user_id);

    if (!notificationId) return next(new AppError('Invalid notification id', 400));
    if (!Number.isInteger(userId) || userId <= 0) return next(new AppError('Unauthorized', 401));

    const [result] = await db.promise().query(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!result?.affectedRows) {
      return next(new AppError('Notification not found', 404));
    }

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
    const userId = Number(req.user?.user_id);
    if (!Number.isInteger(userId) || userId <= 0) return next(new AppError('Unauthorized', 401));

    await db.promise().query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

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
    const userId = Number(req.user?.user_id);
    if (!Number.isInteger(userId) || userId <= 0) return next(new AppError('Unauthorized', 401));

    const [rows] = await db.promise().query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    const count = Number(rows?.[0]?.unread_count || 0);

    res.status(200).json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notificationId = parsePositiveInt(req.params?.id);
    const userId = Number(req.user?.user_id);

    if (!notificationId) return next(new AppError('Invalid notification id', 400));
    if (!Number.isInteger(userId) || userId <= 0) return next(new AppError('Unauthorized', 401));

    const [result] = await db.promise().query(
      'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!result?.affectedRows) {
      return next(new AppError('Notification not found', 404));
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
};
