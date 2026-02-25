const redis = require('../config/redis');
const prisma = require('../config/database');
const queueService = require('./queue.service');

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
      
      // Store in database
      const savedNotification = await prisma.notification.create({
        data: {
          title: notification.title,
          message: notification.message,
          type_notification: notification.type,
          user_id: userId,
          booking_id: notification.bookingId
        }
      });

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
    return await prisma.notification.update({
      where: {
        notification_id: notificationId,
        user_id: userId
      },
      data: {
        is_read: true
      }
    });
  }

  // Get user notifications
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          booking: {
            select: {
              booking_id: true,
              booking_status: true
            }
          }
        }
      }),
      prisma.notification.count({
        where: { user_id: userId }
      })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new NotificationService();