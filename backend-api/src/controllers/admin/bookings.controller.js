const prisma = require('../../config/database');
const AppError = require('../../utils/error.util');

const getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, from, to } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.booking_status = status;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to) where.created_at.lte = new Date(to);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { username: true, email: true } },
          cleaner: { select: { username: true } },
          service: true,
          payment: true
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
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

const assignCleaner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cleaner_id } = req.body;

    const booking = await prisma.booking.update({
      where: { booking_id: parseInt(id) },
      data: { cleaner_id: parseInt(cleaner_id) },
      include: {
        user: true,
        cleaner: true,
        service: true
      }
    });

    // Notify cleaner
    await prisma.notification.create({
      data: {
        title: 'New Assignment',
        message: `You have been assigned to booking #${id}`,
        type_notification: 'assignment',
        user_id: parseInt(cleaner_id),
        booking_id: parseInt(id)
      }
    });

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

const getBookingStats = async (req, res, next) => {
  try {
    const stats = await prisma.booking.groupBy({
      by: ['booking_status'],
      _count: true
    });

    const total = stats.reduce((acc, curr) => acc + curr._count, 0);

    res.status(200).json({
      success: true,
      data: {
        total,
        by_status: stats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBookings,
  assignCleaner,
  getBookingStats
};