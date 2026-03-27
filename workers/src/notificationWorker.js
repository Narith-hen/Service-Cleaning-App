const db = require('./config/database');
const redis = require('./config/redis');

class NotificationWorker {
  constructor() {
    this.queueName = 'notification_queue';
    this.processing = false;
  }

  async start() {
    console.log('Notification worker started');
    this.processing = true;

    while (this.processing) {
      try {
        const jobString = await redis.rpop(this.queueName);

        if (jobString) {
          const job = JSON.parse(jobString);
          await this.processJob(job);
        } else {
          await this.sleep(1000);
        }
      } catch (error) {
        console.error('Notification worker error:', error);
        await this.sleep(5000);
      }
    }
  }

  async processJob(job) {
    console.log(`Processing notification job: ${job.id}`);

    switch (job.data.type) {
      case 'push':
        await this.sendPushNotification(job.data);
        break;
      case 'email':
        await this.sendEmail(job.data);
        break;
      case 'sms':
        await this.sendSMS(job.data);
        break;
      case 'review_request':
        await this.sendReviewRequest(job.data);
        break;
      default:
        console.log(`Unknown job type: ${job.data.type}`);
    }
  }

  async hasUserPushTokensColumn() {
    const [rows] = await db.promise().query("SHOW COLUMNS FROM users LIKE 'push_tokens'");
    return Boolean(rows?.length);
  }

  async sendPushNotification(data) {
    const { userId, notification } = data;
    const hasPushTokens = await this.hasUserPushTokensColumn();
    if (!hasPushTokens) return;

    const [rows] = await db.promise().query(
      'SELECT push_tokens FROM users WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const user = rows?.[0];
    if (user?.push_tokens) {
      console.log(`Sending push notification to user ${userId}:`, notification);
    }
  }

  async sendEmail(data) {
    const { to, subject } = data;

    try {
      console.log(`Sending email to ${to}: ${subject}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendSMS(data) {
    const { phoneNumber, message } = data;

    try {
      console.log(`Sending SMS to ${phoneNumber}: ${message}`);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  async sendReviewRequest(data) {
    const { bookingId, userId } = data;
    const [rows] = await db.promise().query(
      `
        SELECT
          b.booking_id,
          s.name AS service_name
        FROM bookings b
        LEFT JOIN services s ON s.service_id = b.service_id
        WHERE b.booking_id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    const booking = rows?.[0];
    if (!booking) return;

    const serviceName = booking.service_name || 'cleaning';
    await db.promise().query(
      `
        INSERT INTO notifications (title, message, type_notification, user_id, booking_id)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        'How was your service?',
        `Please rate your ${serviceName} experience`,
        'review',
        userId,
        bookingId
      ]
    );

    await redis.publish('notification:new', JSON.stringify({
      userId,
      title: 'How was your service?',
      message: `Please rate your ${serviceName} experience`,
      type: 'review',
      bookingId
    }));
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stop() {
    this.processing = false;
    console.log('Notification worker stopped');
  }
}

if (require.main === module) {
  const worker = new NotificationWorker();
  worker.start().catch(console.error);
}

module.exports = NotificationWorker;
