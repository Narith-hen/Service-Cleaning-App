const prisma = require('../../config/database');
const AppError = require('../../utils/error.util');

// Create booking
const createBooking = async (req, res, next) => {
  try {
    const { booking_date, service_id, promotion_id, address, notes, contact_phone } = req.body;
    const user_id = req.user.user_id;

    const service = await prisma.service.findUnique({
      where: { service_id: parseInt(service_id) }
    });

    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    let total_price = service.price;

    if (promotion_id) {
      const promotion = await prisma.promotion.findUnique({
        where: { promotion_id: parseInt(promotion_id) }
      });

      if (promotion && promotion.end_date > new Date()) {
        total_price -= promotion.discount_price;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        booking_date: new Date(booking_date),
        booking_status: 'pending',
        total_price,
        payment_status: 'pending',
        user_id,
        service_id: parseInt(service_id),
        promotion_id: promotion_id ? parseInt(promotion_id) : null
      },
      include: {
        service: true,
        user: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// Get all bookings
const getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.booking_status = status;
    
    // If not admin, show only user's bookings
    if (req.user.role.role_name !== 'admin') {
      where.user_id = req.user.user_id;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: true,
          user: {
            select: {
              user_id: true,
              username: true,
              email: true
            }
          }
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

// Get booking by ID
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) },
      include: {
        service: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone_number: true
          }
        },
        cleaner: {
          select: {
            user_id: true,
            username: true,
            phone_number: true
          }
        },
        payment: true,
        review: true,
        promotion: true
      }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// Update booking
const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { booking_date, service_id, promotion_id } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: parseInt(id) },
      data: {
        booking_date: booking_date ? new Date(booking_date) : undefined,
        service_id: service_id ? parseInt(service_id) : undefined,
        promotion_id: promotion_id ? parseInt(promotion_id) : null
      },
      include: {
        service: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// Delete booking
const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    await prisma.booking.delete({
      where: { booking_id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update booking status
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { booking_status } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: parseInt(id) },
      data: { booking_status },
      include: {
        service: true,
        user: true
      }
    });

    await prisma.notification.create({
      data: {
        title: 'Booking Status Updated',
        message: `Your booking #${id} status is now ${booking_status}`,
        type_notification: 'booking',
        user_id: booking.user_id,
        booking_id: parseInt(id)
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking status updated',
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// Assign cleaner
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

// Cancel booking
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: parseInt(id) },
      data: { 
        booking_status: 'cancelled'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// Get bookings by user
const getBookingsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { user_id: parseInt(userId) },
        include: {
          service: true,
          payment: true,
          review: true
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.booking.count({
        where: { user_id: parseInt(userId) }
      })
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

// Get bookings by cleaner
const getBookingsByCleaner = async (req, res, next) => {
  try {
    const { cleanerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { cleaner_id: parseInt(cleanerId) },
        include: {
          service: true,
          user: {
            select: {
              username: true,
              phone_number: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.booking.count({
        where: { cleaner_id: parseInt(cleanerId) }
      })
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

// Get booking history
const getBookingHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) },
      include: {
        service: true,
        user: true,
        cleaner: true,
        payment: true,
        review: true
      }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// Track booking
const trackBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) },
      select: {
        booking_id: true,
        booking_status: true,
        booking_date: true,
        cleaner: {
          select: {
            user_id: true,
            username: true,
            phone_number: true
          }
        }
      }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
  assignCleaner,
  cancelBooking,
  getBookingsByUser,
  getBookingsByCleaner,
  getBookingHistory,
  trackBooking
};