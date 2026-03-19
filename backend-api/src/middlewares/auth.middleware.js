const { verifyToken } = require('../utils/jwt.util');
const db = require('../config/db');
const AppError = require('../utils/error.util');

const getUserAccountById = async (promiseDb, userId) => {
  const [rows] = await promiseDb.query(
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
    [userId]
  );

  return rows?.[0] || null;
};

const getCleanerAccountById = async (promiseDb, userId) => {
  const [rows] = await promiseDb.query(
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
    [userId]
  );

  return rows?.[0] || null;
};

const normalizeAccountSource = (value) => {
  const accountSource = String(value || '').trim().toLowerCase();
  if (accountSource === 'cleaner_profile' || accountSource === 'cleaner') {
    return 'cleaner_profile';
  }
  if (accountSource === 'users' || accountSource === 'user' || accountSource === 'customer' || accountSource === 'admin') {
    return 'users';
  }
  return '';
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const accountSource = String(decoded?.account_source || '').toLowerCase();
    const tokenRole = String(decoded?.role || '').trim().toLowerCase();
    const tokenRoleId = Number(decoded?.role_id || 0);
    const roleFromTokenId = tokenRoleId === 1
      ? 'admin'
      : tokenRoleId === 2
        ? 'cleaner'
        : tokenRoleId === 3
          ? 'customer'
          : '';

    const promiseDb = db.promise();
    const normalizedAccountSource = normalizeAccountSource(accountSource);
    const preferredRole = String(tokenRole || roleFromTokenId || '').trim().toLowerCase();

    const [userRow, cleanerRow] = await Promise.all([
      getUserAccountById(promiseDb, decoded.user_id),
      getCleanerAccountById(promiseDb, decoded.user_id),
    ]);

    let row = null;
    let sourceTable = '';

    // Prefer the explicit account source from the token when present.
    if (normalizedAccountSource === 'cleaner_profile') {
      row = cleanerRow || userRow;
      sourceTable = cleanerRow ? 'cleaner_profile' : userRow ? 'users' : '';
    } else if (normalizedAccountSource === 'users') {
      row = userRow || cleanerRow;
      sourceTable = userRow ? 'users' : cleanerRow ? 'cleaner_profile' : '';
    } else if (preferredRole === 'cleaner') {
      row = cleanerRow || userRow;
      sourceTable = cleanerRow ? 'cleaner_profile' : userRow ? 'users' : '';
    } else if (preferredRole === 'customer' || preferredRole === 'admin') {
      row = userRow || cleanerRow;
      sourceTable = userRow ? 'users' : cleanerRow ? 'cleaner_profile' : '';
    } else if (userRow && cleanerRow) {
      const userRoleName = String(userRow.role_name || '').trim().toLowerCase();
      const cleanerRoleName = String(cleanerRow.role_name || '').trim().toLowerCase();

      if (preferredRole && cleanerRoleName === preferredRole) {
        row = cleanerRow;
        sourceTable = 'cleaner_profile';
      } else if (preferredRole && userRoleName === preferredRole) {
        row = userRow;
        sourceTable = 'users';
      } else {
        row = userRow;
        sourceTable = 'users';
      }
    } else {
      row = userRow || cleanerRow;
      sourceTable = userRow ? 'users' : cleanerRow ? 'cleaner_profile' : '';
    }

    const resolvedSource = sourceTable === 'cleaner_profile' ? 'cleaner_profile' : 'users';
    const resolvedRoleName = String(row?.role_name || preferredRole || '').trim().toLowerCase();
    const user = row
      ? {
          user_id: row.user_id,
          email: row.email,
          role_id: row.role_id,
          role: {
            role_id: row.role_id,
            role_name: resolvedRoleName || row.role_name,
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
    if (error?.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    if (error?.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Authentication failed', 401));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const allowedRoles = roles.map((role) => String(role || '').trim().toLowerCase());
    const userRole = String(req.user?.role?.role_name || '').trim().toLowerCase();
    const accountSource = String(req.user?.account_source || '').trim().toLowerCase();
    const effectiveRoles = new Set();
    if (userRole) effectiveRoles.add(userRole);
    if (accountSource === 'cleaner_profile' || accountSource === 'cleaner') {
      effectiveRoles.add('cleaner');
    }

    const isAllowed = allowedRoles.some((role) => effectiveRoles.has(role));
    if (!isAllowed) {
      return next(new AppError('Not authorized', 403));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
