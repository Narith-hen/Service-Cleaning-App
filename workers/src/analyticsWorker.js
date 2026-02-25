const prisma = require('./config/database');
const redis = require('./config/redis');

class AnalyticsWorker {
  constructor() {
    this.processing = false;
  }

  async start() {
    console.log('🚀 Analytics worker started');
    this.processing = true;
    
    // Run analytics jobs on schedule
    this.scheduleJobs();
  }

  scheduleJobs() {
    // Update stats every hour
    setInterval(() => this.updateStats(), 60 * 60 * 1000);
    
    // Generate reports daily at 2 AM
    setInterval(() => this.generateDailyReport(), 24 * 60 * 60 * 1000);
    
    // Clean up old data weekly
    setInterval(() => this.cleanupOldData(), 7 * 24 * 60 * 60 * 1000);
  }

  async updateStats() {
    console.log('📊 Updating analytics stats...');
    
    try {
      const [
        totalUsers,
        totalBookings,
        completedBookings,
        revenue,
        averageRating
      ] = await Promise.all([
        prisma.user.count(),
        prisma.booking.count(),
        prisma.booking.count({ where: { booking_status: 'completed' } }),
        prisma.payment.aggregate({
          where: { payment_status: 'completed' },
          _sum: { amount: true }
        }),
        prisma.review.aggregate({
          _avg: { rating: true }
        })
      ]);

      const stats = {
        totalUsers,
        totalBookings,
        completedBookings,
        revenue: revenue._sum.amount || 0,
        averageRating: averageRating._avg.rating || 0,
        conversionRate: (completedBookings / totalBookings) * 100 || 0,
        timestamp: new Date().toISOString()
      };

      // Store in Redis for quick access
      await redis.setex('analytics:dashboard', 3600, JSON.stringify(stats));
      
      console.log('✅ Analytics stats updated:', stats);
    } catch (error) {
      console.error('❌ Failed to update stats:', error);
    }
  }

  async generateDailyReport() {
    console.log('📈 Generating daily report...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const report = await prisma.$transaction([
        prisma.booking.count({
          where: {
            created_at: {
              gte: yesterday,
              lt: today
            }
          }
        }),
        prisma.user.count({
          where: {
            created_at: {
              gte: yesterday,
              lt: today
            }
          }
        }),
        prisma.payment.aggregate({
          where: {
            created_at: {
              gte: yesterday,
              lt: today
            },
            payment_status: 'completed'
          },
          _sum: { amount: true }
        })
      ]);

      const dailyReport = {
        date: yesterday.toISOString().split('T')[0],
        newBookings: report[0],
        newUsers: report[1],
        revenue: report[2]._sum.amount || 0,
        generatedAt: new Date().toISOString()
      };

      // Store report
      await redis.setex(
        `analytics:daily:${yesterday.toISOString().split('T')[0]}`,
        30 * 24 * 60 * 60, // 30 days
        JSON.stringify(dailyReport)
      );

      // Notify admins
      const admins = await prisma.user.findMany({
        where: { role: { role_name: 'admin' } },
        select: { user_id: true }
      });

      for (const admin of admins) {
        await redis.publish('notification:new', JSON.stringify({
          userId: admin.user_id,
          title: 'Daily Report Ready',
          message: `Daily report for ${dailyReport.date} is ready`,
          type: 'report'
        }));
      }

      console.log('✅ Daily report generated:', dailyReport);
    } catch (error) {
      console.error('❌ Failed to generate daily report:', error);
    }
  }

  async cleanupOldData() {
    console.log('🧹 Cleaning up old data...');
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    try {
      // Archive old notifications
      const oldNotifications = await prisma.notification.updateMany({
        where: {
          created_at: { lt: oneMonthAgo },
          is_read: true
        },
        data: {
          // Move to archive or delete
        }
      });

      console.log(`✅ Cleaned up ${oldNotifications.count} old notifications`);
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
    }
  }
}

// Start worker if run directly
if (require.main === module) {
  const worker = new AnalyticsWorker();
  worker.start().catch(console.error);
}

module.exports = AnalyticsWorker;