const prisma = require('../../config/database');

const getAdminDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalBookings, totalRevenue, totalServices, recentBookings, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({
        where: { payment_status: 'completed' },
        _sum: { amount: true }
      }),
      prisma.service.count(),
      prisma.booking.findMany({
        include: {
          user: { select: { username: true } },
          service: true
        },
        orderBy: { created_at: 'desc' },
        take: 10
      }),
      prisma.user.findMany({
        include: { role: true },
        orderBy: { created_at: 'desc' },
        take: 10
      })
    ]);

    const usersWithoutPassword = recentUsers.map(({ password, ...user }) => user);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total_users: totalUsers,
          total_bookings: totalBookings,
          total_revenue: totalRevenue._sum.amount || 0,
          total_services: totalServices
        },
        recent_bookings: recentBookings,
        recent_users: usersWithoutPassword
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSystemHealth = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  getAdminDashboard,
  getSystemHealth
};