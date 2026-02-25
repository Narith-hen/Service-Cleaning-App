const prisma = require('../../config/database');
const AppError = require('../../utils/error.util');

const getAllServices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        include: {
          images: true,
          _count: {
            select: { bookings: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      }),
      prisma.service.count()
    ]);

    res.status(200).json({
      success: true,
      data: services,
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

const createService = async (req, res, next) => {
  try {
    const { name, price, description, category, duration } = req.body;

    const service = await prisma.service.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        category,
        duration: duration ? parseInt(duration) : null
      }
    });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, duration, is_available } = req.body;

    const service = await prisma.service.update({
      where: { service_id: parseInt(id) },
      data: {
        name,
        price: price ? parseFloat(price) : undefined,
        description,
        category,
        duration: duration ? parseInt(duration) : undefined,
        is_available
      }
    });

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.service.delete({
      where: { service_id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServices,
  createService,
  updateService,
  deleteService
};