const prisma = require('./config/database');
const redis = require('./config/redis');

class BookingWorker {
  constructor() {
    this.queueName = 'booking_queue';
    this.processing = false;
  }

  async start() {
    console.log('🚀 Booking worker started');
    this.processing = true;
    
    while (this.processing) {
      try {
        // Get job from queue
        const jobString = await redis.rpop(this.queueName);
        
        if (jobString) {
          const job = JSON.parse(jobString);
          await this.processJob(job);
        } else {
          // No jobs, wait a bit
          await this.sleep(1000);
        }
      } catch (error) {
        console.error('❌ Booking worker error:', error);
        await this.sleep(5000);
      }
    }
  }

  async processJob(job) {
    console.log(`📦 Processing booking job: ${job.id}`, job.data);

    switch (job.data.type) {
      case 'new_booking':
        await this.handleNewBooking(job.data);
        break;
      case 'status_update':
        await this.handleStatusUpdate(job.data);
        break;
      case 'assign_cleaner':
        await this.handleAssignCleaner(job.data);
        break;
      case 'reminder':
        await this.handleBookingReminder(job.data);
        break;
      default:
        console.log(`Unknown job type: ${job.data.type}`);
    }

    // Notify completion
    await redis.publish('worker:completed', JSON.stringify({
      worker: 'booking',
      jobId: job.id,
      timestamp: new Date().toISOString()
    }));
  }

  async handleNewBooking(data) {
    const { bookingId } = data;
    
    // Find available cleaner
    const availableCleaner = await this.findAvailableCleaner();
    
    if (availableCleaner) {
      // Auto-assign cleaner
      await prisma.booking.update({
        where: { booking_id: bookingId },
        data: { cleaner_id: availableCleaner.user_id }
      });

      // Notify via Redis for real-time server
      await redis.publish('notification:new', JSON.stringify({
        userId: availableCleaner.user_id,
        title: 'New Booking Assignment',
        message: `You have been assigned to booking #${bookingId}`,
        type: 'assignment',
        bookingId
      }));
    }

    // Calculate estimated time
    await this.calculateETA(bookingId);
  }

  async handleStatusUpdate(data) {
    const { bookingId, newStatus, oldStatus } = data;
    
    // Perform actions based on status change
    if (newStatus === 'completed') {
      // Send review request after 24 hours
      setTimeout(async () => {
        await redis.lpush('notification_queue', JSON.stringify({
          id: `review-${Date.now()}`,
          data: {
            type: 'review_request',
            bookingId,
            userId: data.userId
          }
        }));
      }, 24 * 60 * 60 * 1000);
    }

    if (newStatus === 'cancelled') {
      // Refund logic
      await redis.lpush('payment_queue', JSON.stringify({
        id: `refund-${Date.now()}`,
        data: {
          type: 'process_refund',
          bookingId
        }
      }));
    }
  }

  async handleAssignCleaner(data) {
    const { bookingId, cleanerId } = data;
    
    // Update booking
    await prisma.booking.update({
      where: { booking_id: bookingId },
      data: { cleaner_id: cleanerId }
    });

    // Check cleaner schedule
    const existingBookings = await prisma.booking.count({
      where: {
        cleaner_id: cleanerId,
        booking_date: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        booking_status: { in: ['confirmed', 'pending'] }
      }
    });

    if (existingBookings > 5) {
      // Cleaner is busy, notify admin
      await redis.publish('notification:new', JSON.stringify({
        userId: 1, // Admin ID
        title: 'Cleaner Overbooked',
        message: `Cleaner #${cleanerId} has ${existingBookings} bookings next week`,
        type: 'alert'
      }));
    }
  }

  async handleBookingReminder(data) {
    const { bookingId } = data;
    
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { user: true, service: true }
    });

    if (booking && booking.booking_status === 'confirmed') {
      // Send reminder notification
      await redis.publish('notification:new', JSON.stringify({
        userId: booking.user_id,
        title: 'Booking Reminder',
        message: `Your ${booking.service.name} service is tomorrow at ${new Date(booking.booking_date).toLocaleTimeString()}`,
        type: 'reminder',
        bookingId
      }));
    }
  }

  async findAvailableCleaner() {
    // Complex logic to find best available cleaner
    return await prisma.user.findFirst({
      where: {
        role: { role_name: 'cleaner' },
        bookings: {
          none: {
            booking_date: {
              gte: new Date(),
              lte: new Date(Date.now() + 2 * 60 * 60 * 1000) // Next 2 hours
            },
            booking_status: { in: ['confirmed', 'pending'] }
          }
        }
      },
      orderBy: {
        bookings: {
          _count: 'asc'
        }
      }
    });
  }

  async calculateETA(bookingId) {
    // Calculate estimated time of arrival/ completion
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { service: true }
    });

    // Simple ETA calculation
    const baseTime = 60; // minutes
    const serviceTime = booking.service.price / 10; // Rough estimate
    
    const eta = baseTime + serviceTime;
    
    // Store ETA in Redis for real-time tracking
    await redis.setex(`booking:eta:${bookingId}`, 3600, eta.toString());
    
    return eta;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.processing = false;
    console.log('🛑 Booking worker stopped');
  }
}

// Start worker if run directly
if (require.main === module) {
  const worker = new BookingWorker();
  worker.start().catch(console.error);
}

module.exports = BookingWorker;