const db = require('../../config/db');
const AppError = require('../../utils/error.util');

const ALLOWED_PAYMENT_STATUSES = new Set(['pending', 'completed', 'failed', 'refunded', 'paid']);
const ALLOWED_PAYMENT_METHODS = new Set(['cash', 'card', 'transfer', 'wallet']);

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query?.page || 1, 10));
  const limit = Math.min(50, Math.max(1, Number.parseInt(query?.limit || 10, 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const normalizePaymentStatus = (value, defaultStatus = 'pending') => {
  const status = String(value || defaultStatus).trim().toLowerCase();
  return ALLOWED_PAYMENT_STATUSES.has(status) ? status : null;
};

const normalizePaymentMethod = (value) => {
  const method = String(value || '').trim().toLowerCase();
  return ALLOWED_PAYMENT_METHODS.has(method) ? method : null;
};

const isAdminUser = (req) => String(req?.user?.role?.role_name || '').trim().toLowerCase() === 'admin';

const hasAccessToPayment = (req, paymentRow) => {
  if (isAdminUser(req)) return true;
  const currentUserId = Number(req?.user?.user_id);
  return Number.isInteger(currentUserId) && Number(paymentRow?.user_id) === currentUserId;
};

const mapPaymentStatusToBookingStatus = (paymentStatus) => {
  switch (paymentStatus) {
    case 'completed':
    case 'paid':
      return 'paid';
    case 'failed':
      return 'failed';
    case 'refunded':
      return 'refunded';
    case 'pending':
    default:
      return 'pending';
  }
};

const getPaymentByIdWithMeta = async (promiseDb, paymentId) => {
  const [rows] = await promiseDb.query(
    `
      SELECT
        p.payment_id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.booking_id,
        b.user_id,
        b.booking_status,
        b.payment_status AS booking_payment_status,
        b.booking_date,
        b.created_at AS booking_created_at,
        b.total_price,
        b.negotiated_price,
        s.name AS service_name
      FROM payments p
      JOIN bookings b ON b.booking_id = p.booking_id
      LEFT JOIN services s ON s.service_id = b.service_id
      WHERE p.payment_id = ?
      LIMIT 1
    `,
    [paymentId]
  );

  return rows?.[0] || null;
};

const buildPaymentFilters = ({ status, method, userId, from, to, forceUserFilter = false }) => {
  const where = [];
  const params = [];

  if (status) {
    where.push('LOWER(p.payment_status) = LOWER(?)');
    params.push(status);
  }

  if (method) {
    where.push('LOWER(p.payment_method) = LOWER(?)');
    params.push(method);
  }

  if (userId) {
    where.push('b.user_id = ?');
    params.push(userId);
  } else if (forceUserFilter) {
    where.push('1 = 0');
  }

  if (from) {
    where.push('b.booking_date >= ?');
    params.push(new Date(from));
  }

  if (to) {
    where.push('b.booking_date <= ?');
    params.push(new Date(to));
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
};

const listPayments = async (promiseDb, options) => {
  const { page, limit, offset } = normalizePagination(options);
  const filters = buildPaymentFilters(options);

  const [rows] = await promiseDb.query(
    `
      SELECT
        p.payment_id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.booking_id,
        b.user_id,
        b.booking_status,
        b.payment_status AS booking_payment_status,
        b.booking_date,
        b.created_at AS booking_created_at,
        b.total_price,
        b.negotiated_price,
        s.name AS service_name
      FROM payments p
      JOIN bookings b ON b.booking_id = p.booking_id
      LEFT JOIN services s ON s.service_id = b.service_id
      ${filters.whereSql}
      ORDER BY p.payment_id DESC
      LIMIT ? OFFSET ?
    `,
    [...filters.params, limit, offset]
  );

  const [countRows] = await promiseDb.query(
    `
      SELECT COUNT(*) AS total
      FROM payments p
      JOIN bookings b ON b.booking_id = p.booking_id
      ${filters.whereSql}
    `,
    filters.params
  );

  const total = Number(countRows?.[0]?.total || 0);

  return {
    rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const createPayment = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInt(req.body?.booking_id);
    const amount = Number(req.body?.amount);
    const paymentMethod = normalizePaymentMethod(req.body?.payment_method);
    const paymentStatus = normalizePaymentStatus(req.body?.payment_status, 'pending');

    if (!bookingId) return next(new AppError('Valid booking_id is required', 400));
    if (!Number.isFinite(amount) || amount <= 0) return next(new AppError('Valid amount is required', 400));
    if (!paymentMethod) return next(new AppError('Valid payment method is required', 400));
    if (!paymentStatus) return next(new AppError('Invalid payment status', 400));

    const promiseDb = db.promise();
    const [bookingRows] = await promiseDb.query(
      'SELECT booking_id, user_id FROM bookings WHERE booking_id = ? LIMIT 1',
      [bookingId]
    );
    const booking = bookingRows?.[0];
    if (!booking) return next(new AppError('Booking not found', 404));

    if (!isAdminUser(req) && Number(booking.user_id) !== Number(req.user?.user_id)) {
      return next(new AppError('Not authorized for this booking payment', 403));
    }

    const [existingRows] = await promiseDb.query(
      'SELECT payment_id FROM payments WHERE booking_id = ? LIMIT 1',
      [bookingId]
    );
    if (existingRows?.[0]?.payment_id) {
      return next(new AppError('Payment already exists for this booking', 400));
    }

    const [insertResult] = await promiseDb.query(
      `
        INSERT INTO payments (amount, payment_method, payment_status, booking_id)
        VALUES (?, ?, ?, ?)
      `,
      [amount, paymentMethod, paymentStatus, bookingId]
    );

    await promiseDb.query(
      'UPDATE bookings SET payment_status = ? WHERE booking_id = ?',
      [mapPaymentStatusToBookingStatus(paymentStatus), bookingId]
    );

    const payment = await getPaymentByIdWithMeta(promiseDb, insertResult.insertId);

    return res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const status = req.query?.status ? String(req.query.status).trim().toLowerCase() : '';
    const method = req.query?.method ? String(req.query.method).trim().toLowerCase() : '';
    const userId = isAdminUser(req) ? null : parsePositiveInt(req.user?.user_id);
    const forceUserFilter = !isAdminUser(req) && !userId;

    const result = await listPayments(db.promise(), {
      status,
      method,
      page: req.query?.page,
      limit: req.query?.limit,
      userId,
      forceUserFilter,
    });

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const paymentId = parsePositiveInt(req.params?.id);
    if (!paymentId) return next(new AppError('Invalid payment id', 400));

    const payment = await getPaymentByIdWithMeta(db.promise(), paymentId);
    if (!payment) return next(new AppError('Payment not found', 404));
    if (!hasAccessToPayment(req, payment)) return next(new AppError('Not authorized', 403));

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
};

const processPayment = async (req, res, next) => {
  try {
    const paymentId = parsePositiveInt(req.params?.id);
    if (!paymentId) return next(new AppError('Invalid payment id', 400));

    const nextStatus = normalizePaymentStatus(req.body?.payment_status, 'completed');
    if (!nextStatus) return next(new AppError('Invalid payment status', 400));

    const promiseDb = db.promise();
    const payment = await getPaymentByIdWithMeta(promiseDb, paymentId);
    if (!payment) return next(new AppError('Payment not found', 404));
    if (!hasAccessToPayment(req, payment)) return next(new AppError('Not authorized', 403));

    await promiseDb.query(
      'UPDATE payments SET payment_status = ? WHERE payment_id = ?',
      [nextStatus, paymentId]
    );
    await promiseDb.query(
      'UPDATE bookings SET payment_status = ? WHERE booking_id = ?',
      [mapPaymentStatusToBookingStatus(nextStatus), payment.booking_id]
    );

    const updatedPayment = await getPaymentByIdWithMeta(promiseDb, paymentId);
    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: updatedPayment,
    });
  } catch (error) {
    return next(error);
  }
};

const refundPayment = async (req, res, next) => {
  try {
    const paymentId = parsePositiveInt(req.params?.id);
    if (!paymentId) return next(new AppError('Invalid payment id', 400));

    const promiseDb = db.promise();
    const payment = await getPaymentByIdWithMeta(promiseDb, paymentId);
    if (!payment) return next(new AppError('Payment not found', 404));
    if (!hasAccessToPayment(req, payment)) return next(new AppError('Not authorized', 403));

    await promiseDb.query(
      'UPDATE payments SET payment_status = ? WHERE payment_id = ?',
      ['refunded', paymentId]
    );
    await promiseDb.query(
      'UPDATE bookings SET payment_status = ? WHERE booking_id = ?',
      ['refunded', payment.booking_id]
    );

    const updatedPayment = await getPaymentByIdWithMeta(promiseDb, paymentId);
    return res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: updatedPayment,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const paymentId = parsePositiveInt(req.params?.id);
    if (!paymentId) return next(new AppError('Invalid payment id', 400));

    const payment = await getPaymentByIdWithMeta(db.promise(), paymentId);
    if (!payment) return next(new AppError('Payment not found', 404));
    if (!hasAccessToPayment(req, payment)) return next(new AppError('Not authorized', 403));

    const normalizedStatus = String(payment.payment_status || '').trim().toLowerCase();
    const verified = normalizedStatus === 'completed' || normalizedStatus === 'paid';

    return res.status(200).json({
      success: true,
      data: {
        payment_id: payment.payment_id,
        booking_id: payment.booking_id,
        payment_status: payment.payment_status,
        verified,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getUserPayments = async (req, res, next) => {
  try {
    const userId = parsePositiveInt(req.params?.userId);
    if (!userId) return next(new AppError('Invalid user id', 400));

    const result = await listPayments(db.promise(), {
      page: req.query?.page,
      limit: req.query?.limit,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const paymentMethodsNotConfigured = (res) =>
  res.status(200).json({
    success: true,
    message: 'Payment methods are not configured in this backend yet',
    data: [],
  });

const getPaymentMethods = async (req, res, next) => {
  try {
    return paymentMethodsNotConfigured(res);
  } catch (error) {
    return next(error);
  }
};

const addPaymentMethod = async (req, res, next) => {
  try {
    return res.status(201).json({
      success: true,
      message: 'Payment method endpoint is currently running in no-storage mode',
      data: {
        method_id: null,
        type: req.body?.type || null,
        details: req.body?.details || {},
        is_default: Boolean(req.body?.is_default),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const removePaymentMethod = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Payment method endpoint is currently running in no-storage mode',
    });
  } catch (error) {
    return next(error);
  }
};

const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Payment method endpoint is currently running in no-storage mode',
    });
  } catch (error) {
    return next(error);
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const status = req.query?.status ? String(req.query.status).trim().toLowerCase() : '';
    const userId = isAdminUser(req) ? null : parsePositiveInt(req.user?.user_id);
    const forceUserFilter = !isAdminUser(req) && !userId;

    const result = await listPayments(db.promise(), {
      status,
      page: req.query?.page,
      limit: req.query?.limit,
      userId,
      from: req.query?.from,
      to: req.query?.to,
      forceUserFilter,
    });

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  processPayment,
  refundPayment,
  verifyPayment,
  getUserPayments,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getPaymentHistory,
};
