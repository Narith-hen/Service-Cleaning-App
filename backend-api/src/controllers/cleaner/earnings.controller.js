const db = require('../../config/db');

const DAILY_HISTORY_LENGTH = 7;
const WEEKLY_HISTORY_LENGTH = 4;
const DAYS_PER_WEEK = 7;
const MONTHLY_WINDOW_DAYS = DAILY_HISTORY_LENGTH * WEEKLY_HISTORY_LENGTH;
const DAY_WINDOW_START_HOUR = 0;
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

const toPositiveInt = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const buildSqlInClause = (values = []) => values.map(() => '?').join(', ');

const getTableColumns = async (promiseDb, tableName) => {
  const [rows] = await promiseDb.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return new Set((rows || []).map((row) => String(row.Field || '').toLowerCase()));
};

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

const getCompletionTimestampExpression = ({ bookingColumns, paymentColumns }) => {
  const candidates = [];

  if (bookingColumns.has('completed_at')) {
    candidates.push('b.completed_at');
  }

  if (paymentColumns.has('cleaner_confirmed_at')) {
    candidates.push('p.cleaner_confirmed_at');
  }

  if (paymentColumns.has('receipt_uploaded_at')) {
    candidates.push('p.receipt_uploaded_at');
  }

  if (bookingColumns.has('booking_date')) {
    candidates.push('b.booking_date');
  }

  if (bookingColumns.has('created_at')) {
    candidates.push('b.created_at');
  }

  return `COALESCE(${candidates.join(', ')})`;
};

const getAmountExpression = ({ bookingColumns }) => {
  const candidates = [];

  if (bookingColumns.has('negotiated_price')) {
    candidates.push('b.negotiated_price');
  }

  if (bookingColumns.has('total_price')) {
    candidates.push('b.total_price');
  }

  candidates.push('p.amount', '0');
  return `COALESCE(${candidates.join(', ')})`;
};

const buildCompletedJobPredicate = ({ bookingColumns, paymentColumns }) => {
  const predicates = [];

  if (bookingColumns.has('service_status')) {
    predicates.push("LOWER(COALESCE(b.service_status, '')) = 'completed'");
  }

  if (bookingColumns.has('booking_status')) {
    predicates.push("LOWER(COALESCE(b.booking_status, '')) = 'completed'");
  }

  if (paymentColumns.has('payment_status') || bookingColumns.has('payment_status')) {
    const paymentCandidates = [];

    if (paymentColumns.has('payment_status')) {
      paymentCandidates.push('p.payment_status');
    }

    if (bookingColumns.has('payment_status')) {
      paymentCandidates.push('b.payment_status');
    }

    predicates.push(
      `LOWER(COALESCE(${paymentCandidates.join(', ')}, '')) IN ('awaiting_receipt', 'receipt_submitted', 'completed', 'paid')`
    );
  }

  return predicates.length ? `(${predicates.join(' OR ')})` : '(1 = 0)';
};

const buildCleanerEarningsWhere = ({ cleanerIds, from, to, completedAtExpr, completedJobPredicate }) => {
  if (!Array.isArray(cleanerIds) || !cleanerIds.length) {
    return {
      whereSql: 'WHERE 1 = 0',
      params: []
    };
  }

  const inClause = buildSqlInClause(cleanerIds);
  const where = [
    `b.cleaner_id IN (${inClause})`,
    completedJobPredicate
  ];
  const params = [...cleanerIds];

  if (from) {
    where.push(`${completedAtExpr} >= ?`);
    params.push(from);
  }

  if (to) {
    where.push(`${completedAtExpr} <= ?`);
    params.push(to);
  }

  return {
    whereSql: `WHERE ${where.join(' AND ')}`,
    params
  };
};

const buildSummaryQuery = ({ view, completedAtExpr }) => {
  if (view === 'day') {
    return {
      dateExpr: completedAtExpr,
      groupExpr: `HOUR(${completedAtExpr})`,
      orderExpr: `HOUR(${completedAtExpr})`,
      startDate: (() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return start;
      })()
    };
  }

  if (view === 'week') {
    return {
      dateExpr: completedAtExpr,
      groupExpr: `DAYOFWEEK(${completedAtExpr})`,
      orderExpr: `DAYOFWEEK(${completedAtExpr})`,
      startDate: (() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const day = start.getDay();
        const offset = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - offset);
        return start;
      })()
    };
  }

  if (view === 'total') {
    return {
      dateExpr: completedAtExpr,
      groupExpr: `YEAR(${completedAtExpr})`,
      orderExpr: `YEAR(${completedAtExpr})`,
      startDate: (() => {
        const start = new Date();
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        start.setFullYear(start.getFullYear() - 6);
        return start;
      })()
    };
  }

  if (view === 'month_days') {
    return {
      dateExpr: completedAtExpr,
      groupExpr: `DAY(${completedAtExpr})`,
      orderExpr: `DAY(${completedAtExpr})`,
      startDate: (() => {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return start;
      })()
    };
  }

  return {
    dateExpr: completedAtExpr,
    groupExpr: `MONTH(${completedAtExpr})`,
    orderExpr: `MONTH(${completedAtExpr})`,
    startDate: (() => {
      const start = new Date();
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      return start;
    })()
  };
};

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

const addDays = (value, days) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWindowDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(DAY_WINDOW_START_HOUR, 0, 0, 0);

  if (new Date(value).getTime() < date.getTime()) {
    date.setDate(date.getDate() - 1);
  }

  return date;
};

const toDateKey = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatShortTime = (hours, minutes = 0) => {
  const normalizedHours = ((hours % 24) + 24) % 24;
  const hour12 = normalizedHours % 12 || 12;
  const meridiem = normalizedHours < 12 ? 'AM' : 'PM';
  const minuteText = String(minutes).padStart(2, '0');
  return `${hour12}:${minuteText} ${meridiem}`;
};

const formatHourLabel = (hours) => {
  const normalizedHours = ((hours % 24) + 24) % 24;
  const hour12 = normalizedHours % 12 || 12;
  const meridiem = normalizedHours < 12 ? 'AM' : 'PM';
  return `${hour12} ${meridiem}`;
};

const formatMonthDay = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const getDifferenceInDays = (start, end) => {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS);
};

const buildDefaultDailyBreakdown = () => {
  return Array.from({ length: 24 }, (_, hour) => ({
    bucket: hour,
    label: formatHourLabel(hour),
    total: 0
  }));
};

const buildDefaultWeeklyBreakdown = (todayWindowStart) => {
  return Array.from({ length: DAILY_HISTORY_LENGTH }, (_, index) => {
    const dayStart = addDays(todayWindowStart, index - (DAILY_HISTORY_LENGTH - 1));
    return {
      bucket: index + 1,
      label: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      period_label: formatMonthDay(dayStart),
      total: 0
    };
  });
};

const buildDefaultMonthlyBreakdown = (monthlyWindowStart) => {
  return Array.from({ length: WEEKLY_HISTORY_LENGTH }, (_, index) => {
    const weekStart = addDays(monthlyWindowStart, index * DAYS_PER_WEEK);
    const weekEnd = addDays(weekStart, DAYS_PER_WEEK - 1);

    return {
      bucket: index + 1,
      label: `Week ${index + 1}`,
      period_label: `${formatMonthDay(weekStart)} - ${formatMonthDay(weekEnd)}`,
      total: 0
    };
  });
};

const getEarningsContext = async (promiseDb, user) => {
  const identity = await resolveCleanerIdentity(promiseDb, user);
  const rawCleanerId = toPositiveInt(user?.user_id);
  const cleanerIds = identity.cleanerIds.length ? identity.cleanerIds : [rawCleanerId].filter(Boolean);
  const [bookingColumns, paymentColumns] = await Promise.all([
    getTableColumns(promiseDb, 'bookings'),
    getTableColumns(promiseDb, 'payments')
  ]);

  return {
    cleanerIds,
    cleanerProfileId: identity.cleanerProfileId || rawCleanerId || null,
    completedAtExpr: getCompletionTimestampExpression({ bookingColumns, paymentColumns }),
    amountExpr: getAmountExpression({ bookingColumns }),
    completedJobPredicate: buildCompletedJobPredicate({ bookingColumns, paymentColumns })
  };
};

const getEarnings = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const context = await getEarningsContext(promiseDb, req.user);

    if (!context.cleanerIds.length) {
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
    const filters = buildCleanerEarningsWhere({
      cleanerIds: context.cleanerIds,
      from,
      to,
      completedAtExpr: context.completedAtExpr,
      completedJobPredicate: context.completedJobPredicate
    });

    const [totalRows] = await promiseDb.query(
      `
        SELECT
          COALESCE(SUM(${context.amountExpr}), 0) AS total_earnings,
          COUNT(DISTINCT b.booking_id) AS total_jobs
        FROM bookings b
        LEFT JOIN payments p ON p.booking_id = b.booking_id
        ${filters.whereSql}
      `,
      filters.params
    );

    const [recentRows] = await promiseDb.query(
      `
        SELECT
          p.payment_id,
          ${context.amountExpr} AS amount,
          p.payment_method,
          COALESCE(p.payment_status, b.payment_status) AS payment_status,
          ${context.completedAtExpr} AS recorded_at,
          b.booking_id,
          b.booking_date,
          b.total_price,
          b.user_id,
          TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_name,
          s.service_id,
          s.name AS service_name
        FROM bookings b
        LEFT JOIN payments p ON p.booking_id = b.booking_id
        LEFT JOIN users u ON u.user_id = b.user_id
        LEFT JOIN services s ON s.service_id = b.service_id
        ${filters.whereSql}
        ORDER BY ${context.completedAtExpr} DESC
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
    const view = normalizeView(req.query?.view);
    const promiseDb = db.promise();
    const context = await getEarningsContext(promiseDb, req.user);

    if (!context.cleanerIds.length) {
      return res.status(200).json({
        success: true,
        view,
        data: []
      });
    }

    const summaryConfig = buildSummaryQuery({
      view,
      completedAtExpr: context.completedAtExpr
    });
    const filters = buildCleanerEarningsWhere({
      cleanerIds: context.cleanerIds,
      from: summaryConfig.startDate,
      to: null,
      completedAtExpr: summaryConfig.dateExpr,
      completedJobPredicate: context.completedJobPredicate
    });

    const [rows] = await promiseDb.query(
      `
        SELECT
          ${summaryConfig.groupExpr} AS bucket,
          COALESCE(SUM(${context.amountExpr}), 0) AS total
        FROM bookings b
        LEFT JOIN payments p ON p.booking_id = b.booking_id
        ${filters.whereSql}
        GROUP BY ${summaryConfig.groupExpr}
        ORDER BY ${summaryConfig.orderExpr} ASC
      `,
      filters.params
    );

    res.status(200).json({
      success: true,
      view,
      data: (rows || []).map((row) => ({
        bucket: Number(row?.bucket || 0),
        total: Number(row?.total || 0)
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getEarningsRollups = async (req, res, next) => {
  try {
    const promiseDb = db.promise();
    const context = await getEarningsContext(promiseDb, req.user);
    const now = new Date();
    const todayWindowStart = startOfWindowDay(now);
    const tomorrowWindowStart = addDays(todayWindowStart, 1);
    const weeklyWindowStart = addDays(todayWindowStart, -(DAILY_HISTORY_LENGTH - 1));
    const monthlyWindowStart = addDays(todayWindowStart, -(MONTHLY_WINDOW_DAYS - 1));
    const dailyBreakdown = buildDefaultDailyBreakdown();
    const weeklyBreakdown = buildDefaultWeeklyBreakdown(todayWindowStart);
    const monthlyBreakdown = buildDefaultMonthlyBreakdown(monthlyWindowStart);

    if (!context.cleanerIds.length) {
      return res.status(200).json({
        success: true,
        data: {
          collection_window: {
            start_label: formatShortTime(DAY_WINDOW_START_HOUR, 0),
            end_label: formatShortTime((DAY_WINDOW_START_HOUR + 23) % 24, 59),
            is_active: true
          },
          daily_total: 0,
          today_window_total: 0,
          weekly_total: 0,
          monthly_total: 0,
          daily_breakdown: dailyBreakdown,
          weekly_breakdown: weeklyBreakdown,
          monthly_breakdown: monthlyBreakdown,
          last_updated_at: now.toISOString()
        }
      });
    }

    const inClause = buildSqlInClause(context.cleanerIds);
    const [rows] = await promiseDb.query(
      `
        SELECT
          ${context.amountExpr} AS amount,
          ${context.completedAtExpr} AS completed_at
        FROM bookings b
        LEFT JOIN payments p ON p.booking_id = b.booking_id
        WHERE b.cleaner_id IN (${inClause})
          AND ${context.completedJobPredicate}
          AND ${context.completedAtExpr} >= ?
          AND ${context.completedAtExpr} < ?
        ORDER BY ${context.completedAtExpr} ASC
      `,
      [...context.cleanerIds, monthlyWindowStart, tomorrowWindowStart]
    );

    const weeklyTotalsByKey = new Map(
      weeklyBreakdown.map((item) => [toDateKey(addDays(weeklyWindowStart, item.bucket - 1)), item])
    );

    for (const row of rows || []) {
      const amount = Number(row?.amount || 0);
      const completedAt = row?.completed_at ? new Date(row.completed_at) : null;

      if (!completedAt || Number.isNaN(completedAt.getTime()) || amount <= 0) {
        continue;
      }

      if (completedAt >= todayWindowStart && completedAt < tomorrowWindowStart) {
        const hour = completedAt.getHours();
        if (dailyBreakdown[hour]) {
          dailyBreakdown[hour].total += amount;
        }
      }

      const completedWindowStart = startOfWindowDay(completedAt);

      if (completedWindowStart >= weeklyWindowStart && completedWindowStart < tomorrowWindowStart) {
        const key = toDateKey(completedWindowStart);
        const item = weeklyTotalsByKey.get(key);
        if (item) {
          item.total += amount;
        }
      }

      if (completedWindowStart >= monthlyWindowStart && completedWindowStart < tomorrowWindowStart) {
        const dayOffset = getDifferenceInDays(monthlyWindowStart, completedWindowStart);
        const weekIndex = Math.floor(dayOffset / DAYS_PER_WEEK);

        if (monthlyBreakdown[weekIndex]) {
          monthlyBreakdown[weekIndex].total += amount;
        }
      }
    }

    const dailyTotal = dailyBreakdown.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const weeklyTotal = weeklyBreakdown.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const monthlyTotal = monthlyBreakdown.reduce((sum, item) => sum + Number(item.total || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        collection_window: {
          start_label: formatShortTime(DAY_WINDOW_START_HOUR, 0),
          end_label: formatShortTime((DAY_WINDOW_START_HOUR + 23) % 24, 59),
          is_active: true
        },
        daily_total: dailyTotal,
        today_window_total: dailyTotal,
        weekly_total: weeklyTotal,
        monthly_total: monthlyTotal,
        daily_breakdown: dailyBreakdown,
        weekly_breakdown: weeklyBreakdown,
        monthly_breakdown: monthlyBreakdown,
        last_updated_at: now.toISOString()
      }
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
