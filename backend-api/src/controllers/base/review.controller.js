const db = require('../../config/db');
const AppError = require('../../utils/error.util');
const { syncCleanerReviewStats } = require('../../utils/cleanerReviewStats.util');

const getTableColumns = async (promiseDb, tableName) => {
  const [columns] = await promiseDb.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return new Set((columns || []).map((column) => String(column.Field || '').toLowerCase()));
};

const getReviewTableColumns = async (promiseDb) => {
  return getTableColumns(promiseDb, 'reviews');
};

const resolveReviewTextColumn = (columnSet) => {
  if (columnSet.has('command')) return 'command';
  if (columnSet.has('comment')) return 'comment';
  return '';
};

const resolveReviewSort = (sort) => {
  const normalizedSort = String(sort || 'newest').trim().toLowerCase();

  if (normalizedSort === 'oldest') {
    return 'r.created_at ASC';
  }
  if (normalizedSort === 'highest') {
    return 'r.rating DESC, r.created_at DESC';
  }
  if (normalizedSort === 'lowest') {
    return 'r.rating ASC, r.created_at DESC';
  }

  return 'r.created_at DESC';
};

const buildReviewerNameExpression = (userColumns) => {
  const hasFirstName = userColumns.has('first_name');
  const hasLastName = userColumns.has('last_name');
  const hasUsername = userColumns.has('username');

  if (hasFirstName || hasLastName) {
    const parts = [];
    if (hasFirstName) parts.push('u.first_name');
    if (hasLastName) parts.push('u.last_name');
    const fullName = `NULLIF(TRIM(CONCAT_WS(' ', ${parts.join(', ')})), '')`;

    if (hasUsername) {
      return `COALESCE(${fullName}, NULLIF(u.username, ''), CONCAT('Customer #', r.user_id))`;
    }

    return `COALESCE(${fullName}, CONCAT('Customer #', r.user_id))`;
  }

  if (hasUsername) {
    return `COALESCE(NULLIF(u.username, ''), CONCAT('Customer #', r.user_id))`;
  }

  return `CONCAT('Customer #', r.user_id)`;
};

const buildReviewerAvatarExpression = (userColumns) => (
  userColumns.has('avatar') ? 'u.avatar' : 'NULL'
);

const canReviewBooking = (booking) => {
  const bookingStatus = String(booking?.booking_status || '').trim().toLowerCase();
  const serviceStatus = String(booking?.service_status || '').trim().toLowerCase();
  const paymentStatus = String(booking?.payment_status || '').trim().toLowerCase();

  if (bookingStatus === 'completed') {
    return true;
  }

  return serviceStatus === 'completed'
    && ['receipt_submitted', 'completed', 'paid'].includes(paymentStatus);
};

const createReview = async (req, res, next) => {
  let transactionStarted = false;
  try {
    const { booking_id, rating, comment, command, cleaner_id } = req.body;
    const user_id = req.user.user_id;
    const numericBookingId = Number(booking_id);
    const numericRating = Number(rating);
    const numericCleanerId = cleaner_id ? Number(cleaner_id) : null;
    const reviewText = String(comment ?? command ?? '').trim();
    const promiseDb = db.promise();

    const [bookingRows] = await promiseDb.query(
      `
        SELECT
          booking_id,
          user_id,
          cleaner_id,
          booking_status,
          service_status,
          payment_status
        FROM bookings
        WHERE booking_id = ?
        LIMIT 1
      `,
      [numericBookingId]
    );

    const booking = bookingRows?.[0] || null;

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.user_id !== user_id) {
      return next(new AppError('Not authorized to review this booking', 403));
    }

    const [existingReviewRows] = await promiseDb.query(
      'SELECT review_id FROM reviews WHERE booking_id = ? LIMIT 1',
      [numericBookingId]
    );

    if (existingReviewRows?.length) {
      return next(new AppError('Review already exists for this booking', 400));
    }

    const bookingStatus = String(booking.booking_status || '').trim().toLowerCase();
    const serviceStatus = String(booking.service_status || '').trim().toLowerCase();
    const paymentStatus = String(booking.payment_status || '').trim().toLowerCase();
    const canReviewAfterPayment =
      serviceStatus === 'completed'
      && ['receipt_submitted', 'paid', 'completed'].includes(paymentStatus);

    if (bookingStatus !== 'completed' && !canReviewAfterPayment) {
      return next(new AppError('Can only review a completed and paid booking', 400));
    }

    const reviewColumns = await getReviewTableColumns(promiseDb);
    const reviewTextColumn = resolveReviewTextColumn(reviewColumns);

    if (!reviewTextColumn) {
      return next(new AppError('Review text column not found in reviews table', 500));
    }

    const resolvedCleanerId = numericCleanerId || booking.cleaner_id || null;

    await promiseDb.query('START TRANSACTION');
    transactionStarted = true;

    const insertColumns = ['rating', reviewTextColumn, 'booking_id', 'user_id'];
    const insertValues = [numericRating, reviewText, numericBookingId, user_id];

    if (reviewColumns.has('cleaner_id')) {
      insertColumns.push('cleaner_id');
      insertValues.push(resolvedCleanerId);
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    const columnSql = insertColumns.map((column) => `\`${column}\``).join(', ');

    const [insertResult] = await promiseDb.query(
      `INSERT INTO reviews (${columnSql}) VALUES (${placeholders})`,
      insertValues
    );

    if (resolvedCleanerId) {
      await syncCleanerReviewStats(promiseDb, resolvedCleanerId);
    }

    const [reviewRows] = await promiseDb.query(
      `
        SELECT
          review_id,
          rating,
          \`${reviewTextColumn}\` AS comment,
          created_at,
          booking_id,
          user_id,
          cleaner_id
        FROM reviews
        WHERE review_id = ?
        LIMIT 1
      `,
      [insertResult.insertId]
    );

    await promiseDb.query('COMMIT');
    transactionStarted = false;

    const review = reviewRows?.[0] || {
      review_id: insertResult.insertId,
      rating: numericRating,
      comment: reviewText,
      booking_id: numericBookingId,
      user_id,
      cleaner_id: resolvedCleanerId
    };

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await db.promise().query('ROLLBACK');
      } catch (_) {
        // Ignore rollback errors from non-transaction paths.
      }
    }
    next(error);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const { serviceId, cleanerId, rating, page = 1, limit = 10, sort = 'newest' } = req.query;
    const numericPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const numericLimit = Math.max(Number.parseInt(limit, 10) || 10, 1);
    const offset = (numericPage - 1) * numericLimit;
    const numericServiceId = serviceId ? Number.parseInt(serviceId, 10) : null;
    const numericCleanerId = cleanerId ? Number.parseInt(cleanerId, 10) : null;
    const numericRating = rating ? Number.parseInt(rating, 10) : null;
    const promiseDb = db.promise();

    const reviewColumns = await getReviewTableColumns(promiseDb);
    const reviewTextColumn = resolveReviewTextColumn(reviewColumns);
    if (!reviewTextColumn) {
      return next(new AppError('Review text column not found in reviews table', 500));
    }

    const userColumns = await getTableColumns(promiseDb, 'users');
    const reviewerNameExpression = buildReviewerNameExpression(userColumns);
    const reviewerAvatarExpression = buildReviewerAvatarExpression(userColumns);
    const whereClauses = [];
    const queryParams = [];

    if (numericServiceId) {
      whereClauses.push('b.service_id = ?');
      queryParams.push(numericServiceId);
    }

    if (numericCleanerId) {
      whereClauses.push('r.cleaner_id = ?');
      queryParams.push(numericCleanerId);
    }

    if (numericRating) {
      whereClauses.push('r.rating = ?');
      queryParams.push(numericRating);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sortSql = resolveReviewSort(sort);

    const [reviewRows] = await promiseDb.query(
      `
        SELECT
          r.review_id,
          r.rating,
          r.\`${reviewTextColumn}\` AS comment,
          r.created_at,
          r.booking_id,
          r.user_id,
          r.cleaner_id,
          COALESCE(s.name, CONCAT('Booking #', r.booking_id)) AS service_name,
          ${reviewerNameExpression} AS reviewer_name,
          ${reviewerAvatarExpression} AS reviewer_avatar
        FROM reviews r
        LEFT JOIN bookings b ON b.booking_id = r.booking_id
        LEFT JOIN services s ON s.service_id = b.service_id
        LEFT JOIN users u ON u.user_id = r.user_id
        ${whereSql}
        ORDER BY ${sortSql}
        LIMIT ? OFFSET ?
      `,
      [...queryParams, numericLimit, offset]
    );

    const [countRows] = await promiseDb.query(
      `
        SELECT COUNT(*) AS total
        FROM reviews r
        LEFT JOIN bookings b ON b.booking_id = r.booking_id
        ${whereSql}
      `,
      queryParams
    );

    const total = Number(countRows?.[0]?.total || 0);
    const reviews = (reviewRows || []).map((row) => ({
      review_id: row.review_id,
      rating: Number(row.rating || 0),
      comment: row.comment || '',
      created_at: row.created_at,
      booking_id: row.booking_id,
      user_id: row.user_id,
      cleaner_id: row.cleaner_id,
      reviewer_name: row.reviewer_name || `Customer #${row.user_id}`,
      reviewer_avatar: row.reviewer_avatar || null,
      service_name: row.service_name || null
    }));

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getReviewStats = async (req, res, next) => {
  try {
    const { serviceId, cleanerId } = req.query;
    const numericServiceId = serviceId ? Number.parseInt(serviceId, 10) : null;
    const numericCleanerId = cleanerId ? Number.parseInt(cleanerId, 10) : null;
    const promiseDb = db.promise();
    const whereClauses = [];
    const queryParams = [];

    if (numericServiceId) {
      whereClauses.push('b.service_id = ?');
      queryParams.push(numericServiceId);
    }

    if (numericCleanerId) {
      whereClauses.push('r.cleaner_id = ?');
      queryParams.push(numericCleanerId);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [statRows] = await promiseDb.query(
      `
        SELECT
          COUNT(*) AS total_reviews,
          ROUND(AVG(r.rating), 2) AS average_rating,
          SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS five_star,
          SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS four_star,
          SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS three_star,
          SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS two_star,
          SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS one_star
        FROM reviews r
        LEFT JOIN bookings b ON b.booking_id = r.booking_id
        ${whereSql}
      `,
      queryParams
    );

    let totalReviews = Number(statRows?.[0]?.total_reviews || 0);
    let averageRating = Number(statRows?.[0]?.average_rating || 0);

    if (numericCleanerId && totalReviews === 0) {
      const [cleanerRows] = await promiseDb.query(
        `
          SELECT
            COALESCE(total_reviews, 0) AS total_reviews,
            COALESCE(rating, 0) AS rating
          FROM cleaner_profile
          WHERE cleaner_id = ?
          LIMIT 1
        `,
        [numericCleanerId]
      );

      if (cleanerRows?.[0]) {
        totalReviews = Number(cleanerRows[0].total_reviews || 0);
        averageRating = Number(cleanerRows[0].rating || 0);
      }
    }

    const distribution = [
      { score: 5, count: Number(statRows?.[0]?.five_star || 0) },
      { score: 4, count: Number(statRows?.[0]?.four_star || 0) },
      { score: 3, count: Number(statRows?.[0]?.three_star || 0) },
      { score: 2, count: Number(statRows?.[0]?.two_star || 0) },
      { score: 1, count: Number(statRows?.[0]?.one_star || 0) }
    ];

    res.status(200).json({
      success: true,
      data: {
        averageRating,
        totalReviews,
        distribution
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getReviews,
  getReviewStats
};
