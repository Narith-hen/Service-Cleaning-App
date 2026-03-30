const db = require('../../config/db');

const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeView = (value) => {
  const normalized = String(value || 'month').trim().toLowerCase();
  if (['day', 'week', 'month', 'month_days', 'total'].includes(normalized)) return normalized;
  return 'month';
};

const getTableColumns = async (promiseDb, tableName) => {
  const [rows] = await promiseDb.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return new Set((rows || []).map((row) => String(row.Field || '').toLowerCase()));
};

const startOfDay = (value = new Date()) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (value = new Date()) => {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
};

const addDays = (value, days) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const pad = (value) => String(value).padStart(2, '0');

const toDateKey = (value) => {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const formatShortDate = (value) => {
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatHourLabel = (hour) => {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 || 12;
  return `${normalized} ${suffix}`;
};

const buildAmountExpression = (bookingColumns) => {
  const candidates = ['p.amount'];
  if (bookingColumns.has('negotiated_price')) candidates.push('b.negotiated_price');
  if (bookingColumns.has('total_price')) candidates.push('b.total_price');
  return `COALESCE(${candidates.join(', ')}, 0)`;
};

const buildRecordedAtExpression = ({ paymentColumns, bookingColumns }) => {
  const candidates = [];
  if (paymentColumns.has('cleaner_confirmed_at')) candidates.push('p.cleaner_confirmed_at');
  if (paymentColumns.has('receipt_uploaded_at')) candidates.push('p.receipt_uploaded_at');
  if (paymentColumns.has('created_at')) candidates.push('p.created_at');
  if (bookingColumns.has('completed_at')) candidates.push('b.completed_at');
  if (bookingColumns.has('booking_date')) candidates.push('b.booking_date');
  if (bookingColumns.has('created_at')) candidates.push('b.created_at');
  return `COALESCE(${candidates.join(', ')})`;
};

const buildCleanerEarningsWhere = ({ cleanerId, from, to, dateExpr }) => {
  const where = [
    'b.cleaner_id = ?',
    "LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')"
  ];
  const params = [cleanerId];

  if (from) {
    where.push(`${dateExpr} >= ?`);
    params.push(from);
  }

  if (to) {
    where.push(`${dateExpr} <= ?`);
    params.push(to);
  }

  return {
    whereSql: `WHERE ${where.join(' AND ')}`,
    params
  };
};

const buildSummaryQuery = ({ view, dateExpr }) => {
  if (view === 'day') {
    return {
      groupExpr: `HOUR(${dateExpr})`,
      orderExpr: `HOUR(${dateExpr})`,
      startDate: startOfDay(new Date())
    };
  }

  if (view === 'week') {
    const startDate = startOfDay(addDays(new Date(), -6));
    return {
      groupExpr: `DATE(${dateExpr})`,
      orderExpr: `DATE(${dateExpr})`,
      startDate
    };
  }

  if (view === 'total') {
    const startDate = startOfDay(new Date(new Date().getFullYear() - 6, 0, 1));
    return {
      groupExpr: `YEAR(${dateExpr})`,
      orderExpr: `YEAR(${dateExpr})`,
      startDate
    };
  }

  if (view === 'month_days') {
    const now = new Date();
    return {
      groupExpr: `DAY(${dateExpr})`,
      orderExpr: `DAY(${dateExpr})`,
      startDate: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
    };
  }

  const now = new Date();
  return {
    groupExpr: `MONTH(${dateExpr})`,
    orderExpr: `MONTH(${dateExpr})`,
    startDate: startOfDay(new Date(now.getFullYear(), 0, 1))
  };
};

const buildEmptyRollups = () => ({
  collection_window: {
    start_label: '12:00 AM',
    end_label: '11:59 PM',
    is_active: true
  },
  daily_total: 0,
  today_window_total: 0,
  weekly_total: 0,
  monthly_total: 0,
  daily_breakdown: Array.from({ length: 24 }, (_, hour) => ({
    bucket: hour,
    label: formatHourLabel(hour),
    total: 0
  })),
  weekly_breakdown: Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startOfDay(addDays(new Date(), -6)), index);
    return {
      bucket: index + 1,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      period_label: formatShortDate(date),
      total: 0
    };
  }),
  monthly_breakdown: Array.from({ length: 4 }, (_, index) => {
    const start = startOfDay(addDays(new Date(), -27 + (index * 7)));
    const end = endOfDay(addDays(start, 6));
    return {
      bucket: index + 1,
      label: `Week ${index + 1}`,
      period_label: `${formatShortDate(start)} - ${formatShortDate(end)}`,
      total: 0
    };
  }),
  last_updated_at: new Date().toISOString()
});

const mapRecentPaymentRow = (row) => ({
  payment_id: Number(row?.payment_id || 0),
  amount: Number(row?.amount || 0),
  payment_method: row?.payment_method || null,
  payment_status: row?.payment_status || null,
  created_at: row?.recorded_at || row?.booking_date || null,
  booking_id: Number(row?.booking_id || 0),
  booking: {
    booking_id: Number(row?.booking_id || 0),
    booking_date: row?.booking_date || null,
    total_price: Number(row?.total_price || 0),
    service: {
      service_id: Number(row?.service_id || 0),
      name: row?.service_name || 'Cleaning Service'
    },
    user: {
      user_id: Number(row?.user_id || 0),
      username: row?.customer_name || `Customer #${row?.user_id || ''}`
    }
  }
});

const buildRollupsFromRows = (rows = []) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfDay(addDays(now, -6));
  const monthStart = startOfDay(addDays(now, -27));
  const payload = buildEmptyRollups();
  payload.last_updated_at = new Date().toISOString();

  const weeklyIndexByDate = new Map(
    payload.weekly_breakdown.map((item, index) => {
      const date = addDays(weekStart, index);
      return [toDateKey(date), index];
    })
  );

  for (const row of rows || []) {
    const recordedAt = normalizeDate(row?.recorded_at);
    const amount = Number(row?.amount || 0);
    if (!recordedAt || !Number.isFinite(amount) || amount <= 0) continue;

    const recordedDayStart = startOfDay(recordedAt);
    const dayKey = toDateKey(recordedDayStart);

    if (recordedAt >= todayStart && recordedAt <= todayEnd) {
      const hour = recordedAt.getHours();
      payload.daily_total += amount;
      payload.today_window_total += amount;
      if (payload.daily_breakdown[hour]) {
        payload.daily_breakdown[hour].total += amount;
      }
    }

    const weeklyIndex = weeklyIndexByDate.get(dayKey);
    if (weeklyIndex !== undefined) {
      payload.weekly_total += amount;
      payload.weekly_breakdown[weeklyIndex].total += amount;
    }

    if (recordedAt >= monthStart && recordedAt <= todayEnd) {
      const diffDays = Math.floor((recordedDayStart.getTime() - monthStart.getTime()) / DAY_MS);
      const monthBucket = Math.floor(diffDays / 7);
      if (monthBucket >= 0 && monthBucket < payload.monthly_breakdown.length) {
        payload.monthly_total += amount;
        payload.monthly_breakdown[monthBucket].total += amount;
      }
    }
  }

  return payload;
};

const getEarnings = async (req, res, next) => {
  try {
    const cleanerId = Number(req.user?.user_id || 0);
    if (!cleanerId) {
      return res.status(200).json({
        success: true,
        data: {
          total_earnings: 0,
          total_jobs: 0,
          recent_payments: []
        }
      });
    }

    const from = normalizeDate(req.query?.from);
    const to = normalizeDate(req.query?.to);
    const promiseDb = db.promise();
    const [paymentColumns, bookingColumns] = await Promise.all([
      getTableColumns(promiseDb, 'payments'),
      getTableColumns(promiseDb, 'bookings')
    ]);

    const amountExpr = buildAmountExpression(bookingColumns);
    const recordedAtExpr = buildRecordedAtExpression({ paymentColumns, bookingColumns });
    const filters = buildCleanerEarningsWhere({ cleanerId, from, to, dateExpr: recordedAtExpr });

    const [totalRows] = await promiseDb.query(
      `
        SELECT
          COALESCE(SUM(${amountExpr}), 0) AS total_earnings,
          COUNT(*) AS total_jobs
        FROM payments p
        JOIN bookings b ON b.booking_id = p.booking_id
        ${filters.whereSql}
      `,
      filters.params
    );

    const [recentRows] = await promiseDb.query(
      `
        SELECT
          p.payment_id,
          ${amountExpr} AS amount,
          p.payment_method,
          p.payment_status,
          ${recordedAtExpr} AS recorded_at,
          p.booking_id,
          b.booking_date,
          ${bookingColumns.has('total_price') ? 'b.total_price' : 'NULL'} AS total_price,
          u.user_id,
          TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_name,
          s.service_id,
          s.name AS service_name
        FROM payments p
        JOIN bookings b ON b.booking_id = p.booking_id
        LEFT JOIN users u ON u.user_id = b.user_id
        LEFT JOIN services s ON s.service_id = b.service_id
        ${filters.whereSql}
        ORDER BY ${recordedAtExpr} DESC
        LIMIT 20
      `,
      filters.params
    );

    res.status(200).json({
      success: true,
      data: {
        total_earnings: Number(totalRows?.[0]?.total_earnings || 0),
        total_jobs: Number(totalRows?.[0]?.total_jobs || 0),
        recent_payments: (recentRows || []).map(mapRecentPaymentRow)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getEarningsSummary = async (req, res, next) => {
  try {
    const cleanerId = Number(req.user?.user_id || 0);
    const view = normalizeView(req.query?.view);
    if (!cleanerId) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const promiseDb = db.promise();
    const [paymentColumns, bookingColumns] = await Promise.all([
      getTableColumns(promiseDb, 'payments'),
      getTableColumns(promiseDb, 'bookings')
    ]);

    const amountExpr = buildAmountExpression(bookingColumns);
    const recordedAtExpr = buildRecordedAtExpression({ paymentColumns, bookingColumns });
    const summaryConfig = buildSummaryQuery({ view, dateExpr: recordedAtExpr });

    const [rows] = await promiseDb.query(
      `
        SELECT
          ${summaryConfig.groupExpr} AS bucket,
          COALESCE(SUM(${amountExpr}), 0) AS total
        FROM payments p
        JOIN bookings b ON b.booking_id = p.booking_id
        WHERE b.cleaner_id = ?
          AND LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
          AND ${recordedAtExpr} >= ?
        GROUP BY ${summaryConfig.groupExpr}
        ORDER BY ${summaryConfig.orderExpr} ASC
      `,
      [cleanerId, summaryConfig.startDate]
    );

    res.status(200).json({
      success: true,
      view,
      data: (rows || []).map((row) => ({
        bucket: typeof row?.bucket === 'string' ? row.bucket : Number(row?.bucket || 0),
        total: Number(row?.total || 0)
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getEarningsRollups = async (req, res, next) => {
  try {
    const cleanerId = Number(req.user?.user_id || 0);
    if (!cleanerId) {
      return res.status(200).json({
        success: true,
        data: buildEmptyRollups()
      });
    }

    const promiseDb = db.promise();
    const [paymentColumns, bookingColumns] = await Promise.all([
      getTableColumns(promiseDb, 'payments'),
      getTableColumns(promiseDb, 'bookings')
    ]);

    const amountExpr = buildAmountExpression(bookingColumns);
    const recordedAtExpr = buildRecordedAtExpression({ paymentColumns, bookingColumns });
    const monthStart = startOfDay(addDays(new Date(), -27));

    const [rows] = await promiseDb.query(
      `
        SELECT
          ${amountExpr} AS amount,
          ${recordedAtExpr} AS recorded_at
        FROM payments p
        JOIN bookings b ON b.booking_id = p.booking_id
        WHERE b.cleaner_id = ?
          AND LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
          AND ${recordedAtExpr} IS NOT NULL
          AND ${recordedAtExpr} >= ?
        ORDER BY ${recordedAtExpr} ASC
      `,
      [cleanerId, monthStart]
    );

    res.status(200).json({
      success: true,
      data: buildRollupsFromRows(rows || [])
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEarnings,
  getEarningsSummary,
  getEarningsRollups
};
