const db = require('../../config/db');
const { ADMIN_EARNING_PER_PAID_BOOKING } = require('../../constants/adminRevenue');

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

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SERVICE_IMAGE_SELECT_SQL = `COALESCE(
        (
          SELECT si.image_url
          FROM service_images si
          WHERE si.service_id = s.service_id
          ORDER BY si.id DESC
          LIMIT 1
        ),
        s.image
      )`;

const resolveReviewTextColumn = (columnSet) => {
  if (columnSet.has('comment')) return 'comment';
  if (columnSet.has('command')) return 'command';
  return '';
};

const resolveDashboardRange = (range) => {
  const normalizedRange = String(range || 'total').trim().toLowerCase();
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (normalizedRange === 'week') {
    const day = start.getDay();
    const offset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - offset);
    return start;
  }

  if (normalizedRange === 'month') {
    start.setDate(1);
    return start;
  }

  return null;
};

const buildBookingVolumeQuery = (range) => {
  const normalizedRange = String(range || 'month').trim().toLowerCase();
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (normalizedRange === 'week') {
    const day = start.getDay();
    const offset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - offset);

    return {
      range: 'week',
      labels: WEEKDAY_LABELS,
      query: `
        SELECT DAYOFWEEK(b.created_at) AS bucket, COUNT(*) AS total
        FROM bookings b
        WHERE b.created_at >= ?
        GROUP BY DAYOFWEEK(b.created_at)
      `,
      params: [start],
      valueFromBucket: (bucket) => Number(bucket || 0),
      labelForIndex: (_, index) => WEEKDAY_LABELS[index],
      bucketForIndex: (_, index) => [2, 3, 4, 5, 6, 7, 1][index]
    };
  }

  if (normalizedRange === 'total') {
    const currentYear = now.getFullYear();
    const minYear = currentYear - 6;
    return {
      range: 'total',
      labels: Array.from({ length: 7 }, (_, index) => String(minYear + index)),
      query: `
        SELECT YEAR(b.created_at) AS bucket, COUNT(*) AS total
        FROM bookings b
        WHERE YEAR(b.created_at) >= ?
        GROUP BY YEAR(b.created_at)
      `,
      params: [minYear],
      valueFromBucket: (bucket) => Number(bucket || 0),
      labelForIndex: (_, index) => String(minYear + index),
      bucketForIndex: (_, index) => minYear + index
    };
  }

  return {
    range: 'month',
    labels: MONTH_LABELS,
    query: `
      SELECT MONTH(b.created_at) AS bucket, COUNT(*) AS total
      FROM bookings b
      WHERE YEAR(b.created_at) = YEAR(CURRENT_DATE())
      GROUP BY MONTH(b.created_at)
    `,
    params: [],
    valueFromBucket: (bucket) => Number(bucket || 0),
    labelForIndex: (_, index) => MONTH_LABELS[index],
    bucketForIndex: (_, index) => index + 1
  };
};

const mapBookingVolumeRows = (rangeConfig, rows) => {
  const totalsByBucket = new Map(
    (rows || []).map((row) => [rangeConfig.valueFromBucket(row?.bucket), Number(row?.total || 0)])
  );

  return rangeConfig.labels.map((label, index) => ({
    label: rangeConfig.labelForIndex(label, index),
    bookings_count: Number(totalsByBucket.get(rangeConfig.bucketForIndex(label, index)) || 0)
  }));
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const normalizedRange = String(req.query?.range || 'total').trim().toLowerCase() || 'total';
    const bookingVolumeRange = req.query?.volumeRange || normalizedRange;
    const bookingVolumeConfig = buildBookingVolumeQuery(bookingVolumeRange);
    const rangeStart = resolveDashboardRange(normalizedRange);
    const userColumns = await getTableColumns(promiseDb, 'users');
    const reviewColumns = await getTableColumns(promiseDb, 'reviews');
    const reviewTextColumn = resolveReviewTextColumn(reviewColumns);
    const customerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('User #', b.user_id)`);
    const cleanerUserNameExpr = buildUserNameExpression('c', userColumns, 'NULL');
    const cleanerDisplayNameExpr = `COALESCE(NULLIF(cp.company_name, ''), ${cleanerUserNameExpr}, CONCAT('Cleaner #', b.cleaner_id))`;
    const reviewerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('Customer #', r.user_id)`);
    const reviewerAvatarExpr = userColumns.has('avatar') ? 'u.avatar' : 'NULL';

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
    const bookingFilterSql = rangeStart
      ? `WHERE b.created_at >= ?`
      : '';
    const bookingQueryParams = rangeStart ? [rangeStart] : [];
    const revenueFilterSql = rangeStart
      ? `AND COALESCE(p.cleaner_confirmed_at, p.receipt_uploaded_at, b.created_at) >= ?`
      : '';
    const revenueQueryParams = rangeStart ? [rangeStart] : [];
    const reviewFilterSql = rangeStart
      ? `WHERE r.created_at >= ?`
      : '';
    const reviewQueryParams = rangeStart ? [rangeStart] : [];

    const [
      [userCountRows],
      [bookingCountRows],
      [revenueRows],
      [serviceCountRows],
      [complaintStatsRows],
      [recentBookingRows],
      [recentUserRows],
      [topServiceRows],
      [latestReviewRows],
      [bookingVolumeRows]
    ] = await Promise.all([
      promiseDb.query('SELECT COUNT(*) AS total_users FROM users'),
      promiseDb.query(
        `
          SELECT COUNT(*) AS total_bookings
          FROM bookings b
          ${bookingFilterSql}
        `,
        bookingQueryParams
      ),
      promiseDb.query(`
        SELECT COALESCE(COUNT(DISTINCT p.booking_id), 0) * ? AS total_revenue
        FROM payments p
        LEFT JOIN bookings b ON b.booking_id = p.booking_id
        WHERE LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
          ${revenueFilterSql}
      `, [ADMIN_EARNING_PER_PAID_BOOKING, ...revenueQueryParams]),
      promiseDb.query('SELECT COUNT(*) AS total_services FROM services'),
      promiseDb.query(
        `
          SELECT
            COALESCE(SUM(CASE WHEN COALESCE(r.rating, 0) <= 2 THEN 1 ELSE 0 END), 0) AS customer_complaints,
            COALESCE(SUM(CASE WHEN COALESCE(r.rating, 0) <= 1 THEN 1 ELSE 0 END), 0) AS urgent_complaints
          FROM reviews r
          ${reviewFilterSql}
        `,
        reviewQueryParams
      ),
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
          ${userColumns.has('avatar') ? 'u.avatar' : 'NULL'} AS customer_avatar,
          u.email AS customer_email,
          ${cleanerDisplayNameExpr} AS cleaner_display_name,
          ${cleanerDisplayNameExpr} AS cleaner_name,
          COALESCE(cp.profile_image, ${userColumns.has('avatar') ? 'c.avatar' : 'NULL'}) AS cleaner_avatar,
          s.name AS service_name,
          s.description AS service_description
        FROM bookings b
        LEFT JOIN users u ON u.user_id = b.user_id
        LEFT JOIN users c ON c.user_id = b.cleaner_id
        LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
        LEFT JOIN services s ON s.service_id = b.service_id
        ${bookingFilterSql}
        ORDER BY b.created_at DESC
        LIMIT 5
      `, bookingQueryParams),
      promiseDb.query(`
        SELECT ${recentUserSelect.join(', ')}
        FROM users u
        LEFT JOIN roles r ON r.role_id = u.role_id
        ORDER BY u.created_at DESC
        LIMIT 10
      `),
      promiseDb.query(
        `
          SELECT
            s.service_id,
            s.name AS service_name,
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
            COUNT(b.booking_id) AS bookings_count
          FROM services s
          LEFT JOIN bookings b ON b.service_id = s.service_id
            ${rangeStart ? 'AND b.created_at >= ?' : ''}
          GROUP BY s.service_id, s.name, service_image
          HAVING COUNT(b.booking_id) > 0
          ORDER BY bookings_count DESC, s.service_id ASC
          LIMIT 3
        `,
        bookingQueryParams
      ),
      reviewTextColumn
        ? promiseDb.query(
            `
              SELECT
                r.review_id,
                r.rating,
                r.created_at,
                r.booking_id,
                r.user_id,
                r.cleaner_id,
                r.\`${reviewTextColumn}\` AS comment,
                COALESCE(s.name, CONCAT('Booking #', r.booking_id)) AS service_name,
                ${reviewerNameExpr} AS reviewer_name,
                ${reviewerAvatarExpr} AS reviewer_avatar
              FROM reviews r
              LEFT JOIN bookings b ON b.booking_id = r.booking_id
              LEFT JOIN services s ON s.service_id = b.service_id
              LEFT JOIN users u ON u.user_id = r.user_id
              ${reviewFilterSql}
              ORDER BY r.created_at DESC
              LIMIT 2
            `,
            reviewQueryParams
          )
        : Promise.resolve([[]]),
      promiseDb.query(bookingVolumeConfig.query, bookingVolumeConfig.params)
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total_users: Number(userCountRows?.[0]?.total_users || 0),
          total_bookings: Number(bookingCountRows?.[0]?.total_bookings || 0),
          total_revenue: Number(revenueRows?.[0]?.total_revenue || 0),
          total_services: Number(serviceCountRows?.[0]?.total_services || 0),
          customer_complaints: Number(complaintStatsRows?.[0]?.customer_complaints || 0),
          urgent_complaints: Number(complaintStatsRows?.[0]?.urgent_complaints || 0),
          revenue_range: normalizedRange
        },
        recent_bookings: (recentBookingRows || []).map((row) => ({
          booking_id: Number(row.booking_id),
          booking_date: row.booking_date || null,
          booking_status: row.booking_status || null,
          total_price: Number(row.total_price || 0),
          negotiated_price: row.negotiated_price == null ? null : Number(row.negotiated_price),
          payment_status: row.payment_status || null,
          created_at: row.created_at || null,
          user_id: row.user_id == null ? null : Number(row.user_id),
          cleaner_id: row.cleaner_id == null ? null : Number(row.cleaner_id),
          service_id: row.service_id == null ? null : Number(row.service_id),
          customer_name: row.customer_name || null,
          customer_avatar: row.customer_avatar || null,
          customer_email: row.customer_email || null,
          cleaner_display_name: row.cleaner_display_name || null,
          cleaner_name: row.cleaner_name || null,
          cleaner_avatar: row.cleaner_avatar || null,
          service_name: row.service_name || null,
          service_description: row.service_description || null
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
        })),
        top_services: (topServiceRows || []).map((row) => ({
          service_id: Number(row.service_id || 0),
          service_name: row.service_name || 'Cleaning Service',
          service_image: row.service_image || null,
          bookings_count: Number(row.bookings_count || 0)
        })),
        latest_reviews: (latestReviewRows || []).map((row) => ({
          review_id: Number(row.review_id || 0),
          rating: Number(row.rating || 0),
          comment: row.comment || '',
          created_at: row.created_at || null,
          booking_id: Number(row.booking_id || 0),
          user_id: Number(row.user_id || 0),
          cleaner_id: row.cleaner_id == null ? null : Number(row.cleaner_id),
          reviewer_name: row.reviewer_name || `Customer #${row.user_id || ''}`,
          reviewer_avatar: row.reviewer_avatar || null,
          service_name: row.service_name || null
        })),
        booking_volume: {
          range: bookingVolumeConfig.range,
          items: mapBookingVolumeRows(bookingVolumeConfig, bookingVolumeRows || [])
        }
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
