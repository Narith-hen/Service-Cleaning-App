const db = require('../../config/db');
const { ADMIN_EARNING_PER_PAID_BOOKING } = require('../../constants/adminRevenue');

const DAY_MS = 24 * 60 * 60 * 1000;
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

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const pad = (value) => String(value).padStart(2, '0');

const toDateKey = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toMonthKey = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

const toYearKey = (date) => {
  return String(date.getFullYear());
};

const formatTimelineLabel = (date, range) => {
  if (range === 'total') {
    return String(date.getFullYear());
  }

  if (range === 'week') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  return date.toLocaleDateString('en-US', { month: 'short' });
};

const resolveRangeConfig = (rangeValue) => {
  const normalized = String(rangeValue || 'month').trim().toLowerCase();
  const now = new Date();
  const end = endOfDay(now);

  if (normalized === 'week') {
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const currentStart = startOfDay(addDays(now, mondayOffset));
    const currentEnd = endOfDay(addDays(currentStart, 6));
    const previousStart = startOfDay(addDays(currentStart, -7));
    const previousEnd = endOfDay(addDays(previousStart, 6));
    return {
      range: 'week',
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      interval: 'day'
    };
  }

  if (normalized === 'total') {
    const currentStart = startOfDay(new Date(now.getFullYear() - 6, 0, 1));
    const previousStart = startOfDay(new Date(now.getFullYear() - 13, 0, 1));
    const previousEnd = endOfDay(new Date(now.getFullYear() - 7, 11, 31));
    return {
      range: 'total',
      currentStart,
      currentEnd: end,
      previousStart,
      previousEnd,
      interval: 'year'
    };
  }

  const currentStart = startOfDay(new Date(now.getFullYear(), 0, 1));
  const previousStart = startOfDay(new Date(now.getFullYear() - 1, 0, 1));
  const previousEnd = endOfDay(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
  return {
    range: 'month',
    currentStart,
    currentEnd: end,
    previousStart,
    previousEnd,
    interval: 'month'
  };
};

const buildTimelineSkeleton = (config) => {
  const items = [];

  if (config.interval === 'year') {
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(config.currentStart.getFullYear() + index, 0, 1);
      items.push({
        key: toYearKey(date),
        label: formatTimelineLabel(date, config.range),
        revenue: 0,
        bookings: 0,
        completed: 0,
        cancelled: 0
      });
    }
    return items;
  }

  if (config.interval === 'month') {
    for (let index = 0; index < 12; index += 1) {
      const date = addMonths(config.currentStart, index);
      items.push({
        key: toMonthKey(date),
        label: formatTimelineLabel(date, config.range),
        revenue: 0,
        bookings: 0,
        completed: 0,
        cancelled: 0
      });
    }
    return items;
  }

  const totalDays = Math.round((config.currentEnd.getTime() - config.currentStart.getTime()) / DAY_MS) + 1;
  for (let index = 0; index < totalDays; index += 1) {
    const date = addDays(config.currentStart, index);
    items.push({
      key: toDateKey(date),
      label: formatTimelineLabel(date, config.range),
      revenue: 0,
      bookings: 0,
      completed: 0,
      cancelled: 0
    });
  }
  return items;
};

const buildPaymentDateExpression = (paymentColumns) => {
  const candidates = [];
  if (paymentColumns.has('cleaner_confirmed_at')) candidates.push('p.cleaner_confirmed_at');
  if (paymentColumns.has('receipt_uploaded_at')) candidates.push('p.receipt_uploaded_at');
  if (paymentColumns.has('created_at')) candidates.push('p.created_at');
  candidates.push('b.created_at');
  return `COALESCE(${candidates.join(', ')})`;
};

const getTimelineBucketExpression = (dateExpression, interval) => {
  if (interval === 'year') {
    return `YEAR(${dateExpression})`;
  }

  if (interval === 'month') {
    return `DATE_FORMAT(${dateExpression}, '%Y-%m')`;
  }

  return `DATE(${dateExpression})`;
};

const calculateGrowth = (currentValue, previousValue) => {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const normalizeStatusKey = (value) => String(value || 'pending')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(/-/g, '_');

const formatStatusLabel = (value) => String(value || 'pending')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const getRevenueReport = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const userColumns = await getTableColumns(promiseDb, 'users');
    const paymentColumns = await getTableColumns(promiseDb, 'payments');
    const rangeConfig = resolveRangeConfig(req.query?.range);
    const paymentDateExpression = buildPaymentDateExpression(paymentColumns);
    const customerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('Customer #', b.user_id)`);
    const cleanerNameExpr = buildUserNameExpression('c', userColumns, 'NULL');
    const cleanerEmailExpr = userColumns.has('email') ? 'c.email' : 'NULL';
    const customerAvatarExpr = userColumns.has('avatar') ? 'u.avatar' : 'NULL';
    const cleanerAvatarExpr = userColumns.has('avatar') ? 'c.avatar' : 'NULL';

    const [
      [currentSummaryRows],
      [previousSummaryRows],
      [timelineRows],
      [topServiceRows],
      [recentTransactionRows]
    ] = await Promise.all([
      promiseDb.query(
        `
          SELECT
            COALESCE(COUNT(DISTINCT b.booking_id), 0) * ? AS total_revenue,
            COUNT(DISTINCT b.booking_id) AS paid_bookings
          FROM payments p
          LEFT JOIN bookings b ON b.booking_id = p.booking_id
          WHERE LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
            AND ${paymentDateExpression} BETWEEN ? AND ?
        `,
        [ADMIN_EARNING_PER_PAID_BOOKING, rangeConfig.currentStart, rangeConfig.currentEnd]
      ),
      promiseDb.query(
        `
          SELECT
            COALESCE(COUNT(DISTINCT b.booking_id), 0) * ? AS total_revenue,
            COUNT(DISTINCT b.booking_id) AS paid_bookings
          FROM payments p
          LEFT JOIN bookings b ON b.booking_id = p.booking_id
          WHERE LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
            AND ${paymentDateExpression} BETWEEN ? AND ?
        `,
        [ADMIN_EARNING_PER_PAID_BOOKING, rangeConfig.previousStart, rangeConfig.previousEnd]
      ),
      promiseDb.query(
        `
          SELECT
            ${getTimelineBucketExpression(paymentDateExpression, rangeConfig.interval)} AS bucket,
            COALESCE(COUNT(DISTINCT b.booking_id), 0) * ? AS total_revenue,
            COUNT(DISTINCT b.booking_id) AS paid_bookings
          FROM payments p
          LEFT JOIN bookings b ON b.booking_id = p.booking_id
          WHERE LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
            AND ${paymentDateExpression} BETWEEN ? AND ?
          GROUP BY bucket
          ORDER BY bucket ASC
        `,
        [ADMIN_EARNING_PER_PAID_BOOKING, rangeConfig.currentStart, rangeConfig.currentEnd]
      ),
      promiseDb.query(
        `
          SELECT
            s.service_id,
            COALESCE(s.name, 'Cleaning Service') AS service_name,
            MAX(${SERVICE_IMAGE_SELECT_SQL}) AS service_image,
            COALESCE(COUNT(DISTINCT b.booking_id), 0) * ? AS total_revenue,
            COUNT(DISTINCT b.booking_id) AS bookings_count
          FROM payments p
          LEFT JOIN bookings b ON b.booking_id = p.booking_id
          LEFT JOIN services s ON s.service_id = b.service_id
          WHERE LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
            AND ${paymentDateExpression} BETWEEN ? AND ?
          GROUP BY s.service_id, service_name
          ORDER BY total_revenue DESC, bookings_count DESC
          LIMIT 5
        `,
        [ADMIN_EARNING_PER_PAID_BOOKING, rangeConfig.currentStart, rangeConfig.currentEnd]
      ),
      promiseDb.query(
        `
          SELECT
            b.booking_id,
            COALESCE(p.amount, 0) AS amount,
            p.payment_method,
            p.payment_status,
            ${paymentDateExpression} AS paid_at,
            COALESCE(s.name, 'Cleaning Service') AS service_name,
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
            ${customerNameExpr} AS customer_name,
            u.email AS customer_email,
            ${customerAvatarExpr} AS customer_avatar,
            COALESCE(NULLIF(cp.company_name, ''), ${cleanerNameExpr}, CONCAT('Cleaner #', b.cleaner_id)) AS cleaner_name,
            COALESCE(NULLIF(cp.company_email, ''), ${cleanerEmailExpr}) AS cleaner_email,
            COALESCE(cp.profile_image, ${cleanerAvatarExpr}) AS cleaner_avatar
          FROM payments p
          LEFT JOIN bookings b ON b.booking_id = p.booking_id
          LEFT JOIN services s ON s.service_id = b.service_id
          LEFT JOIN users u ON u.user_id = b.user_id
          LEFT JOIN users c ON c.user_id = b.cleaner_id
          LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
          WHERE LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
            AND ${paymentDateExpression} BETWEEN ? AND ?
          ORDER BY paid_at DESC
          LIMIT 8
        `,
        [rangeConfig.currentStart, rangeConfig.currentEnd]
      )
    ]);

    const timelineTemplate = buildTimelineSkeleton(rangeConfig);
    const timelineMap = new Map(timelineTemplate.map((item) => [item.key, item]));

    (timelineRows || []).forEach((row) => {
      const key = String(row.bucket || '');
      const existing = timelineMap.get(key);
      if (!existing) return;
      existing.revenue = Number(row.total_revenue || 0);
      existing.bookings = Number(row.paid_bookings || 0);
    });

    const currentRevenue = Number(currentSummaryRows?.[0]?.total_revenue || 0);
    const currentBookings = Number(currentSummaryRows?.[0]?.paid_bookings || 0);
    const previousRevenue = Number(previousSummaryRows?.[0]?.total_revenue || 0);

    res.status(200).json({
      success: true,
      data: {
        range: rangeConfig.range,
        stats: {
          total_revenue: currentRevenue,
          paid_bookings: currentBookings,
          average_order_value: currentBookings > 0 ? Number((currentRevenue / currentBookings).toFixed(2)) : 0,
          revenue_growth: calculateGrowth(currentRevenue, previousRevenue)
        },
        timeline: timelineTemplate.map((item) => ({
          label: item.label,
          revenue: item.revenue,
          bookings: item.bookings
        })),
        top_services: (topServiceRows || []).map((row) => ({
          service_id: row.service_id == null ? null : Number(row.service_id),
          service_name: row.service_name || 'Cleaning Service',
          service_image: row.service_image || null,
          total_revenue: Number(row.total_revenue || 0),
          bookings_count: Number(row.bookings_count || 0)
        })),
        recent_transactions: (recentTransactionRows || []).map((row) => ({
          booking_id: Number(row.booking_id || 0),
          amount: Number(row.amount || 0),
          payment_method: row.payment_method || null,
          payment_status: row.payment_status || null,
          paid_at: row.paid_at || null,
          service_name: row.service_name || 'Cleaning Service',
          service_image: row.service_image || null,
          customer_name: row.customer_name || 'Customer',
          customer_email: row.customer_email || null,
          customer_avatar: row.customer_avatar || null,
          cleaner_name: row.cleaner_name || 'Cleaner pending',
          cleaner_email: row.cleaner_email || null,
          cleaner_avatar: row.cleaner_avatar || null
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPerformanceReport = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const userColumns = await getTableColumns(promiseDb, 'users');
    const cleanerProfileColumns = await getTableColumns(promiseDb, 'cleaner_profile');
    const rangeConfig = resolveRangeConfig(req.query?.range);
    const cleanerNameExpr = buildUserNameExpression('u', userColumns, `CONCAT('Cleaner #', cp.cleaner_id)`);
    const cleanerAvatarExpr = userColumns.has('avatar') ? 'u.avatar' : 'NULL';
    const cleanerEmailExpr = userColumns.has('email') ? 'u.email' : 'NULL';
    const completionExpr = `
      CASE
        WHEN LOWER(COALESCE(b.service_status, '')) = 'completed' THEN 1
        WHEN LOWER(COALESCE(b.booking_status, '')) = 'completed' THEN 1
        ELSE 0
      END
    `;
    const cancellationExpr = `
      CASE
        WHEN LOWER(COALESCE(b.service_status, '')) = 'cancelled' THEN 1
        WHEN LOWER(COALESCE(b.booking_status, '')) = 'cancelled' THEN 1
        ELSE 0
      END
    `;

    const [
      [bookingSummaryRows],
      [activeCleanerRows],
      [ratingRows],
      [timelineRows],
      [topCleanerRows],
      [serviceRows],
      [statusRows]
    ] = await Promise.all([
      promiseDb.query(
        `
          SELECT
            COUNT(*) AS total_bookings,
            SUM(${completionExpr}) AS completed_bookings,
            SUM(${cancellationExpr}) AS cancelled_bookings,
            SUM(
              CASE
                WHEN LOWER(COALESCE(b.service_status, b.booking_status, 'pending')) IN ('pending', 'confirmed', 'in_progress', 'started', 'booked', 'payment_required')
                  THEN 1
                ELSE 0
              END
            ) AS open_bookings
          FROM bookings b
          WHERE b.created_at BETWEEN ? AND ?
        `,
        [rangeConfig.currentStart, rangeConfig.currentEnd]
      ),
      promiseDb.query(
        `
          SELECT COUNT(*) AS active_cleaners
          FROM cleaner_profile cp
          WHERE LOWER(COALESCE(cp.status, 'active')) = 'active'
        `
      ),
      promiseDb.query(
        `
          SELECT COALESCE(ROUND(AVG(r.rating), 2), 0) AS average_rating
          FROM reviews r
          WHERE r.created_at BETWEEN ? AND ?
        `,
        [rangeConfig.currentStart, rangeConfig.currentEnd]
      ),
      promiseDb.query(
        `
          SELECT
            ${getTimelineBucketExpression('b.created_at', rangeConfig.interval)} AS bucket,
            COUNT(*) AS total_bookings,
            SUM(${completionExpr}) AS completed_bookings,
            SUM(${cancellationExpr}) AS cancelled_bookings
          FROM bookings b
          WHERE b.created_at BETWEEN ? AND ?
          GROUP BY bucket
          ORDER BY bucket ASC
        `,
        [rangeConfig.currentStart, rangeConfig.currentEnd]
      ),
      promiseDb.query(
        `
          SELECT
            cp.cleaner_id,
            COALESCE(NULLIF(cp.company_name, ''), ${cleanerNameExpr}) AS cleaner_name,
            COALESCE(NULLIF(cp.company_email, ''), ${cleanerEmailExpr}) AS cleaner_email,
            COALESCE(cp.profile_image, ${cleanerAvatarExpr}) AS cleaner_avatar,
            COUNT(CASE WHEN LOWER(COALESCE(b.service_status, b.booking_status, '')) = 'completed' THEN 1 END) AS completed_jobs,
            COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
            COUNT(DISTINCT r.review_id) AS total_reviews
          FROM cleaner_profile cp
          LEFT JOIN users u ON u.user_id = cp.cleaner_id
          LEFT JOIN bookings b ON b.cleaner_id = cp.cleaner_id
            AND b.created_at BETWEEN ? AND ?
          LEFT JOIN reviews r ON r.cleaner_id = cp.cleaner_id
          GROUP BY cp.cleaner_id, cleaner_name, cleaner_email, cleaner_avatar
          ORDER BY completed_jobs DESC, average_rating DESC, total_reviews DESC
          LIMIT 5
        `,
        [rangeConfig.currentStart, rangeConfig.currentEnd]
      ),
      promiseDb.query(
        `
          SELECT
            s.service_id,
            COALESCE(s.name, 'Cleaning Service') AS service_name,
            COUNT(b.booking_id) AS total_bookings,
            SUM(${completionExpr}) AS completed_bookings,
            COALESCE(SUM(COALESCE(b.negotiated_price, b.total_price, 0)), 0) AS total_value
          FROM services s
          LEFT JOIN bookings b ON b.service_id = s.service_id
            AND b.created_at BETWEEN ? AND ?
          GROUP BY s.service_id, service_name
          HAVING COUNT(b.booking_id) > 0
          ORDER BY completed_bookings DESC, total_bookings DESC, total_value DESC
          LIMIT 5
        `,
        [rangeConfig.currentStart, rangeConfig.currentEnd]
      ),
      promiseDb.query(
        `
          SELECT
            COALESCE(NULLIF(LOWER(b.service_status), ''), LOWER(COALESCE(b.booking_status, 'pending'))) AS status_key,
            COUNT(*) AS total
          FROM bookings b
          WHERE b.created_at BETWEEN ? AND ?
          GROUP BY status_key
        `,
        [rangeConfig.currentStart, rangeConfig.currentEnd]
      )
    ]);

    const timelineTemplate = buildTimelineSkeleton(rangeConfig);
    const timelineMap = new Map(timelineTemplate.map((item) => [item.key, item]));

    (timelineRows || []).forEach((row) => {
      const key = String(row.bucket || '');
      const existing = timelineMap.get(key);
      if (!existing) return;
      existing.bookings = Number(row.total_bookings || 0);
      existing.completed = Number(row.completed_bookings || 0);
      existing.cancelled = Number(row.cancelled_bookings || 0);
    });

    const totalBookings = Number(bookingSummaryRows?.[0]?.total_bookings || 0);
    const completedBookings = Number(bookingSummaryRows?.[0]?.completed_bookings || 0);
    const cancelledBookings = Number(bookingSummaryRows?.[0]?.cancelled_bookings || 0);

    res.status(200).json({
      success: true,
      data: {
        range: rangeConfig.range,
        stats: {
          total_bookings: totalBookings,
          completed_bookings: completedBookings,
          cancelled_bookings: cancelledBookings,
          open_bookings: Number(bookingSummaryRows?.[0]?.open_bookings || 0),
          active_cleaners: Number(activeCleanerRows?.[0]?.active_cleaners || 0),
          average_rating: Number(ratingRows?.[0]?.average_rating || 0),
          completion_rate: totalBookings > 0 ? Number(((completedBookings / totalBookings) * 100).toFixed(1)) : 0
        },
        timeline: timelineTemplate.map((item) => ({
          label: item.label,
          bookings: item.bookings,
          completed: item.completed,
          cancelled: item.cancelled
        })),
        top_cleaners: (topCleanerRows || []).map((row) => ({
          cleaner_id: Number(row.cleaner_id || 0),
          cleaner_name: row.cleaner_name || 'Cleaner',
          cleaner_email: row.cleaner_email || null,
          cleaner_avatar: row.cleaner_avatar || null,
          completed_jobs: Number(row.completed_jobs || 0),
          average_rating: Number(row.average_rating || 0),
          total_reviews: Number(row.total_reviews || 0)
        })),
        service_performance: (serviceRows || []).map((row) => {
          const total = Number(row.total_bookings || 0);
          const completed = Number(row.completed_bookings || 0);
          return {
            service_id: Number(row.service_id || 0),
            service_name: row.service_name || 'Cleaning Service',
            total_bookings: total,
            completed_bookings: completed,
            total_value: Number(row.total_value || 0),
            completion_rate: total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0
          };
        }),
        status_breakdown: (statusRows || []).map((row) => ({
          status_key: normalizeStatusKey(row.status_key),
          status_label: formatStatusLabel(normalizeStatusKey(row.status_key)),
          total: Number(row.total || 0)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRevenueReport,
  getPerformanceReport
};
