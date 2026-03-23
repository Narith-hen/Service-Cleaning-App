const db = require('../../config/db');

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
  if (columns.has('email')) {
    candidates.push(`NULLIF(SUBSTRING_INDEX(${alias}.email, '@', 1), '')`);
  }
  candidates.push(fallbackSql);

  return `COALESCE(${candidates.join(', ')})`;
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const userColumns = await getTableColumns(promiseDb, 'users');
    const customerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('User #', b.user_id)`);
    const cleanerUserNameExpr = buildUserNameExpression('c', userColumns, 'NULL');

    const recentUserSelect = [
      'u.user_id',
      userColumns.has('user_code') ? 'u.user_code' : 'NULL AS user_code',
      userColumns.has('username') ? 'u.username' : 'NULL AS username',
      userColumns.has('first_name') ? 'u.first_name' : 'NULL AS first_name',
      userColumns.has('last_name') ? 'u.last_name' : 'NULL AS last_name',
      userColumns.has('avatar') ? 'u.avatar' : 'NULL AS avatar',
      userColumns.has('is_active') ? 'u.is_active' : 'NULL AS is_active',
      userColumns.has('status') ? 'u.status' : 'NULL AS status',
      'u.email',
      'u.phone_number',
      'u.created_at',
      'u.role_id',
      'r.role_name'
    ];

    const [
      [userCountRows],
      [bookingCountRows],
      [revenueRows],
      [serviceCountRows],
      [recentBookingRows],
      [recentUserRows]
    ] = await Promise.all([
      promiseDb.query('SELECT COUNT(*) AS total_users FROM users'),
      promiseDb.query('SELECT COUNT(*) AS total_bookings FROM bookings'),
      promiseDb.query(`
        SELECT COALESCE(SUM(
          CASE
            WHEN LOWER(COALESCE(payment_status, '')) IN ('completed', 'paid')
              THEN COALESCE(amount, 0)
            ELSE 0
          END
        ), 0) AS total_revenue
        FROM payments
      `),
      promiseDb.query('SELECT COUNT(*) AS total_services FROM services'),
      promiseDb.query(`
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
          ${customerNameExpr} AS customer_name,
          u.email AS customer_email,
          COALESCE(
            ${cleanerUserNameExpr},
            NULLIF(cp.company_name, ''),
            CONCAT('Cleaner #', b.cleaner_id)
          ) AS cleaner_name,
          COALESCE(cp.profile_image, ${userColumns.has('avatar') ? 'c.avatar' : 'NULL'}) AS cleaner_avatar,
          s.name AS service_name,
          s.description AS service_description
        FROM bookings b
        LEFT JOIN users u ON u.user_id = b.user_id
        LEFT JOIN users c ON c.user_id = b.cleaner_id
        LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
        LEFT JOIN services s ON s.service_id = b.service_id
        ORDER BY b.created_at DESC
        LIMIT 10
      `),
      promiseDb.query(`
        SELECT ${recentUserSelect.join(', ')}
        FROM users u
        LEFT JOIN roles r ON r.role_id = u.role_id
        ORDER BY u.created_at DESC
        LIMIT 10
      `)
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total_users: Number(userCountRows?.[0]?.total_users || 0),
          total_bookings: Number(bookingCountRows?.[0]?.total_bookings || 0),
          total_revenue: Number(revenueRows?.[0]?.total_revenue || 0),
          total_services: Number(serviceCountRows?.[0]?.total_services || 0)
        },
        recent_bookings: (recentBookingRows || []).map((row) => ({
          ...row,
          booking_id: Number(row.booking_id),
          user_id: row.user_id == null ? null : Number(row.user_id),
          cleaner_id: row.cleaner_id == null ? null : Number(row.cleaner_id),
          service_id: row.service_id == null ? null : Number(row.service_id),
          total_price: Number(row.total_price || 0),
          negotiated_price: row.negotiated_price == null ? null : Number(row.negotiated_price),
        })),
        recent_users: (recentUserRows || []).map((row) => ({
          user_id: Number(row.user_id),
          user_code: row.user_code || null,
          username: row.username || null,
          first_name: row.first_name || null,
          last_name: row.last_name || null,
          email: row.email || null,
          phone_number: row.phone_number || null,
          avatar: row.avatar || null,
          created_at: row.created_at || null,
          role_id: row.role_id == null ? null : Number(row.role_id),
          role: {
            role_id: row.role_id == null ? null : Number(row.role_id),
            role_name: row.role_name || null
          },
          is_active: row.is_active == null ? null : Boolean(row.is_active),
          status: row.status || null
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTopCleaners = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const cleanerProfileColumns = await getTableColumns(promiseDb, 'cleaner_profile');
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 20) : 3;

    const hasProfileImage = cleanerProfileColumns.has('profile_image');
    const hasStatus = cleanerProfileColumns.has('status');
    const hasTotalReviews = cleanerProfileColumns.has('total_reviews');
    const hasRating = cleanerProfileColumns.has('rating');
    const hasAvgRating = cleanerProfileColumns.has('avg_rating');
    const profileRatingExpression = hasRating
      ? 'NULLIF(cp.rating, 0)'
      : hasAvgRating
        ? 'NULLIF(cp.avg_rating, 0)'
        : 'NULL';

    const [rows] = await promiseDb.query(
      `
        SELECT
          cp.cleaner_id AS id,
          cp.cleaner_code AS cleanerCode,
          cp.company_name AS name,
          cp.company_email AS email,
          cp.phone_number,
          ${hasProfileImage ? 'cp.profile_image' : 'NULL'} AS profileImage,
          ${hasStatus ? 'cp.status' : 'NULL'} AS status,
          r.role_name,
          COALESCE(job_stats.total_jobs, 0) AS totalJobs,
          COALESCE(review_stats.avg_rating, ${profileRatingExpression}, 3.00) AS rating,
          COALESCE(review_stats.total_reviews, ${hasTotalReviews ? 'cp.total_reviews' : 'NULL'}, 0) AS reviews
        FROM cleaner_profile cp
        INNER JOIN roles r ON cp.role_id = r.role_id
        LEFT JOIN (
          SELECT
            cleaner_id,
            COUNT(*) AS total_jobs
          FROM bookings
          WHERE LOWER(COALESCE(booking_status, '')) = 'completed'
          GROUP BY cleaner_id
        ) job_stats ON job_stats.cleaner_id = cp.cleaner_id
        LEFT JOIN (
          SELECT
            cleaner_id,
            COUNT(*) AS total_reviews,
            AVG(rating) AS avg_rating
          FROM reviews
          WHERE cleaner_id IS NOT NULL
          GROUP BY cleaner_id
        ) review_stats ON review_stats.cleaner_id = cp.cleaner_id
        WHERE LOWER(r.role_name) = 'cleaner'
        ORDER BY rating DESC, totalJobs DESC, cp.cleaner_id DESC
        LIMIT ?
      `,
      [limit]
    );

    res.status(200).json({
      success: true,
      data: (rows || []).map((row) => ({
        id: Number(row.id),
        cleanerCode: row.cleanerCode || null,
        name: row.name || row.email || `Cleaner #${row.id}`,
        email: row.email || null,
        phone_number: row.phone_number || null,
        profileImage: row.profileImage || null,
        status: row.status || null,
        role_name: row.role_name || 'cleaner',
        totalJobs: Number(row.totalJobs || 0),
        rating: Number(row.rating || 0),
        reviews: Number(row.reviews || 0)
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getSystemHealth = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  getAdminDashboard,
  getTopCleaners,
  getSystemHealth
};
