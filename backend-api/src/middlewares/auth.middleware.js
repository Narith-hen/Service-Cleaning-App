const { verifyToken } = require('../utils/jwt.util');
const db = require('../config/db');
const AppError = require('../utils/error.util');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const [rows] = await db.promise().query(
      `
        SELECT
          u.user_id,
          u.email,
          u.role_id,
          r.role_name
        FROM users u
        LEFT JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = ?
        LIMIT 1
      `,
      [decoded.user_id]
    );

    const row = rows?.[0];
    const user = row
      ? {
          user_id: row.user_id,
          email: row.email,
          role_id: row.role_id,
          role: {
            role_id: row.role_id,
            role_name: row.role_name,
          },
        }
      : null;

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
