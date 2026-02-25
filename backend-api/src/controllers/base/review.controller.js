const prisma = require('../../config/database');
const AppError = require('../../utils/error.util');

const createReview = async (req, res, next) => {
  try {
    const { booking_id, rating, comment, cleaner_id } = req.body;
    const user_id = req.user.user_id;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(booking_id) },
      include: { review: true }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.user_id !== user_id) {
      return next(new AppError('Not authorized to review this booking', 403));
    }

    if (booking.review) {
      return next(new AppError('Review already exists for this booking', 400));
    }

    if (booking.booking_status !== 'completed') {
      return next(new AppError('Can only review completed bookings', 400));
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        command: comment,
        booking_id: parseInt(booking_id),
        user_id,
        cleaner_id: cleaner_id ? parseInt(cleaner_id) : booking.cleaner_id
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const { serviceId, cleanerId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (serviceId) {
      where.booking = { service_id: parseInt(serviceId) };
    }
    if (cleanerId) {
      where.cleaner_id = parseInt(cleanerId);
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              avatar: true
            }
          },
          booking: {
            include: {
              service: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.review.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
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

module.exports = {
  createReview,
  getReviews
};