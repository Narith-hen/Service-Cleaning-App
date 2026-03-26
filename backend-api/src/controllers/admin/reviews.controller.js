const db = require('../../config/db');
const AppError = require('../../utils/error.util');
const { syncCleanerReviewStats } = require('../../utils/cleanerReviewStats.util');

const normalizePagination = (page, limit) => {
  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedLimit = Math.min(10000, Math.max(1, Number.parseInt(limit, 10) || 10));
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

const resolveSortSql = (sort) => {
  const normalized = String(sort || 'newest').trim().toLowerCase();
  if (normalized === 'oldest') return 'r.created_at ASC';
  if (normalized === 'highest') return 'r.rating DESC, r.created_at DESC';
  if (normalized === 'lowest') return 'r.rating ASC, r.created_at DESC';
  return 'r.created_at DESC';
};

const mapReviewRow = (row) => ({
  review_id: Number(row.review_id || 0),
  booking_id: Number(row.booking_id || 0),
  user_id: Number(row.user_id || 0),
  cleaner_id: row.cleaner_id == null ? null : Number(row.cleaner_id),
  rating: Number(row.rating || 0),
  comment: row.comment || '',
  created_at: row.created_at || null,
  service_name: row.service_name || 'Cleaning Service',
  reviewer_name: row.reviewer_name || `Customer #${row.user_id || ''}`,
  reviewer_email: row.reviewer_email || null,
  reviewer_avatar: row.reviewer_avatar || null,
  cleaner_name: row.cleaner_name || 'Cleaner pending',
  cleaner_email: row.cleaner_email || null,
  cleaner_avatar: row.cleaner_avatar || null,
  booking_status: row.booking_status || null,
  service_status: row.service_status || null
});

const getAllReviews = async (req, res, next) => {
  try {
    const { page, limit, offset } = normalizePagination(req.query?.page, req.query?.limit);
    const search = String(req.query?.search || '').trim();
    const rating = Number.parseInt(req.query?.rating, 10);
    const sortSql = resolveSortSql(req.query?.sort);
    const promiseDb = db.promise();
    const reviewColumns = await getTableColumns(promiseDb, 'reviews');
    const reviewTextColumn = resolveReviewTextColumn(reviewColumns);

    if (!reviewTextColumn) {
      return next(new AppError('Review text column not found in reviews table', 500));
    }

    const userColumns = await getTableColumns(promiseDb, 'users');
    const customerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('Customer #', r.user_id)`);
    const cleanerUserNameExpr = buildUserNameExpression('c', userColumns, `CONCAT('Cleaner #', r.cleaner_id)`);
    const customerAvatarExpr = userColumns.has('avatar') ? 'u.avatar' : 'NULL';
    const cleanerAvatarFallbackExpr = userColumns.has('avatar') ? 'c.avatar' : 'NULL';
    const customerEmailExpr = userColumns.has('email') ? 'u.email' : 'NULL';
    const cleanerEmailFallbackExpr = userColumns.has('email') ? 'c.email' : 'NULL';

    const whereClauses = [];
    const params = [];

    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      whereClauses.push('r.rating = ?');
      params.push(rating);
    }

    if (search) {
      const pattern = `%${search}%`;
      whereClauses.push(`
        (
          CAST(r.review_id AS CHAR) LIKE ?
          OR CAST(r.booking_id AS CHAR) LIKE ?
          OR LOWER(COALESCE(${customerNameExpr}, '')) LIKE LOWER(?)
          OR LOWER(COALESCE(${customerEmailExpr}, '')) LIKE LOWER(?)
          OR LOWER(COALESCE(NULLIF(cp.company_name, ''), ${cleanerUserNameExpr}, '')) LIKE LOWER(?)
          OR LOWER(COALESCE(NULLIF(cp.company_email, ''), ${cleanerEmailFallbackExpr}, '')) LIKE LOWER(?)
          OR LOWER(COALESCE(s.name, '')) LIKE LOWER(?)
          OR LOWER(COALESCE(r.\`${reviewTextColumn}\`, '')) LIKE LOWER(?)
        )
      `);
      params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [reviewRows] = await promiseDb.query(
      `
        SELECT
          r.review_id,
          r.booking_id,
          r.user_id,
          r.cleaner_id,
          r.rating,
          r.\`${reviewTextColumn}\` AS comment,
          r.created_at,
          COALESCE(s.name, CONCAT('Booking #', r.booking_id)) AS service_name,
          ${customerNameExpr} AS reviewer_name,
          ${customerEmailExpr} AS reviewer_email,
          ${customerAvatarExpr} AS reviewer_avatar,
          COALESCE(NULLIF(cp.company_name, ''), ${cleanerUserNameExpr}, CONCAT('Cleaner #', r.cleaner_id)) AS cleaner_name,
          COALESCE(NULLIF(cp.company_email, ''), ${cleanerEmailFallbackExpr}) AS cleaner_email,
          COALESCE(cp.profile_image, ${cleanerAvatarFallbackExpr}) AS cleaner_avatar,
          b.booking_status,
          b.service_status
        FROM reviews r
        LEFT JOIN bookings b ON b.booking_id = r.booking_id
        LEFT JOIN services s ON s.service_id = b.service_id
        LEFT JOIN users u ON u.user_id = r.user_id
        LEFT JOIN users c ON c.user_id = r.cleaner_id
        LEFT JOIN cleaner_profile cp ON cp.cleaner_id = r.cleaner_id
        ${whereSql}
        ORDER BY ${sortSql}
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const [countRows] = await promiseDb.query(
      `
        SELECT COUNT(*) AS total
        FROM reviews r
        LEFT JOIN bookings b ON b.booking_id = r.booking_id
        LEFT JOIN services s ON s.service_id = b.service_id
        LEFT JOIN users u ON u.user_id = r.user_id
        LEFT JOIN users c ON c.user_id = r.cleaner_id
        LEFT JOIN cleaner_profile cp ON cp.cleaner_id = r.cleaner_id
        ${whereSql}
      `,
      params
    );

    const total = Number(countRows?.[0]?.total || 0);

    res.status(200).json({
      success: true,
      data: (reviewRows || []).map(mapReviewRow),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getReviewStats = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const [summaryRows] = await promiseDb.query(
      `
        SELECT
          COUNT(*) AS total_reviews,
          ROUND(AVG(rating), 2) AS average_rating,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star_reviews,
          SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) AS low_rating_reviews,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS recent_reviews
        FROM reviews
      `
    );

    const [distributionRows] = await promiseDb.query(
      `
        SELECT rating AS score, COUNT(*) AS total
        FROM reviews
        GROUP BY rating
        ORDER BY rating DESC
      `
    );

    res.status(200).json({
      success: true,
      data: {
        totalReviews: Number(summaryRows?.[0]?.total_reviews || 0),
        averageRating: Number(summaryRows?.[0]?.average_rating || 0),
        fiveStarReviews: Number(summaryRows?.[0]?.five_star_reviews || 0),
        lowRatingReviews: Number(summaryRows?.[0]?.low_rating_reviews || 0),
        recentReviews: Number(summaryRows?.[0]?.recent_reviews || 0),
        distribution: (distributionRows || []).map((row) => ({
          score: Number(row.score || 0),
          count: Number(row.total || 0)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const reviewId = Number.parseInt(req.params?.id, 10);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return next(new AppError('Valid review id is required', 400));
    }

    const promiseDb = db.promise();
    const [reviewRows] = await promiseDb.query(
      `
        SELECT review_id, cleaner_id
        FROM reviews
        WHERE review_id = ?
        LIMIT 1
      `,
      [reviewId]
    );

    const review = reviewRows?.[0] || null;
    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    await promiseDb.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);

    if (review.cleaner_id) {
      await syncCleanerReviewStats(promiseDb, Number(review.cleaner_id));
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      data: {
        review_id: reviewId
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReviews,
  getReviewStats,
  deleteReview
};
