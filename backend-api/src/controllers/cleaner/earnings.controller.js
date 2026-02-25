const prisma = require('../../config/database');

const getEarnings = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const cleanerId = req.user.user_id;

    const where = {
      booking: { cleaner_id: cleanerId },
      payment_status: 'completed'
    };

    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to) where.created_at.lte = new Date(to);
    }

    const [totalEarnings, recentPayments] = await Promise.all([
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: true
      }),
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              service: true,
              user: { select: { username: true } }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 20
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_earnings: totalEarnings._sum.amount || 0,
        total_jobs: totalEarnings._count,
        recent_payments: recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

const getEarningsSummary = async (req, res, next) => {
  try {
    const cleanerId = req.user.user_id;

    // Get earnings by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const earnings = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(amount) as total
      FROM Payment
      WHERE 
        booking_id IN (SELECT booking_id FROM Booking WHERE cleaner_id = ${cleanerId})
        AND payment_status = 'completed'
        AND created_at >= ${sixMonthsAgo}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;

    res.status(200).json({
      success: true,
      data: earnings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEarnings,
  getEarningsSummary
};