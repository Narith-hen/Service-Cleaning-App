const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');
const AppError = require('../../utils/error.util');

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) {
      where.role = { role_name: role };
    }
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
          _count: {
            select: {
              bookings: true,
              reviews: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.status(200).json({
      success: true,
      data: usersWithoutPassword,
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

const createUser = async (req, res, next) => {
  try {
    const { username, email, password, phone_number, role_id } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return next(new AppError('User already exists', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        phone_number,
        role_id: parseInt(role_id)
      },
      include: { role: true }
    });

    delete user.password;

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, phone_number, role_id, is_active } = req.body;

    const user = await prisma.user.update({
      where: { user_id: parseInt(id) },
      data: {
        username,
        email,
        phone_number,
        role_id: role_id ? parseInt(role_id) : undefined,
        is_active
      },
      include: { role: true }
    });

    delete user.password;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { user_id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};