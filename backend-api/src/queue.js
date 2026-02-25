const redis = require('./config/redis');
const prisma = require('./config/database');
const notificationService = require('./services/notification.service');

class QueueProcessor {
  constructor() {
    this.queues = ['email_queue', 'notification_queue', 'booking_queue', 'payment_queue'];
    this.isProcessing = false;
  }

  async start() {
    this.isProcessing = true;
    console.log('Queue processor started');
    
    while (this.isProcessing) {
      for (const queueName of this.queues) {
        await this.processQueue(queueName);
      }
      // Wait a bit before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async processQueue(queueName) {
    try {
      const jobString = await redis.rpop(queueName);
      if (!jobString) return;

      const job = JSON.parse(jobString);
      console.log(`Processing job ${job.id} from ${queueName}`);

      switch (queueName) {
        case 'email_queue':
          await this.processEmailJob(job);
          break;
        case 'notification_queue':
          await this.processNotificationJob(job);
          break;
        case 'booking_queue':
          await this.processBookingJob(job);
          break;
        case 'payment_queue':
          await this.processPaymentJob(job);
          break;
      }

      // Log success
      console.log(`Job ${job.id} completed successfully`);
      
      // Publish completion
      await redis.publish('job:completed', JSON.stringify({
        queue: queueName,
        jobId: job.id,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error(`Error processing job from ${queueName}:`, error);
      
      // Re-queue failed job with attempt count
      if (job && job.attempts < 3) {
        job.attempts++;
        await redis.lpush(queueName, JSON.stringify(job));
      }
    }
  }

  async processEmailJob(job) {
    // Email processing logic
    console.log('Processing email job:', job.data);
    // Implement email sending here
  }

  async processNotificationJob(job) {
    // Notification processing logic
    console.log('Processing notification job:', job.data);
    if (job.data.type === 'push') {
      // Implement push notification here
    }
  }

  async processBookingJob(job) {
    // Booking processing logic
    console.log('Processing booking job:', job.data);
    
    if (job.data.type === 'new_booking') {
      // Find available cleaner
      const availableCleaner = await this.findAvailableCleaner();
      if (availableCleaner) {
        await notificationService.sendRealTimeNotification(availableCleaner.user_id, {
          title: 'New Booking Assignment',
          message: `You have been assigned to booking #${job.data.bookingId}`,
          type: 'assignment',
          bookingId: job.data.bookingId
        });
      }
    }
  }

  async processPaymentJob(job) {
    // Payment processing logic
    console.log('Processing payment job:', job.data);
    // Implement payment processing here
  }

  async findAvailableCleaner() {
    return await prisma.user.findFirst({
      where: {
        role: {
          role_name: 'cleaner'
        }
      },
      include: {
        role: true
      }
    });
  }

  stop() {
    this.isProcessing = false;
    console.log('Queue processor stopped');
  }
}

// Start processor if run directly
if (require.main === module) {
  const processor = new QueueProcessor();
  processor.start().catch(console.error);
}

module.exports = QueueProcessor;