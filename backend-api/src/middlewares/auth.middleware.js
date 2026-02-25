const { verifyToken } = require('../utils/jwt.util');
const prisma = require('../config/database');
const AppError = require('../utils/error.util');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      include: { role: true }
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Authentication failed', 401));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role.role_name)) {
      return next(new AppError('Not authorized', 403));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};