const db = require('./config/database');
const redis = require('./config/redis');

class BookingWorker {
  constructor() {
    this.queueName = 'booking_queue';
    this.processing = false;
  }

  async start() {
    console.log('Booking worker started');
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
        console.error('Booking worker error:', error);
        await this.sleep(5000);
      }
    }
  }

  async processJob(job) {
    console.log(`Processing booking job: ${job.id}`, job.data);

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

    await redis.publish('worker:completed', JSON.stringify({
      worker: 'booking',
      jobId: job.id,
      timestamp: new Date().toISOString()
    }));
  }

  async handleNewBooking(data) {
    const { bookingId } = data;
    const availableCleaner = await this.findAvailableCleaner();

    if (availableCleaner) {
      await db.promise().query(
        'UPDATE bookings SET cleaner_id = ? WHERE booking_id = ?',
        [availableCleaner.user_id, bookingId]
      );

      await redis.publish('notification:new', JSON.stringify({
        userId: availableCleaner.user_id,
        title: 'New Booking Assignment',
        message: `You have been assigned to booking #${bookingId}`,
        type: 'assignment',
        bookingId
      }));
    }

    await this.calculateETA(bookingId);
  }

  async handleStatusUpdate(data) {
    const { bookingId, newStatus } = data;

    if (newStatus === 'completed') {
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

    await db.promise().query(
      'UPDATE bookings SET cleaner_id = ? WHERE booking_id = ?',
      [cleanerId, bookingId]
    );

    const [rows] = await db.promise().query(
      `
        SELECT COUNT(*) AS total
        FROM bookings
        WHERE cleaner_id = ?
          AND booking_date >= NOW()
          AND booking_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
          AND LOWER(COALESCE(booking_status, '')) IN ('confirmed', 'pending')
      `,
      [cleanerId]
    );

    const existingBookings = Number(rows?.[0]?.total || 0);
    if (existingBookings > 5) {
      await redis.publish('notification:new', JSON.stringify({
        userId: 1,
        title: 'Cleaner Overbooked',
        message: `Cleaner #${cleanerId} has ${existingBookings} bookings next week`,
        type: 'alert'
      }));
    }
  }

  async handleBookingReminder(data) {
    const { bookingId } = data;
    const [rows] = await db.promise().query(
      `
        SELECT
          b.booking_id,
          b.booking_date,
          b.booking_status,
          b.user_id,
          s.name AS service_name
        FROM bookings b
        LEFT JOIN services s ON s.service_id = b.service_id
        WHERE b.booking_id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    const booking = rows?.[0];
    if (booking && String(booking.booking_status || '').toLowerCase() === 'confirmed') {
      await redis.publish('notification:new', JSON.stringify({
        userId: booking.user_id,
        title: 'Booking Reminder',
        message: `Your ${booking.service_name || 'cleaning'} service is tomorrow at ${new Date(booking.booking_date).toLocaleTimeString()}`,
        type: 'reminder',
        bookingId
      }));
    }
  }

  async findAvailableCleaner() {
    const [rows] = await db.promise().query(
      `
        SELECT
          u.user_id,
          u.email,
          u.role_id,
          COUNT(b.booking_id) AS active_bookings
        FROM users u
        LEFT JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN bookings b
          ON b.cleaner_id = u.user_id
          AND b.booking_date >= NOW()
          AND b.booking_date <= DATE_ADD(NOW(), INTERVAL 2 HOUR)
          AND LOWER(COALESCE(b.booking_status, '')) IN ('confirmed', 'pending')
        WHERE LOWER(COALESCE(r.role_name, '')) = 'cleaner'
        GROUP BY u.user_id, u.email, u.role_id
        HAVING active_bookings = 0
        ORDER BY active_bookings ASC, u.user_id ASC
        LIMIT 1
      `
    );

    return rows?.[0] || null;
  }

  async calculateETA(bookingId) {
    const [rows] = await db.promise().query(
      `
        SELECT
          b.booking_id,
          s.price AS service_price
        FROM bookings b
        LEFT JOIN services s ON s.service_id = b.service_id
        WHERE b.booking_id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    const booking = rows?.[0];
    if (!booking) return null;

    const baseTime = 60;
    const serviceTime = Number(booking.service_price || 0) / 10;
    const eta = baseTime + serviceTime;

    await redis.setex(`booking:eta:${bookingId}`, 3600, eta.toString());
    return eta;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stop() {
    this.processing = false;
    console.log('Booking worker stopped');
  }
}

if (require.main === module) {
  const worker = new BookingWorker();
  worker.start().catch(console.error);
}

module.exports = BookingWorker;
