const prisma = require('../../config/database');

const getCleanerDashboard = async (req, res, next) => {
  try {
    const cleanerId = req.user.user_id;

    const [todayJobs, pendingJobs, completedJobs, totalEarnings, averageRating] = await Promise.all([
      prisma.booking.count({
        where: {
          cleaner_id: cleanerId,
          booking_date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      prisma.booking.count({
        where: {
          cleaner_id: cleanerId,
          booking_status: 'pending'
        }
      }),
      prisma.booking.count({
        where: {
          cleaner_id: cleanerId,
          booking_status: 'completed'
        }
      }),
      prisma.payment.aggregate({
        where: {
          booking: { cleaner_id: cleanerId },
          payment_status: 'completed'
        },
        _sum: { amount: true }
      }),
      prisma.review.aggregate({
        where: { cleaner_id: cleanerId },
        _avg: { rating: true }
      })
    ]);

    const upcomingJobs = await prisma.booking.findMany({
      where: {
        cleaner_id: cleanerId,
        booking_status: { in: ['confirmed', 'pending'] },
        booking_date: { gte: new Date() }
      },
      include: {
        user: { select: { username: true, phone_number: true } },
        service: true
      },
      orderBy: { booking_date: 'asc' },
      take: 5
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          today_jobs: todayJobs,
          pending_jobs: pendingJobs,
          completed_jobs: completedJobs,
          total_earnings: totalEarnings._sum.amount || 0,
          average_rating: averageRating._avg.rating || 0
        },
        upcoming_jobs: upcomingJobs
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCleanerJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = { cleaner_id: req.user.user_id };
    if (status) where.booking_status = status;

    const [jobs, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { username: true, phone_number: true, address: true } },
          service: true
        },
        orderBy: { booking_date: 'asc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.booking.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await prisma.booking.update({
      where: {
        booking_id: parseInt(id),
        cleaner_id: req.user.user_id
      },
      data: { booking_status: status }
    });

    res.status(200).json({
      success: true,
      message: 'Job status updated',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCleanerDashboard,
  getCleanerJobs,
  updateJobStatus
};