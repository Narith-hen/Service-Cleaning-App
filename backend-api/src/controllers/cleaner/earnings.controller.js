const db = require('../../config/db');

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

const buildCleanerEarningsWhere = ({ cleanerId, from, to }) => {
  const where = [
    'b.cleaner_id = ?',
    "LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')"
  ];
  const params = [cleanerId];

  if (from) {
    where.push('b.booking_date >= ?');
    params.push(from);
  }

  if (to) {
    where.push('b.booking_date <= ?');
    params.push(to);
  }

  return {
    whereSql: `WHERE ${where.join(' AND ')}`,
    params
  };
};

const buildSummaryQuery = ({ view }) => {
  if (view === 'day') {
    return {
      dateExpr: 'COALESCE(b.booking_date, b.created_at)',
      groupExpr: 'HOUR(COALESCE(b.booking_date, b.created_at))',
      orderExpr: 'HOUR(COALESCE(b.booking_date, b.created_at))',
      startDate: (() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return start;
      })()
    };
  }

  if (view === 'week') {
    return {
      dateExpr: 'DATE(COALESCE(b.booking_date, b.created_at))',
      groupExpr: 'DAYOFWEEK(COALESCE(b.booking_date, b.created_at))',
      orderExpr: 'DAYOFWEEK(COALESCE(b.booking_date, b.created_at))',
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
      dateExpr: 'COALESCE(b.booking_date, b.created_at)',
      groupExpr: 'YEAR(COALESCE(b.booking_date, b.created_at))',
      orderExpr: 'YEAR(COALESCE(b.booking_date, b.created_at))',
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
      dateExpr: 'COALESCE(b.booking_date, b.created_at)',
      groupExpr: 'DAY(COALESCE(b.booking_date, b.created_at))',
      orderExpr: 'DAY(COALESCE(b.booking_date, b.created_at))',
      startDate: (() => {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return start;
      })()
    };
  }

  return {
    dateExpr: 'COALESCE(b.booking_date, b.created_at)',
    groupExpr: 'MONTH(COALESCE(b.booking_date, b.created_at))',
    orderExpr: 'MONTH(COALESCE(b.booking_date, b.created_at))',
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
    const filters = buildCleanerEarningsWhere({ cleanerId, from, to });

    const [totalRows] = await promiseDb.query(
      `
        SELECT
          COALESCE(SUM(p.amount), 0) AS total_earnings,
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
          p.amount,
          p.payment_method,
          p.payment_status,
          COALESCE(b.booking_date, b.created_at) AS recorded_at,
          p.booking_id,
          b.booking_date,
          b.total_price,
          u.user_id,
          TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_name,
          s.service_id,
          s.name AS service_name
        FROM payments p
        JOIN bookings b ON b.booking_id = p.booking_id
        LEFT JOIN users u ON u.user_id = b.user_id
        LEFT JOIN services s ON s.service_id = b.service_id
        ${filters.whereSql}
        ORDER BY COALESCE(b.booking_date, b.created_at) DESC
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
    const summaryConfig = buildSummaryQuery({ view });

    const [rows] = await promiseDb.query(
      `
        SELECT
          ${summaryConfig.groupExpr} AS bucket,
          COALESCE(SUM(p.amount), 0) AS total
        FROM payments p
        JOIN bookings b ON b.booking_id = p.booking_id
        WHERE b.cleaner_id = ?
          AND LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
          AND ${summaryConfig.dateExpr} >= ?
        GROUP BY ${summaryConfig.groupExpr}
        ORDER BY ${summaryConfig.orderExpr} ASC
      `,
      [cleanerId, summaryConfig.startDate]
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

module.exports = {
  getEarnings,
  getEarningsSummary
};
