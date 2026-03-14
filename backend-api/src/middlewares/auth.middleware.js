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
    const accountSource = String(decoded?.account_source || '').toLowerCase();

    const promiseDb = db.promise();
    let row = null;

    if (accountSource === 'cleaner_profile') {
      const [cleanerRows] = await promiseDb.query(
        `
          SELECT
            cp.cleaner_id AS user_id,
            cp.company_email AS email,
            cp.role_id,
            r.role_name
          FROM cleaner_profile cp
          LEFT JOIN roles r ON r.role_id = cp.role_id
          WHERE cp.cleaner_id = ?
          LIMIT 1
        `,
        [decoded.user_id]
      );
      row = cleanerRows?.[0] || null;
    } else {
      const [userRows] = await promiseDb.query(
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
      row = userRows?.[0] || null;
    }

    if (!row && accountSource !== 'cleaner_profile') {
      const [cleanerRows] = await promiseDb.query(
        `
          SELECT
            cp.cleaner_id AS user_id,
            cp.company_email AS email,
            cp.role_id,
            r.role_name
          FROM cleaner_profile cp
          LEFT JOIN roles r ON r.role_id = cp.role_id
          WHERE cp.cleaner_id = ?
          LIMIT 1
        `,
        [decoded.user_id]
      );
      row = cleanerRows?.[0] || null;
    }
    const resolvedSource = accountSource === 'cleaner_profile' || !row?.email || accountSource === 'cleaner'
      ? accountSource || 'users'
      : 'users';

    const user = row
      ? {
          user_id: row.user_id,
          email: row.email,
          role_id: row.role_id,
          role: {
            role_id: row.role_id,
            role_name: row.role_name,
          },
          account_source: resolvedSource,
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
