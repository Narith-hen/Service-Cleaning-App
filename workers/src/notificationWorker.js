const prisma = require('./config/database');
const redis = require('./config/redis');
const axios = require('axios');

class NotificationWorker {
  constructor() {
    this.queueName = 'notification_queue';
    this.processing = false;
  }

  async start() {
    console.log('🚀 Notification worker started');
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
        console.error('❌ Notification worker error:', error);
        await this.sleep(5000);
      }
    }
  }

  async processJob(job) {
    console.log(`📦 Processing notification job: ${job.id}`);

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

  async sendPushNotification(data) {
    const { userId, notification } = data;
    
    // Get user's push tokens
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { push_tokens: true }
    });

    if (user?.push_tokens) {
      // Send to push notification service (Firebase, OneSignal, etc.)
      console.log(`Sending push notification to user ${userId}:`, notification);
      
      // Here you would integrate with your push notification service
    }
  }

  async sendEmail(data) {
    const { to, subject, html } = data;
    
    try {
      // Use your email service (SendGrid, AWS SES, etc.)
      console.log(`Sending email to ${to}: ${subject}`);
      
      // Example using a mock email service
      // await emailService.send(to, subject, html);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendSMS(data) {
    const { phoneNumber, message } = data;
    
    try {
      // Use SMS service (Twilio, etc.)
      console.log(`Sending SMS to ${phoneNumber}: ${message}`);
      
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  async sendReviewRequest(data) {
    const { bookingId, userId } = data;
    
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { service: true }
    });

    if (booking) {
      // Create notification in database
      await prisma.notification.create({
        data: {
          title: 'How was your service?',
          message: `Please rate your ${booking.service.name} experience`,
          type_notification: 'review',
          user_id: userId,
          booking_id: bookingId
        }
      });

      // Send real-time notification
      await redis.publish('notification:new', JSON.stringify({
        userId,
        title: 'How was your service?',
        message: `Please rate your ${booking.service.name} experience`,
        type: 'review',
        bookingId
      }));
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.processing = false;
    console.log('🛑 Notification worker stopped');
  }
}

// Start worker if run directly
if (require.main === module) {
  const worker = new NotificationWorker();
  worker.start().catch(console.error);
}

module.exports = NotificationWorker;