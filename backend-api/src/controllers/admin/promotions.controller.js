const prisma = require('../../config/database');
const AppError = require('../../utils/error.util');

// Re-export admin functions or create new ones
const getAllPromotions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    const now = new Date();

    if (status === 'active') {
      where.start_date = { lte: now };
      where.end_date = { gte: now };
    } else if (status === 'expired') {
      where.end_date = { lt: now };
    } else if (status === 'upcoming') {
      where.start_date = { gt: now };
    }

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        include: {
          _count: {
            select: { bookings: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      }),
      prisma.promotion.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: promotions,
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

// Alias for getAllPromotions (if getPromotions is the same)
const getPromotions = getAllPromotions;

const getActivePromotions = async (req, res, next) => {
  try {
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: {
        start_date: { lte: now },
        end_date: { gte: now }
      },
      orderBy: { end_date: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error) {
    next(error);
  }
};

const getPromotionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promotion = await prisma.promotion.findUnique({
      where: { promotion_id: parseInt(id) },
      include: {
        bookings: {
          include: {
            user: { select: { username: true } }
          },
          take: 10
        }
      }
    });

    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

const validatePromoCode = async (req, res, next) => {
  try {
    const { code, amount } = req.body;

    const promotion = await prisma.promotion.findFirst({
      where: {
        code,
        start_date: { lte: new Date() },
        end_date: { gte: new Date() }
      }
    });

    if (!promotion) {
      return next(new AppError('Invalid or expired promotion code', 400));
    }

    // Check minimum purchase if amount is provided
    if (amount && promotion.min_purchase && amount < promotion.min_purchase) {
      return next(new AppError(`Minimum purchase of $${promotion.min_purchase} required`, 400));
    }

    let discount = promotion.discount_price;
    if (promotion.discount_type === 'percentage' && amount) {
      discount = (amount * promotion.discount_price) / 100;
      if (promotion.max_discount && discount > promotion.max_discount) {
        discount = promotion.max_discount;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        promotion: {
          id: promotion.promotion_id,
          code: promotion.code,
          discount_type: promotion.discount_type,
          discount_value: promotion.discount_price,
          discount_amount: discount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const applyPromotion = async (req, res, next) => {
  try {
    const { code, booking_id } = req.body;

    // First validate the code
    const promotion = await prisma.promotion.findFirst({
      where: {
        code,
        start_date: { lte: new Date() },
        end_date: { gte: new Date() }
      }
    });

    if (!promotion) {
      return next(new AppError('Invalid or expired promotion code', 400));
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(booking_id) },
      include: { service: true }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check if promotion already applied
    if (booking.promotion_id) {
      return next(new AppError('Promotion already applied to this booking', 400));
    }

    // Check minimum purchase
    if (promotion.min_purchase && booking.total_price < promotion.min_purchase) {
      return next(new AppError(`Minimum purchase of $${promotion.min_purchase} required`, 400));
    }

    // Calculate discount
    let discount = promotion.discount_price;
    if (promotion.discount_type === 'percentage') {
      discount = (booking.total_price * promotion.discount_price) / 100;
      if (promotion.max_discount && discount > promotion.max_discount) {
        discount = promotion.max_discount;
      }
    }

    const newTotal = booking.total_price - discount;

    // Update booking with promotion
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: parseInt(booking_id) },
      data: {
        total_price: newTotal,
        promotion_id: promotion.promotion_id
      },
      include: {
        service: true,
        promotion: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Promotion applied successfully',
      data: {
        original_price: booking.total_price,
        discount,
        final_price: newTotal,
        booking: updatedBooking
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPromotionStats = async (req, res, next) => {
  try {
    const now = new Date();

    const [active, expired, upcoming, totalUsage] = await Promise.all([
      prisma.promotion.count({
        where: {
          start_date: { lte: now },
          end_date: { gte: now }
        }
      }),
      prisma.promotion.count({
        where: { end_date: { lt: now } }
      }),
      prisma.promotion.count({
        where: { start_date: { gt: now } }
      }),
      prisma.booking.count({
        where: {
          promotion_id: { not: null }
        }
      })
    ]);

    // Get most used promotions
    const popularPromotions = await prisma.promotion.findMany({
      take: 5,
      include: {
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: {
        bookings: {
          _count: 'desc'
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          active_promotions: active,
          expired_promotions: expired,
          upcoming_promotions: upcoming,
          total_usage: totalUsage
        },
        popular_promotions: popularPromotions
      }
    });
  } catch (error) {
    next(error);
  }
};

const createPromotion = async (req, res, next) => {
  try {
    const { code, discount_price, discount_type, start_date, end_date, min_purchase, max_discount, usage_limit } = req.body;

    // Check if code already exists
    const existing = await prisma.promotion.findUnique({
      where: { code }
    });

    if (existing) {
      return next(new AppError('Promotion code already exists', 400));
    }

    const promotion = await prisma.promotion.create({
      data: {
        code,
        discount_price: parseFloat(discount_price),
        discount_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        min_purchase: min_purchase ? parseFloat(min_purchase) : null,
        max_discount: max_discount ? parseFloat(max_discount) : null,
        usage_limit: usage_limit ? parseInt(usage_limit) : null
      }
    });

    res.status(201).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const promotion = await prisma.promotion.update({
      where: { promotion_id: parseInt(id) },
      data: {
        ...data,
        discount_price: data.discount_price ? parseFloat(data.discount_price) : undefined,
        min_purchase: data.min_purchase ? parseFloat(data.min_purchase) : null,
        max_discount: data.max_discount ? parseFloat(data.max_discount) : null,
        usage_limit: data.usage_limit ? parseInt(data.usage_limit) : null,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined
      }
    });

    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if promotion is used in any bookings
    const usageCount = await prisma.booking.count({
      where: { promotion_id: parseInt(id) }
    });

    if (usageCount > 0) {
      // Soft delete or just return warning
      return res.status(200).json({
        success: true,
        message: 'Promotion is in use and cannot be deleted',
        data: { used_in_bookings: usageCount }
      });
    }

    await prisma.promotion.delete({
      where: { promotion_id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Export all functions
  getAllPromotions,
  getPromotions, // Alias
  getActivePromotions,
  getPromotionById,
  validatePromoCode,
  applyPromotion,
  getPromotionStats,
  createPromotion,
  updatePromotion,
  deletePromotion
};