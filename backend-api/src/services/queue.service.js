const redis = require('../config/redis');

class QueueService {
  constructor() {
    this.queues = {
      email: 'email_queue',
      notification: 'notification_queue',
      booking: 'booking_queue',
      payment: 'payment_queue'
    };
  }

  // Add job to queue
  async addJob(queueName, jobData) {
    try {
      const job = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        data: jobData,
        timestamp: new Date().toISOString(),
        attempts: 0
      };

      await redis.lpush(queueName, JSON.stringify(job));
      console.log(`Job added to ${queueName} queue:`, job.id);
      
      // Publish to real-time server for live updates
      await redis.publish('job:created', JSON.stringify({
        queue: queueName,
        jobId: job.id,
        data: jobData
      }));

      return job;
    } catch (error) {
      console.error('Error adding job to queue:', error);
      throw error;
    }
  }

  // Get job from queue
  async getJob(queueName) {
    try {
      const jobString = await redis.rpop(queueName);
      if (jobString) {
        return JSON.parse(jobString);
      }
      return null;
    } catch (error) {
      console.error('Error getting job from queue:', error);
      return null;
    }
  }

  // Get queue length
  async getQueueLength(queueName) {
    try {
      return await redis.llen(queueName);
    } catch (error) {
      console.error('Error getting queue length:', error);
      return 0;
    }
  }

  // Clear queue
  async clearQueue(queueName) {
    try {
      await redis.del(queueName);
      console.log(`Queue ${queueName} cleared`);
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }
}

module.exports = new QueueService();