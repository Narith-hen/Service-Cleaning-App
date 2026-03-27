const db = require('../../config/db');
const AppError = require('../../utils/error.util');

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

const resolveReviewTextColumn = (columns) => {
  if (columns.has('comment')) return 'comment';
  if (columns.has('command')) return 'command';
  return '';
};

const getServiceImageExpression = (columns) => (
  columns.has('image')
    ? 's.image'
    : 'NULL'
);

const mapBookingRow = (row, reviewTextColumn) => ({
  booking_id: Number(row.booking_id),
  booking_date: row.booking_date,
  booking_status: row.booking_status,
  total_price: Number(row.total_price || 0),
  negotiated_price: row.negotiated_price === null ? null : Number(row.negotiated_price || 0),
  payment_status: row.payment_status,
  created_at: row.created_at,
  user_id: Number(row.user_id),
  cleaner_id: row.cleaner_id === null ? null : Number(row.cleaner_id),
  service_id: Number(row.service_id),
  service: row.service_id ? {
    service_id: Number(row.service_id),
    name: row.service_name || null,
    description: row.service_description || null,
    price: row.service_price === null ? null : Number(row.service_price || 0),
    image: row.service_image || null
  } : null,
  payment: row.payment_id ? {
    payment_id: Number(row.payment_id),
    amount: row.payment_amount === null ? null : Number(row.payment_amount || 0),
    payment_method: row.payment_method || null,
    payment_status: row.payment_record_status || null,
    created_at: row.payment_created_at || null
  } : null,
  review: row.review_id ? {
    review_id: Number(row.review_id),
    rating: row.review_rating === null ? null : Number(row.review_rating || 0),
    [reviewTextColumn || 'comment']: row.review_text || null,
    created_at: row.review_created_at || null
  } : null
});

const getCustomerDashboard = async (req, res, next) => {
  try {
    const userId = Number(req.user?.user_id || 0);
    if (!userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const promiseDb = db.promise();
    const serviceColumns = await getTableColumns(promiseDb, 'services');
    const serviceImageExpression = getServiceImageExpression(serviceColumns);

    const [
      [upcomingRows],
      [pastRows],
      [spentRows],
      [recentRows]
    ] = await Promise.all([
      promiseDb.query(
        `
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE user_id = ?
            AND LOWER(COALESCE(booking_status, '')) IN ('pending', 'confirmed')
            AND booking_date >= NOW()
        `,
        [userId]
      ),
      promiseDb.query(
        `
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE user_id = ?
            AND LOWER(COALESCE(booking_status, '')) = 'completed'
        `,
        [userId]
      ),
      promiseDb.query(
        `
          SELECT
            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
                    THEN COALESCE(p.amount, 0)
                  ELSE 0
                END
              ),
              0
            ) AS total_spent
          FROM bookings b
          LEFT JOIN payments p ON p.booking_id = b.booking_id
          WHERE b.user_id = ?
        `,
        [userId]
      ),
      promiseDb.query(
        `
          SELECT
            b.booking_id,
            b.booking_date,
            b.booking_status,
            b.total_price,
            b.negotiated_price,
            b.payment_status,
            b.created_at,
            b.user_id,
            b.cleaner_id,
            b.service_id,
            s.name AS service_name,
            s.description AS service_description,
            s.price AS service_price,
            ${serviceImageExpression} AS service_image
          FROM bookings b
          LEFT JOIN services s ON s.service_id = b.service_id
          WHERE b.user_id = ?
          ORDER BY b.created_at DESC
          LIMIT 5
        `,
        [userId]
      )
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          upcoming_bookings: Number(upcomingRows?.[0]?.total || 0),
          past_bookings: Number(pastRows?.[0]?.total || 0),
          total_spent: Number(spentRows?.[0]?.total_spent || 0)
        },
        recent_bookings: (recentRows || []).map((row) => mapBookingRow(row, 'comment'))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerBookings = async (req, res, next) => {
  try {
    const userId = Number(req.user?.user_id || 0);
    if (!userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const { page, limit, offset } = normalizePagination(req.query?.page, req.query?.limit);
    const status = String(req.query?.status || '').trim();
    const promiseDb = db.promise();
    const [serviceColumns, paymentColumns, reviewColumns] = await Promise.all([
      getTableColumns(promiseDb, 'services'),
      getTableColumns(promiseDb, 'payments'),
      getTableColumns(promiseDb, 'reviews')
    ]);
    const serviceImageExpression = getServiceImageExpression(serviceColumns);
    const reviewTextColumn = resolveReviewTextColumn(reviewColumns);
    const paymentCreatedAtExpression = paymentColumns.has('created_at') ? 'p.created_at' : 'NULL';
    const reviewTextExpression = reviewTextColumn ? `r.${reviewTextColumn}` : 'NULL';
    const whereClauses = ['b.user_id = ?'];
    const params = [userId];

    if (status) {
      whereClauses.push('LOWER(COALESCE(b.booking_status, \'\')) = LOWER(?)');
      params.push(status);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const [bookingResult, totalResult] = await Promise.all([
      promiseDb.query(
        `
          SELECT
            b.booking_id,
            b.booking_date,
            b.booking_status,
            b.total_price,
            b.negotiated_price,
            b.payment_status,
            b.created_at,
            b.user_id,
            b.cleaner_id,
            b.service_id,
            s.name AS service_name,
            s.description AS service_description,
            s.price AS service_price,
            ${serviceImageExpression} AS service_image,
            p.payment_id,
            p.amount AS payment_amount,
            p.payment_method,
            p.payment_status AS payment_record_status,
            ${paymentCreatedAtExpression} AS payment_created_at,
            r.review_id,
            r.rating AS review_rating,
            ${reviewTextExpression} AS review_text,
            r.created_at AS review_created_at
          FROM bookings b
          LEFT JOIN services s ON s.service_id = b.service_id
          LEFT JOIN payments p ON p.booking_id = b.booking_id
          LEFT JOIN reviews r ON r.booking_id = b.booking_id
          ${whereSql}
          ORDER BY b.created_at DESC
          LIMIT ?
          OFFSET ?
        `,
        [...params, limit, offset]
      ),
      promiseDb.query(
        `
          SELECT COUNT(*) AS total
          FROM bookings b
          ${whereSql}
        `,
        params
      )
    ]);

    const bookings = (bookingResult?.[0] || []).map((row) => mapBookingRow(row, reviewTextColumn || 'comment'));
    const total = Number(totalResult?.[0]?.[0]?.total || 0);

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

const updateCustomerProfile = async (req, res, next) => {
  try {
    const userId = Number(req.user?.user_id || 0);
    if (!userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const username = req.body?.username;
    const phoneNumber = req.body?.phone_number;
    const updates = [];
    const values = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(String(username || '').trim());
    }
    if (phoneNumber !== undefined) {
      updates.push('phone_number = ?');
      values.push(String(phoneNumber || '').trim());
    }

    const promiseDb = db.promise();
    if (updates.length > 0) {
      values.push(userId);
      await promiseDb.query(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );
    }

    const [rows] = await promiseDb.query(
      `
        SELECT
          u.user_id,
          u.username,
          u.email,
          u.phone_number,
          u.role_id,
          u.created_at,
          r.role_name
        FROM users u
        LEFT JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    const user = rows?.[0];
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user_id: Number(user.user_id),
        username: user.username || null,
        email: user.email || null,
        phone_number: user.phone_number || null,
        role_id: Number(user.role_id || 0),
        created_at: user.created_at || null,
        role: user.role_name ? {
          role_id: Number(user.role_id || 0),
          role_name: user.role_name
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerDashboard,
  getCustomerBookings,
  updateCustomerProfile
};
