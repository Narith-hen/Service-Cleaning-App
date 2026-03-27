const db = require('../../config/db');
const {
  getCleanerProfileColumns,
  resolveCleanerRatingColumn
} = require('../../utils/cleanerReviewStats.util');
const AppError = require('../../utils/error.util');

const toPositiveInt = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const buildCleanerIdFilter = (cleanerIds = []) => {
  if (!Array.isArray(cleanerIds) || cleanerIds.length === 0) return null;
  if (cleanerIds.length === 1) return cleanerIds[0];
  return { in: cleanerIds };
};

const buildSqlInClause = (values = []) => values.map(() => '?').join(', ');

const normalizePagination = (page, limit) => {
  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
  const offset = (normalizedPage - 1) * normalizedLimit;
  return { page: normalizedPage, limit: normalizedLimit, offset };
};

const TODAY_SCHEDULE_BOOKING_STATUSES = [
  'confirmed',
  'accepted',
  'booked',
  'started',
  'in_progress',
  'in-progress',
  'payment_required',
  'completed'
];

const toSqlDateString = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTableColumns = async (promiseDb, tableName) => {
  const [rows] = await promiseDb.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return new Set((rows || []).map((row) => String(row.Field || '').toLowerCase()));
};

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

const mapDashboardJobRow = (row) => ({
  booking_id: Number(row?.booking_id || 0),
  booking_date: row?.booking_date || null,
  booking_time: row?.booking_time || '',
  booking_status: row?.booking_status || null,
  total_price: Number(row?.total_price || 0),
  negotiated_price: row?.negotiated_price == null ? null : Number(row?.negotiated_price || 0),
  address: row?.address || '',
  user: {
    username: row?.customer_name || `Customer #${row?.user_id || ''}`,
    phone_number: row?.customer_phone || ''
  },
  service: {
    service_id: Number(row?.service_id || 0),
    name: row?.service_name || 'Cleaning Service'
  }
});

const mapCleanerJobRow = (row) => ({
  booking_id: Number(row?.booking_id || 0),
  booking_date: row?.booking_date || null,
  booking_time: row?.booking_time || '',
  booking_status: row?.booking_status || null,
  created_at: row?.created_at || null,
  updated_at: row?.updated_at || null,
  total_price: Number(row?.total_price || 0),
  negotiated_price: row?.negotiated_price == null ? null : Number(row?.negotiated_price || 0),
  payment_status: row?.payment_status || null,
  service_id: Number(row?.service_id || 0),
  service_name: row?.service_name || 'Cleaning Service',
  service_image: row?.service_image || '',
  service_description: row?.service_description || '',
  user_id: Number(row?.user_id || 0),
  user: {
    username: row?.customer_name || `Customer #${row?.user_id || ''}`,
    phone_number: row?.customer_phone || '',
    email: row?.customer_email || '',
    avatar: row?.customer_avatar || '',
    address: row?.address || ''
  },
  service: {
    service_id: Number(row?.service_id || 0),
    name: row?.service_name || 'Cleaning Service',
    description: row?.service_description || '',
    image: row?.service_image || ''
  }
});

const normalizeEmail = (value) => {
  const text = String(value || '').trim().toLowerCase();
  return text || '';
};

const normalizePhone = (value) => {
  const text = String(value || '').trim();
  return text || '';
};

const normalizeCode = (value) => {
  const text = String(value || '').trim().toLowerCase();
  return text || '';
};

const chooseBestCleanerProfileId = (rows, matcher) => {
  const emailSet = matcher.emailSet || new Set();
  const phoneSet = matcher.phoneSet || new Set();
  const codeSet = matcher.codeSet || new Set();
  const rawCleanerId = matcher.rawCleanerId || null;

  let bestScore = -1;
  let bestCleanerId = null;

  for (const row of rows || []) {
    const cleanerId = toPositiveInt(row?.cleaner_id);
    if (!cleanerId) continue;

    const rowEmail = normalizeEmail(row?.company_email);
    const rowPhone = normalizePhone(row?.phone_number);
    const rowCode = normalizeCode(row?.cleaner_code);

    let score = 0;
    if (rawCleanerId && cleanerId === rawCleanerId) score += 100;
    if (rowEmail && emailSet.has(rowEmail)) score += 60;
    if (rowPhone && phoneSet.has(rowPhone)) score += 40;
    if (rowCode && codeSet.has(rowCode)) score += 30;

    if (score > bestScore) {
      bestScore = score;
      bestCleanerId = cleanerId;
    }
  }

  return bestCleanerId;
};

const resolveCleanerIdentity = async (promiseDb, user) => {
  const ids = new Set();
  const rawCleanerId = toPositiveInt(user?.user_id);
  const emailSet = new Set();
  const phoneSet = new Set();
  const codeSet = new Set();
  let cleanerProfileId = null;

  if (rawCleanerId) {
    ids.add(rawCleanerId);
  }

  const tokenEmail = normalizeEmail(user?.email);
  if (tokenEmail) {
    emailSet.add(tokenEmail);
  }

  if (rawCleanerId) {
    const [userRows] = await promiseDb.query(
      `
        SELECT user_id, email, phone_number, user_code
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [rawCleanerId]
    );
    const userRow = userRows?.[0] || null;
    if (userRow) {
      const userEmail = normalizeEmail(userRow.email);
      const userPhone = normalizePhone(userRow.phone_number);
      const userCode = normalizeCode(userRow.user_code);
      if (userEmail) emailSet.add(userEmail);
      if (userPhone) phoneSet.add(userPhone);
      if (userCode) codeSet.add(userCode);
    }
  }

  const whereClauses = [];
  const params = [];
  if (rawCleanerId) {
    whereClauses.push('cp.cleaner_id = ?');
    params.push(rawCleanerId);
  }

  for (const email of emailSet) {
    whereClauses.push('LOWER(cp.company_email) = ?');
    params.push(email);
  }
  for (const phone of phoneSet) {
    whereClauses.push('cp.phone_number = ?');
    params.push(phone);
  }
  for (const code of codeSet) {
    whereClauses.push('LOWER(cp.cleaner_code) = ?');
    params.push(code);
  }

  if (whereClauses.length > 0) {
    const [profileRows] = await promiseDb.query(
      `
        SELECT cp.cleaner_id, cp.company_email, cp.phone_number, cp.cleaner_code
        FROM cleaner_profile cp
        WHERE ${whereClauses.join(' OR ')}
        ORDER BY cp.cleaner_id ASC
      `,
      params
    );

    const matchedProfileId = chooseBestCleanerProfileId(profileRows, {
      rawCleanerId,
      emailSet,
      phoneSet,
      codeSet
    });
    if (matchedProfileId) {
      cleanerProfileId = matchedProfileId;
      ids.add(matchedProfileId);
    }
  }

  return {
    cleanerIds: Array.from(ids),
    cleanerProfileId: cleanerProfileId || rawCleanerId || null
  };
};

const getCleanerProfileStats = async (promiseDb, cleanerId) => {
  if (!toPositiveInt(cleanerId)) return null;
  const cleanerProfileColumns = await getCleanerProfileColumns(promiseDb);
  const ratingColumn = resolveCleanerRatingColumn(cleanerProfileColumns);
  const hasTotalReviews = cleanerProfileColumns.has('total_reviews');

  if (!ratingColumn && !hasTotalReviews) {
    return null;
  }

  const selectParts = [];
  if (ratingColumn) {
    selectParts.push(`COALESCE(cp.\`${ratingColumn}\`, 0) AS average_rating`);
  }
  if (hasTotalReviews) {
    selectParts.push('COALESCE(cp.`total_reviews`, 0) AS total_reviews');
  }

  const [rows] = await promiseDb.query(
    `
      SELECT ${selectParts.join(', ')}
      FROM cleaner_profile cp
      WHERE cp.cleaner_id = ?
      LIMIT 1
    `,
    [cleanerId]
  );

  const row = rows?.[0];
  if (!row) return null;

  return {
    average_rating: Number(row.average_rating || 0),
    total_reviews: Number(row.total_reviews || 0)
  };
};

const getCleanerDashboard = async (req, res, next) => {
  try {
    const rawCleanerId = toPositiveInt(req.user?.user_id);
    if (!rawCleanerId) {
      return res.status(200).json({
        success: true,
        data: {
          stats: {
            today_jobs: 0,
            pending_jobs: 0,
            completed_jobs: 0,
            total_earnings: 0,
            average_rating: 0,
            total_reviews: 0
          },
          upcoming_jobs: []
        }
      });
    }

    const promiseDb = db.promise();
    let cleanerProfileStats = null;
    const identity = await resolveCleanerIdentity(promiseDb, req.user);
    const cleanerIds = identity.cleanerIds.length ? identity.cleanerIds : [rawCleanerId];
    const cleanerProfileId = identity.cleanerProfileId || rawCleanerId;
    const inClause = buildSqlInClause(cleanerIds);
    const todaySqlDate = toSqlDateString(new Date());
    const statusInClause = buildSqlInClause(TODAY_SCHEDULE_BOOKING_STATUSES);
    const userColumns = await getTableColumns(promiseDb, 'users');
    const customerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('Customer #', b.user_id)`);

    if (cleanerProfileId) {
      cleanerProfileStats = await getCleanerProfileStats(promiseDb, cleanerProfileId);
    }

    const [
      [todayJobsRows],
      [pendingJobsRows],
      [completedJobsRows],
      [totalEarningsRows],
      [averageRatingRows]
    ] = await Promise.all([
      promiseDb.query(
        `
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE cleaner_id IN (${inClause})
            AND DATE(booking_date) = ?
            AND LOWER(COALESCE(booking_status, '')) IN (${statusInClause})
        `,
        [...cleanerIds, todaySqlDate, ...TODAY_SCHEDULE_BOOKING_STATUSES]
      ),
      promiseDb.query(
        `
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE cleaner_id IN (${inClause})
            AND LOWER(COALESCE(booking_status, '')) = 'pending'
        `,
        cleanerIds
      ),
      promiseDb.query(
        `
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE cleaner_id IN (${inClause})
            AND LOWER(COALESCE(booking_status, '')) = 'completed'
        `,
        cleanerIds
      ),
      promiseDb.query(
        `
          SELECT COALESCE(SUM(p.amount), 0) AS total
          FROM payments p
          JOIN bookings b ON b.booking_id = p.booking_id
          WHERE b.cleaner_id IN (${inClause})
            AND LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
        `,
        cleanerIds
      ),
      promiseDb.query(
        `
          SELECT ROUND(AVG(r.rating), 2) AS average_rating
          FROM reviews r
          WHERE r.cleaner_id IN (${inClause})
        `,
        cleanerIds
      )
    ]);

    const profileAverageRating = Number(cleanerProfileStats?.average_rating || 0);
    const reviewAverageRating = Number(averageRatingRows?.[0]?.average_rating || 0);
    const resolvedAverageRating = profileAverageRating > 0 ? profileAverageRating : reviewAverageRating;

    const [upcomingJobRows] = await promiseDb.query(
      `
        SELECT
          b.booking_id,
          b.booking_date,
          b.booking_time,
          b.booking_status,
          b.total_price,
          b.negotiated_price,
          b.address,
          b.user_id,
          b.service_id,
          ${customerNameExpr} AS customer_name,
          u.phone_number AS customer_phone,
          s.name AS service_name
        FROM bookings b
        LEFT JOIN users u ON u.user_id = b.user_id
        LEFT JOIN services s ON s.service_id = b.service_id
        WHERE b.cleaner_id IN (${inClause})
          AND DATE(b.booking_date) = ?
          AND LOWER(COALESCE(b.booking_status, '')) IN (${statusInClause})
        ORDER BY b.booking_date ASC, b.booking_time ASC, b.booking_id ASC
        LIMIT 5
      `,
      [...cleanerIds, todaySqlDate, ...TODAY_SCHEDULE_BOOKING_STATUSES]
    );

    res.status(200).json({
      success: true,
      data: {
        stats: {
          today_jobs: Number(todayJobsRows?.[0]?.total || 0),
          pending_jobs: Number(pendingJobsRows?.[0]?.total || 0),
          completed_jobs: Number(completedJobsRows?.[0]?.total || 0),
          total_earnings: Number(totalEarningsRows?.[0]?.total || 0),
          average_rating: resolvedAverageRating || 0,
          total_reviews: Number(cleanerProfileStats?.total_reviews || 0)
        },
        upcoming_jobs: (upcomingJobRows || []).map(mapDashboardJobRow)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCleanerJobs = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { page, limit, offset } = normalizePagination(req.query?.page, req.query?.limit);
    const promiseDb = db.promise();
    const identity = await resolveCleanerIdentity(promiseDb, req.user);
    const cleanerIds = identity.cleanerIds.length ? identity.cleanerIds : [toPositiveInt(req.user?.user_id)].filter(Boolean);
    const userColumns = await getTableColumns(promiseDb, 'users');
    const customerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('Customer #', b.user_id)`);

    if (!cleanerIds.length) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, pages: 0 }
      });
    }

    const inClause = buildSqlInClause(cleanerIds);
    const params = [...cleanerIds];
    const whereClauses = [`b.cleaner_id IN (${inClause})`];
    if (status) {
      whereClauses.push('LOWER(COALESCE(b.booking_status, \'\')) = LOWER(?)');
      params.push(status);
    } else {
      whereClauses.push(`LOWER(COALESCE(b.booking_status, '')) <> 'pending'`);
    }
    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const [jobRows] = await promiseDb.query(
      `
        SELECT
          b.booking_id,
          b.booking_date,
          b.booking_time,
          b.booking_status,
          b.created_at,
          b.updated_at,
          b.total_price,
          b.negotiated_price,
          b.payment_status,
          b.address,
          b.user_id,
          b.service_id,
          ${customerNameExpr} AS customer_name,
          u.phone_number AS customer_phone,
          u.email AS customer_email,
          u.avatar AS customer_avatar,
          s.name AS service_name,
          ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
          s.description AS service_description
        FROM bookings b
        LEFT JOIN users u ON u.user_id = b.user_id
        LEFT JOIN services s ON s.service_id = b.service_id
        ${whereSql}
        ORDER BY b.booking_date ASC
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
      data: (jobRows || []).map(mapCleanerJobRow),
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

const updateJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const bookingId = toPositiveInt(id);
    const nextStatus = String(status || '').trim().toLowerCase();
    const promiseDb = db.promise();
    const identity = await resolveCleanerIdentity(promiseDb, req.user);
    const cleanerIds = identity.cleanerIds.length ? identity.cleanerIds : [toPositiveInt(req.user?.user_id)].filter(Boolean);

    if (!bookingId) {
      return next(new AppError('Invalid booking id', 400));
    }
    if (!nextStatus) {
      return next(new AppError('Status is required', 400));
    }
    if (!cleanerIds.length) {
      return next(new AppError('Unauthorized', 401));
    }

    const inClause = buildSqlInClause(cleanerIds);
    const [result] = await promiseDb.query(
      `
        UPDATE bookings
        SET booking_status = ?
        WHERE booking_id = ?
          AND cleaner_id IN (${inClause})
      `,
      [nextStatus, bookingId, ...cleanerIds]
    );

    if (!result?.affectedRows) {
      return next(new AppError('Booking not found or not assigned to this cleaner', 404));
    }

    const [rows] = await promiseDb.query(
      `
        SELECT booking_id, cleaner_id, booking_status
        FROM bookings
        WHERE booking_id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    res.status(200).json({
      success: true,
      message: 'Job status updated',
      data: rows?.[0] || {
        booking_id: bookingId,
        booking_status: nextStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCleanerDashboard,
  getCleanerJobs,
  updateJobStatus
};
