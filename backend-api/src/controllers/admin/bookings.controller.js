const db = require('../../config/db');
const AppError = require('../../utils/error.util');

const parsePositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizePagination = (page, limit) => {
  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
  const offset = (normalizedPage - 1) * normalizedLimit;
  return { page: normalizedPage, limit: normalizedLimit, offset };
};

const getTableColumns = async (promiseDb, tableName) => {
  const [rows] = await promiseDb.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return new Set((rows || []).map((row) => String(row.Field || '').toLowerCase()));
};

const buildUserNameExpression = (alias, columns, fallbackSql) => {
  const parts = [];
  if (columns.has('first_name')) parts.push(`${alias}.first_name`);
  if (columns.has('last_name')) parts.push(`${alias}.last_name`);

  const candidates = [];
  if (parts.length) {
    candidates.push(`NULLIF(TRIM(CONCAT_WS(' ', ${parts.join(', ')})), '')`);
  }
  if (columns.has('username')) {
    candidates.push(`NULLIF(${alias}.username, '')`);
  }
  candidates.push(fallbackSql);

  return `COALESCE(${candidates.join(', ')})`;
};

const getAllBookings = async (req, res, next) => {
  try {
    const { page, limit, offset } = normalizePagination(req.query?.page, req.query?.limit);
    const status = String(req.query?.status || '').trim();
    const from = req.query?.from;
    const to = req.query?.to;
    const promiseDb = db.promise();
    const userColumns = await getTableColumns(promiseDb, 'users');
    const customerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('User #', b.user_id)`);
    const cleanerUserNameExpr = buildUserNameExpression('c', userColumns, 'NULL');
    const cleanerDisplayNameExpr = `COALESCE(NULLIF(cp.company_name, ''), ${cleanerUserNameExpr}, CONCAT('Cleaner #', b.cleaner_id))`;

    const whereClauses = [];
    const params = [];

    if (status) {
      whereClauses.push('LOWER(COALESCE(b.booking_status, \'\')) = LOWER(?)');
      params.push(status);
    }
    if (from) {
      whereClauses.push('b.created_at >= ?');
      params.push(new Date(from));
    }
    if (to) {
      whereClauses.push('b.created_at <= ?');
      params.push(new Date(to));
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [bookings] = await promiseDb.query(
      `
        SELECT
          b.*,
          ${customerNameExpr} AS user_name,
          ${userColumns.has('avatar') ? 'u.avatar' : 'NULL'} AS customer_avatar,
          u.email AS user_email,
          ${cleanerDisplayNameExpr} AS cleaner_display_name,
          ${cleanerDisplayNameExpr} AS cleaner_name,
          COALESCE(NULLIF(cp.company_email, ''), ${userColumns.has('email') ? 'c.email' : 'NULL'}) AS cleaner_email,
          COALESCE(cp.profile_image, ${userColumns.has('avatar') ? 'c.avatar' : 'NULL'}) AS cleaner_avatar,
          s.name AS service_name,
          s.description AS service_description,
          p.payment_id,
          p.amount AS payment_amount,
          p.payment_method,
          p.payment_status
        FROM bookings b
        LEFT JOIN users u ON u.user_id = b.user_id
        LEFT JOIN users c ON c.user_id = b.cleaner_id
        LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
        LEFT JOIN services s ON s.service_id = b.service_id
        LEFT JOIN payments p ON p.booking_id = b.booking_id
        ${whereSql}
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const [countRows] = await promiseDb.query(
      `
        SELECT COUNT(*) AS total
        FROM bookings b
        ${whereSql}
      `,
      params
    );

    const total = Number(countRows?.[0]?.total || 0);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
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
    const bookingId = parsePositiveInt(id);
    const cleanerId = parsePositiveInt(cleaner_id);
    const promiseDb = db.promise();
    const userColumns = await getTableColumns(promiseDb, 'users');
    const customerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('User #', b.user_id)`);
    const cleanerUserNameExpr = buildUserNameExpression('c', userColumns, 'NULL');
    const cleanerDisplayNameExpr = `COALESCE(NULLIF(cp.company_name, ''), ${cleanerUserNameExpr}, CONCAT('Cleaner #', b.cleaner_id))`;

    if (!bookingId || !cleanerId) {
      return next(new AppError('Valid booking_id and cleaner_id are required', 400));
    }

    const [updateResult] = await promiseDb.query(
      'UPDATE bookings SET cleaner_id = ? WHERE booking_id = ?',
      [cleanerId, bookingId]
    );

    if (!updateResult?.affectedRows) {
      return next(new AppError('Booking not found', 404));
    }

    const [bookingRows] = await promiseDb.query(
      `
        SELECT
          b.*,
          ${customerNameExpr} AS user_name,
          ${cleanerDisplayNameExpr} AS cleaner_display_name,
          ${cleanerDisplayNameExpr} AS cleaner_name,
          s.name AS service_name
        FROM bookings b
        LEFT JOIN users u ON u.user_id = b.user_id
        LEFT JOIN users c ON c.user_id = b.cleaner_id
        LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
        LEFT JOIN services s ON s.service_id = b.service_id
        WHERE b.booking_id = ?
        LIMIT 1
      `,
      [bookingId]
    );
    const booking = bookingRows?.[0] || null;

    // Notify cleaner
    await db.promise().query(
      `
        INSERT INTO notifications (title, message, type_notification, user_id, booking_id, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [
        'New Assignment',
        `You have been assigned to booking #${id}`,
        'assignment',
        cleanerId,
        bookingId
      ]
    );

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
    const [statsRows] = await db.promise().query(
      `
        SELECT booking_status, COUNT(*) AS total
        FROM bookings
        GROUP BY booking_status
      `
    );

    const stats = (statsRows || []).map((row) => ({
      booking_status: row.booking_status,
      _count: Number(row.total || 0)
    }));
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
