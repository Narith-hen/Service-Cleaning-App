const path = require('path');
const db = require('../../config/db');
const AppError = require('../../utils/error.util');

const ALLOWED_PAYMENT_STATUSES = new Set([
  'pending',
  'awaiting_receipt',
  'receipt_submitted',
  'completed',
  'failed',
  'refunded',
  'paid',
]);
const ALLOWED_PAYMENT_METHODS = new Set(['cash', 'card', 'transfer', 'wallet', 'qr']);

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

const toFiniteAmount = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toReceiptUrl = (file) => {
  if (!file?.filename) return null;
  const folder = path.basename(file.destination || 'misc');
  return `/uploads/${folder}/${file.filename}`.replace(/\\/g, '/');
};

const mapPaymentStatusToBookingStatus = (paymentStatus) => {
  switch (paymentStatus) {
    case 'completed':
    case 'paid':
      return 'paid';
    case 'awaiting_receipt':
      return 'awaiting_receipt';
    case 'receipt_submitted':
      return 'receipt_submitted';
    case 'failed':
      return 'failed';
    case 'refunded':
      return 'refunded';
    case 'pending':
    default:
      return 'pending';
  }
};

const getBookingTableColumns = async (promiseDb) => {
  const [columns] = await promiseDb.query('SHOW COLUMNS FROM bookings');
  return new Set((columns || []).map((column) => column.Field));
};

const getPaymentTableColumns = async (promiseDb) => {
  const [columns] = await promiseDb.query('SHOW COLUMNS FROM payments');
  return new Set((columns || []).map((column) => column.Field));
};

const ensurePaymentWorkflowColumns = async (promiseDb) => {
  const paymentColumns = await getPaymentTableColumns(promiseDb);
  if (!paymentColumns.has('receipt_image_url')) {
    await promiseDb.query('ALTER TABLE payments ADD COLUMN receipt_image_url VARCHAR(255) NULL AFTER payment_status');
  }
  if (!paymentColumns.has('receipt_uploaded_at')) {
    await promiseDb.query('ALTER TABLE payments ADD COLUMN receipt_uploaded_at DATETIME NULL AFTER receipt_image_url');
  }
  if (!paymentColumns.has('cleaner_confirmed_at')) {
    await promiseDb.query('ALTER TABLE payments ADD COLUMN cleaner_confirmed_at DATETIME NULL AFTER receipt_uploaded_at');
  }
  if (!paymentColumns.has('payer_user_id')) {
    await promiseDb.query('ALTER TABLE payments ADD COLUMN payer_user_id INT NULL AFTER cleaner_confirmed_at');
  }
  if (!paymentColumns.has('qr_reference')) {
    await promiseDb.query('ALTER TABLE payments ADD COLUMN qr_reference VARCHAR(100) NULL AFTER payer_user_id');
  }
};

const getBookingWithPaymentMeta = async (promiseDb, bookingId) => {
  const [rows] = await promiseDb.query(
    `
      SELECT
        b.booking_id,
        b.user_id,
        b.cleaner_id,
        b.booking_status,
        b.service_status,
        b.payment_status AS booking_payment_status,
        b.total_price,
        b.negotiated_price,
        b.booking_date,
        b.created_at AS booking_created_at,
        s.name AS service_name,
        p.payment_id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.receipt_image_url,
        p.receipt_uploaded_at,
        p.cleaner_confirmed_at,
        p.payer_user_id,
        p.qr_reference
      FROM bookings b
      LEFT JOIN services s ON s.service_id = b.service_id
      LEFT JOIN payments p ON p.booking_id = b.booking_id
      WHERE b.booking_id = ?
      LIMIT 1
    `,
    [bookingId]
  );

  return rows?.[0] || null;
};

const getPaymentByIdWithMeta = async (promiseDb, paymentId) => {
  const [rows] = await promiseDb.query(
    `
      SELECT
        p.payment_id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.receipt_image_url,
        p.receipt_uploaded_at,
        p.cleaner_confirmed_at,
        p.payer_user_id,
        p.qr_reference,
        p.booking_id,
        b.user_id,
        b.cleaner_id,
        b.booking_status,
        b.service_status,
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

const buildFinalizationPayload = (row) => {
  const amountDue = toFiniteAmount(row?.negotiated_price ?? row?.amount ?? row?.total_price, 0);
  const bookingId = Number(row?.booking_id || 0);
  const qrReference = String(row?.qr_reference || `BOOKING-${bookingId}`);
  const qrCodeData = encodeURIComponent(`SERVICE-CLEANING:${qrReference}:${amountDue.toFixed(2)}`);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrCodeData}`;
  const paymentStatus = String(
    row?.payment_status || row?.booking_payment_status || 'pending'
  ).toLowerCase();

  return {
    booking_id: bookingId,
    user_id: Number(row?.user_id || 0) || null,
    cleaner_id: Number(row?.cleaner_id || 0) || null,
    booking_status: row?.booking_status || null,
    service_status: row?.service_status || null,
    payment_id: row?.payment_id ? Number(row.payment_id) : null,
    payment_method: row?.payment_method || 'qr',
    payment_status: paymentStatus,
    amount_due: amountDue,
    service_name: row?.service_name || 'Cleaning Service',
    receipt_image_url: row?.receipt_image_url || null,
    receipt_uploaded_at: row?.receipt_uploaded_at || null,
    cleaner_confirmed_at: row?.cleaner_confirmed_at || null,
    payer_user_id: row?.payer_user_id ? Number(row.payer_user_id) : null,
    qr_reference: qrReference,
    qr_code_url: qrCodeUrl,
  };
};

const hasAccessToPayment = (req, row) => {
  if (isAdminUser(req)) return true;
  const userId = Number(req?.user?.user_id);
  if (!Number.isInteger(userId) || userId <= 0) return false;
  return userId === Number(row?.user_id) || userId === Number(row?.cleaner_id);
};

const isAssignedCleaner = (req, row) => {
  if (isAdminUser(req)) return true;
  const userId = Number(req?.user?.user_id);
  return Number.isInteger(userId) && userId > 0 && userId === Number(row?.cleaner_id);
};

const isBookingCustomer = (req, row) => {
  if (isAdminUser(req)) return true;
  const userId = Number(req?.user?.user_id);
  return Number.isInteger(userId) && userId > 0 && userId === Number(row?.user_id);
};

const sendBookingNotification = async (promiseDb, { title, message, userId, bookingId }) => {
  if (!userId || !bookingId) return;
  await promiseDb
    .query(
      'INSERT INTO notifications (title, message, type_notification, user_id, booking_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [title, message, 'booking', userId, bookingId]
    )
    .catch(() => {});
};

const updateBookingState = async (
  promiseDb,
  bookingId,
  { bookingStatus, serviceStatus, paymentStatus, markCompletedAt = false }
) => {
  const bookingColumns = await getBookingTableColumns(promiseDb);
  const updates = [];
  const params = [];

  if (bookingStatus && bookingColumns.has('booking_status')) {
    updates.push('booking_status = ?');
    params.push(bookingStatus);
  }
  if (serviceStatus && bookingColumns.has('service_status')) {
    updates.push('service_status = ?');
    params.push(serviceStatus);
  }
  if (paymentStatus && bookingColumns.has('payment_status')) {
    updates.push('payment_status = ?');
    params.push(paymentStatus);
  }
  if (markCompletedAt && bookingColumns.has('completed_at')) {
    updates.push('completed_at = NOW()');
  }

  if (!updates.length) return;
  await promiseDb.query(
    `UPDATE bookings SET ${updates.join(', ')} WHERE booking_id = ?`,
    [...params, bookingId]
  );
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
        p.receipt_image_url,
        p.receipt_uploaded_at,
        p.cleaner_confirmed_at,
        p.payer_user_id,
        p.qr_reference,
        p.booking_id,
        b.user_id,
        b.cleaner_id,
        b.booking_status,
        b.service_status,
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
    await ensurePaymentWorkflowColumns(promiseDb);
    const booking = await getBookingWithPaymentMeta(promiseDb, bookingId);
    if (!booking) return next(new AppError('Booking not found', 404));

    if (!isAdminUser(req) && Number(booking.user_id) !== Number(req.user?.user_id)) {
      return next(new AppError('Not authorized for this booking payment', 403));
    }

    if (booking.payment_id) {
      return next(new AppError('Payment already exists for this booking', 400));
    }

    const [insertResult] = await promiseDb.query(
      `
        INSERT INTO payments (amount, payment_method, payment_status, booking_id, qr_reference)
        VALUES (?, ?, ?, ?, ?)
      `,
      [amount, paymentMethod, paymentStatus, bookingId, `BOOKING-${bookingId}`]
    );

    await updateBookingState(promiseDb, bookingId, {
      paymentStatus: mapPaymentStatusToBookingStatus(paymentStatus),
    });

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

    const promiseDb = db.promise();
    await ensurePaymentWorkflowColumns(promiseDb);
    const result = await listPayments(promiseDb, {
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

    const promiseDb = db.promise();
    await ensurePaymentWorkflowColumns(promiseDb);
    const payment = await getPaymentByIdWithMeta(promiseDb, paymentId);
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
    await ensurePaymentWorkflowColumns(promiseDb);
    const payment = await getPaymentByIdWithMeta(promiseDb, paymentId);
    if (!payment) return next(new AppError('Payment not found', 404));
    if (!hasAccessToPayment(req, payment)) return next(new AppError('Not authorized', 403));

    await promiseDb.query(
      'UPDATE payments SET payment_status = ? WHERE payment_id = ?',
      [nextStatus, paymentId]
    );
    await updateBookingState(promiseDb, payment.booking_id, {
      paymentStatus: mapPaymentStatusToBookingStatus(nextStatus),
      ...(nextStatus === 'completed' || nextStatus === 'paid'
        ? { bookingStatus: 'completed', serviceStatus: 'completed', markCompletedAt: true }
        : {}),
    });

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
    await ensurePaymentWorkflowColumns(promiseDb);
    const payment = await getPaymentByIdWithMeta(promiseDb, paymentId);
    if (!payment) return next(new AppError('Payment not found', 404));
    if (!hasAccessToPayment(req, payment)) return next(new AppError('Not authorized', 403));

    await promiseDb.query(
      'UPDATE payments SET payment_status = ? WHERE payment_id = ?',
      ['refunded', paymentId]
    );
    await updateBookingState(promiseDb, payment.booking_id, {
      paymentStatus: 'refunded',
    });

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

    const promiseDb = db.promise();
    await ensurePaymentWorkflowColumns(promiseDb);
    const payment = await getPaymentByIdWithMeta(promiseDb, paymentId);
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

    const promiseDb = db.promise();
    await ensurePaymentWorkflowColumns(promiseDb);
    const result = await listPayments(promiseDb, {
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

    const promiseDb = db.promise();
    await ensurePaymentWorkflowColumns(promiseDb);
    const result = await listPayments(promiseDb, {
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

const getPaymentFinalization = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInt(req.params?.bookingId);
    if (!bookingId) return next(new AppError('Invalid booking id', 400));

    const promiseDb = db.promise();
    await ensurePaymentWorkflowColumns(promiseDb);
    const row = await getBookingWithPaymentMeta(promiseDb, bookingId);
    if (!row) return next(new AppError('Booking not found', 404));
    if (!hasAccessToPayment(req, row)) return next(new AppError('Not authorized', 403));

    return res.status(200).json({
      success: true,
      data: buildFinalizationPayload(row),
    });
  } catch (error) {
    return next(error);
  }
};

const requestFinalPayment = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInt(req.params?.bookingId);
    if (!bookingId) return next(new AppError('Invalid booking id', 400));

    const promiseDb = db.promise();
    await ensurePaymentWorkflowColumns(promiseDb);
    const row = await getBookingWithPaymentMeta(promiseDb, bookingId);
    if (!row) return next(new AppError('Booking not found', 404));
    if (!isAssignedCleaner(req, row)) return next(new AppError('Only the assigned cleaner can request final payment', 403));

    const amountDue = toFiniteAmount(row.negotiated_price ?? row.total_price, 0);
    if (amountDue <= 0) {
      return next(new AppError('Unable to request payment for zero total', 400));
    }

    const qrReference = `INV-${bookingId}-${Date.now().toString().slice(-6)}`;
    if (row.payment_id) {
      await promiseDb.query(
        `
          UPDATE payments
          SET amount = ?,
              payment_method = 'qr',
              payment_status = 'awaiting_receipt',
              qr_reference = ?,
              receipt_image_url = NULL,
              receipt_uploaded_at = NULL,
              cleaner_confirmed_at = NULL,
              payer_user_id = NULL
          WHERE payment_id = ?
        `,
        [amountDue, qrReference, row.payment_id]
      );
    } else {
      await promiseDb.query(
        `
          INSERT INTO payments (amount, payment_method, payment_status, booking_id, qr_reference)
          VALUES (?, 'qr', 'awaiting_receipt', ?, ?)
        `,
        [amountDue, bookingId, qrReference]
      );
    }

    await updateBookingState(promiseDb, bookingId, {
      bookingStatus: 'payment_required',
      serviceStatus: 'completed',
      paymentStatus: 'awaiting_receipt',
    });

    await sendBookingNotification(promiseDb, {
      title: 'Final Payment Required',
      message: `Your service for booking #${bookingId} is complete. Please pay by QR and upload your receipt.`,
      userId: row.user_id,
      bookingId,
    });

    const updated = await getBookingWithPaymentMeta(promiseDb, bookingId);
    return res.status(200).json({
      success: true,
      message: 'Final payment request sent to customer',
      data: buildFinalizationPayload(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const submitPaymentReceipt = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInt(req.params?.bookingId);
    if (!bookingId) return next(new AppError('Invalid booking id', 400));
    if (!req.file) return next(new AppError('Receipt image is required', 400));

    const promiseDb = db.promise();
    await ensurePaymentWorkflowColumns(promiseDb);
    const row = await getBookingWithPaymentMeta(promiseDb, bookingId);
    if (!row) return next(new AppError('Booking not found', 404));
    if (!isBookingCustomer(req, row)) return next(new AppError('Only the booking customer can submit receipt', 403));

    const existingStatus = String(row.payment_status || '').toLowerCase();
    if (existingStatus === 'completed' || existingStatus === 'paid') {
      return next(new AppError('Payment has already been confirmed', 400));
    }

    const amountDue = toFiniteAmount(row.negotiated_price ?? row.total_price, 0);
    const receiptUrl = toReceiptUrl(req.file);
    const payerUserId = Number(req.user?.user_id);
    const qrReference = String(row.qr_reference || `BOOKING-${bookingId}`);

    if (row.payment_id) {
      await promiseDb.query(
        `
          UPDATE payments
          SET amount = ?,
              payment_method = 'qr',
              payment_status = 'receipt_submitted',
              receipt_image_url = ?,
              receipt_uploaded_at = NOW(),
              payer_user_id = ?,
              qr_reference = ?
          WHERE payment_id = ?
        `,
        [amountDue, receiptUrl, payerUserId, qrReference, row.payment_id]
      );
    } else {
      await promiseDb.query(
        `
          INSERT INTO payments (
            amount, payment_method, payment_status, receipt_image_url, receipt_uploaded_at, payer_user_id, booking_id, qr_reference
          ) VALUES (?, 'qr', 'receipt_submitted', ?, NOW(), ?, ?, ?)
        `,
        [amountDue, receiptUrl, payerUserId, bookingId, qrReference]
      );
    }

    await updateBookingState(promiseDb, bookingId, {
      bookingStatus: 'payment_required',
      serviceStatus: 'completed',
      paymentStatus: 'receipt_submitted',
    });

    await sendBookingNotification(promiseDb, {
      title: 'Payment Submitted',
      message: `Customer paid for booking #${bookingId} and uploaded the receipt. Please review and confirm.`,
      userId: row.cleaner_id,
      bookingId,
    });

    const updated = await getBookingWithPaymentMeta(promiseDb, bookingId);
    return res.status(200).json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: buildFinalizationPayload(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const confirmPaymentReceipt = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInt(req.params?.bookingId);
    if (!bookingId) return next(new AppError('Invalid booking id', 400));

    const promiseDb = db.promise();
    await ensurePaymentWorkflowColumns(promiseDb);
    const row = await getBookingWithPaymentMeta(promiseDb, bookingId);
    if (!row) return next(new AppError('Booking not found', 404));
    if (!isAssignedCleaner(req, row)) return next(new AppError('Only the assigned cleaner can confirm payment receipt', 403));

    if (!row.payment_id) return next(new AppError('No payment found for this booking', 404));
    if (!row.receipt_image_url) return next(new AppError('Customer has not uploaded a receipt yet', 400));

    const status = String(row.payment_status || '').toLowerCase();
    if (status === 'completed' || status === 'paid') {
      return next(new AppError('Payment is already confirmed', 400));
    }
    if (status !== 'receipt_submitted') {
      return next(new AppError('Receipt must be submitted before confirmation', 400));
    }

    await promiseDb.query(
      `
        UPDATE payments
        SET payment_status = 'completed',
            cleaner_confirmed_at = NOW()
        WHERE payment_id = ?
      `,
      [row.payment_id]
    );

    await updateBookingState(promiseDb, bookingId, {
      bookingStatus: 'completed',
      serviceStatus: 'completed',
      paymentStatus: 'paid',
      markCompletedAt: true,
    });

    await sendBookingNotification(promiseDb, {
      title: 'Payment Confirmed',
      message: `Cleaner confirmed your receipt for booking #${bookingId}. Service is now completed.`,
      userId: row.user_id,
      bookingId,
    });

    const updated = await getBookingWithPaymentMeta(promiseDb, bookingId);
    return res.status(200).json({
      success: true,
      message: 'Payment receipt confirmed and service completed',
      data: buildFinalizationPayload(updated),
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
  getPaymentFinalization,
  requestFinalPayment,
  submitPaymentReceipt,
  confirmPaymentReceipt,
};
