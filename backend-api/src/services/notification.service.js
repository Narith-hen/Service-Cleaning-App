const redis = require('../config/redis');
const db = require('../config/db');
const queueService = require('./queue.service');

const parsePositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toBoolean = (value) => Boolean(Number(value));

const mapNotificationRow = (row) => ({
  notification_id: Number(row?.notification_id || 0),
  title: row?.title || '',
  message: row?.message || '',
  type_notification: row?.type_notification || 'system',
  is_read: toBoolean(row?.is_read),
  created_at: row?.created_at || null,
  user_id: Number(row?.user_id || 0) || null,
  booking_id: Number(row?.booking_id || 0) || null,
  booking: row?.booking_id
    ? {
        booking_id: Number(row.booking_id),
        booking_status: row?.booking_status || null
      }
    : null
});

class NotificationService {
  constructor() {
    this.channels = {
      user: 'user:',
      booking: 'booking:',
      admin: 'admin:'
    };
  }

  // Send real-time notification through Redis (to be picked by realtime server)
  async sendRealTimeNotification(userId, notification) {
    try {
      const channel = `${this.channels.user}${userId}`;
      const promiseDb = db.promise();
      const numericUserId = parsePositiveInt(userId);
      if (!numericUserId) {
        throw new Error('Invalid user id for notification');
      }
      
      // Store in database
      const createdAt = new Date();
      const [insertResult] = await promiseDb.query(
        `
          INSERT INTO notifications (title, message, type_notification, user_id, booking_id, is_read, created_at)
          VALUES (?, ?, ?, ?, ?, 0, ?)
        `,
        [
          notification.title,
          notification.message,
          notification.type || 'system',
          numericUserId,
          parsePositiveInt(notification.bookingId, null),
          createdAt
        ]
      );

      const savedNotification = {
        notification_id: Number(insertResult?.insertId || 0),
        title: notification.title,
        message: notification.message,
        type_notification: notification.type || 'system',
        user_id: numericUserId,
        booking_id: parsePositiveInt(notification.bookingId, null),
        is_read: false,
        created_at: createdAt
      };

      // Publish to Redis for real-time server
      await redis.publish(channel, JSON.stringify({
        type: 'notification',
        data: {
          ...savedNotification,
          timestamp: new Date().toISOString()
        }
      }));

      // Queue for push notification if user is offline
      await queueService.addJob('notification', {
        userId,
        notification: savedNotification,
        type: 'push'
      });

      return savedNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Broadcast to multiple users
  async broadcastToUsers(userIds, notification) {
    try {
      const promises = userIds.map(userId => 
        this.sendRealTimeNotification(userId, notification)
      );
      
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error broadcasting notifications:', error);
      throw error;
    }
  }

  // Send booking update
  async sendBookingUpdate(bookingId, update, userIds) {
    try {
      const channel = `${this.channels.booking}${bookingId}`;
      
      await redis.publish(channel, JSON.stringify({
        type: 'booking_update',
        data: {
          bookingId,
          update,
          timestamp: new Date().toISOString()
        }
      }));

      // Also notify relevant users
      if (userIds && userIds.length > 0) {
        await this.broadcastToUsers(userIds, {
          title: 'Booking Updated',
          message: `Booking #${bookingId} has been updated`,
          type: 'booking',
          bookingId
        });
      }
    } catch (error) {
      console.error('Error sending booking update:', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const promiseDb = db.promise();
    const numericNotificationId = parsePositiveInt(notificationId);
    const numericUserId = parsePositiveInt(userId);

    if (!numericNotificationId || !numericUserId) {
      throw new Error('Invalid notification or user id');
    }

    const [updateResult] = await promiseDb.query(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [numericNotificationId, numericUserId]
    );

    if (!updateResult?.affectedRows) {
      throw new Error('Notification not found');
    }

    const [rows] = await promiseDb.query(
      `
        SELECT notification_id, title, message, type_notification, is_read, created_at, user_id, booking_id
        FROM notifications
        WHERE notification_id = ? AND user_id = ?
        LIMIT 1
      `,
      [numericNotificationId, numericUserId]
    );

    return mapNotificationRow(rows?.[0] || {});
  }

  // Get user notifications
  async getUserNotifications(userId, page = 1, limit = 20) {
    const promiseDb = db.promise();
    const numericUserId = parsePositiveInt(userId);
    const numericPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const numericLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const offset = (numericPage - 1) * numericLimit;

    if (!numericUserId) {
      return {
        notifications: [],
        pagination: {
          page: numericPage,
          limit: numericLimit,
          total: 0,
          pages: 0
        }
      };
    }

    const [rows] = await promiseDb.query(
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
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [numericUserId, numericLimit, offset]
    );

    const [countRows] = await promiseDb.query(
      'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?',
      [numericUserId]
    );

    const total = Number(countRows?.[0]?.total || 0);
    const notifications = (rows || []).map(mapNotificationRow);

    return {
      notifications,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    };
  }
}

module.exports = new NotificationService();
