const db = require('./config/database');
const redis = require('./config/redis');

class AnalyticsWorker {
  constructor() {
    this.processing = false;
  }

  async start() {
    console.log('Analytics worker started');
    this.processing = true;
    this.scheduleJobs();
  }

  scheduleJobs() {
    setInterval(() => this.updateStats(), 60 * 60 * 1000);
    setInterval(() => this.generateDailyReport(), 24 * 60 * 60 * 1000);
    setInterval(() => this.cleanupOldData(), 7 * 24 * 60 * 60 * 1000);
  }

  async updateStats() {
    console.log('Updating analytics stats...');

    try {
      const [
        [userRows],
        [bookingRows],
        [completedRows],
        [revenueRows],
        [ratingRows]
      ] = await Promise.all([
        db.promise().query('SELECT COUNT(*) AS total_users FROM users'),
        db.promise().query('SELECT COUNT(*) AS total_bookings FROM bookings'),
        db.promise().query(
          `
            SELECT COUNT(*) AS completed_bookings
            FROM bookings
            WHERE LOWER(COALESCE(booking_status, '')) = 'completed'
          `
        ),
        db.promise().query(
          `
            SELECT COALESCE(SUM(amount), 0) AS total_revenue
            FROM payments
            WHERE LOWER(COALESCE(payment_status, '')) = 'completed'
          `
        ),
        db.promise().query(
          'SELECT COALESCE(AVG(rating), 0) AS average_rating FROM reviews'
        )
      ]);

      const totalUsers = Number(userRows?.[0]?.total_users || 0);
      const totalBookings = Number(bookingRows?.[0]?.total_bookings || 0);
      const completedBookings = Number(completedRows?.[0]?.completed_bookings || 0);
      const revenue = Number(revenueRows?.[0]?.total_revenue || 0);
      const averageRating = Number(ratingRows?.[0]?.average_rating || 0);

      const stats = {
        totalUsers,
        totalBookings,
        completedBookings,
        revenue,
        averageRating,
        conversionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        timestamp: new Date().toISOString()
      };

      await redis.setex('analytics:dashboard', 3600, JSON.stringify(stats));
      console.log('Analytics stats updated:', stats);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  async generateDailyReport() {
    console.log('Generating daily report...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const [
        [bookingRows],
        [userRows],
        [paymentRows],
        [adminRows]
      ] = await Promise.all([
        db.promise().query(
          `
            SELECT COUNT(*) AS new_bookings
            FROM bookings
            WHERE created_at >= ? AND created_at < ?
          `,
          [yesterday, today]
        ),
        db.promise().query(
          `
            SELECT COUNT(*) AS new_users
            FROM users
            WHERE created_at >= ? AND created_at < ?
          `,
          [yesterday, today]
        ),
        db.promise().query(
          `
            SELECT COALESCE(SUM(amount), 0) AS total_revenue
            FROM payments
            WHERE created_at >= ?
              AND created_at < ?
              AND LOWER(COALESCE(payment_status, '')) = 'completed'
          `,
          [yesterday, today]
        ),
        db.promise().query(
          `
            SELECT u.user_id
            FROM users u
            LEFT JOIN roles r ON r.role_id = u.role_id
            WHERE LOWER(COALESCE(r.role_name, '')) = 'admin'
          `
        )
      ]);

      const dailyReport = {
        date: yesterday.toISOString().split('T')[0],
        newBookings: Number(bookingRows?.[0]?.new_bookings || 0),
        newUsers: Number(userRows?.[0]?.new_users || 0),
        revenue: Number(paymentRows?.[0]?.total_revenue || 0),
        generatedAt: new Date().toISOString()
      };

      await redis.setex(
        `analytics:daily:${dailyReport.date}`,
        30 * 24 * 60 * 60,
        JSON.stringify(dailyReport)
      );

      for (const admin of adminRows || []) {
        await redis.publish('notification:new', JSON.stringify({
          userId: admin.user_id,
          title: 'Daily Report Ready',
          message: `Daily report for ${dailyReport.date} is ready`,
          type: 'report'
        }));
      }

      console.log('Daily report generated:', dailyReport);
    } catch (error) {
      console.error('Failed to generate daily report:', error);
    }
  }

  async cleanupOldData() {
    console.log('Cleaning up old data...');

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    try {
      const [result] = await db.promise().query(
        `
          DELETE FROM notifications
          WHERE created_at < ?
            AND is_read = 1
        `,
        [oneMonthAgo]
      );

      console.log(`Cleaned up ${Number(result?.affectedRows || 0)} old notifications`);
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }
}

if (require.main === module) {
  const worker = new AnalyticsWorker();
  worker.start().catch(console.error);
}

module.exports = AnalyticsWorker;
