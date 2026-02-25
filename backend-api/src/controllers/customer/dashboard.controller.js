const prisma = require('../../config/database');

const getCustomerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const [upcomingBookings, pastBookings, totalSpent, recentBookings] = await Promise.all([
      prisma.booking.count({
        where: {
          user_id: userId,
          booking_status: { in: ['pending', 'confirmed'] },
          booking_date: { gte: new Date() }
        }
      }),
      prisma.booking.count({
        where: {
          user_id: userId,
          booking_status: 'completed'
        }
      }),
      prisma.payment.aggregate({
        where: {
          booking: { user_id: userId },
          payment_status: 'completed'
        },
        _sum: { amount: true }
      }),
      prisma.booking.findMany({
        where: { user_id: userId },
        include: { service: true },
        orderBy: { created_at: 'desc' },
        take: 5
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          upcoming_bookings: upcomingBookings,
          past_bookings: pastBookings,
          total_spent: totalSpent._sum.amount || 0
        },
        recent_bookings: recentBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = { user_id: req.user.user_id };
    if (status) where.booking_status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: true,
          payment: true,
          review: true
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.booking.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
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

const updateCustomerProfile = async (req, res, next) => {
  try {
    const { username, phone_number } = req.body;

    const user = await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: { username, phone_number },
      include: { role: true }
    });

    delete user.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerDashboard,
  getCustomerBookings,
  updateCustomerProfile
};