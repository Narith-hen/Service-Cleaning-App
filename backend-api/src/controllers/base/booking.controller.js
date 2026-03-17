const db = require('../../config/db');
const prisma = require('../../config/database');
const AppError = require('../../utils/error.util');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const getUserTableColumns = async (promiseDb) => {
  const [columns] = await promiseDb.query('SHOW COLUMNS FROM users');
  return new Set((columns || []).map((column) => column.Field));
};

const getUniqueIndexColumns = async (promiseDb, tableName, columnNames) => {
  const wanted = new Set((columnNames || []).map((name) => String(name).toLowerCase()));
  if (!wanted.size) return new Set();

  const [rows] = await promiseDb.query(`SHOW INDEX FROM \`${tableName}\` WHERE Non_unique = 0`);
  const uniqueColumns = new Set();

  for (const row of rows || []) {
    const col = String(row?.Column_name || '').toLowerCase();
    if (wanted.has(col)) uniqueColumns.add(col);
  }

  return uniqueColumns;
};

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureCleanerUserRow = async (promiseDb, cleanerProfileId) => {
  const cleanerId = Number.parseInt(cleanerProfileId, 10);
  if (!Number.isInteger(cleanerId) || cleanerId <= 0) {
    throw new AppError('Invalid cleaner id', 400);
  }

  const [existingById] = await promiseDb.query(
    'SELECT user_id FROM users WHERE user_id = ? LIMIT 1',
    [cleanerId]
  );
  if (existingById?.[0]?.user_id) {
    return cleanerId;
  }

  const [profileRows] = await promiseDb.query(
    `
      SELECT cleaner_id, company_email, company_name, phone_number, role_id
      FROM cleaner_profile
      WHERE cleaner_id = ?
      LIMIT 1
    `,
    [cleanerId]
  );
  const profile = profileRows?.[0];
  if (!profile) {
    throw new AppError('Cleaner profile not found', 404);
  }

  const email = String(profile.company_email || '').trim();
  if (email) {
    const [existingByEmail] = await promiseDb.query(
      'SELECT user_id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (existingByEmail?.[0]?.user_id) {
      return Number(existingByEmail[0].user_id);
    }
  }

  const columns = await getUserTableColumns(promiseDb);
  const hasUsername = columns.has('username');
  const uniqueNameColumns = (columns.has('first_name') || columns.has('last_name'))
    ? await getUniqueIndexColumns(promiseDb, 'users', ['first_name', 'last_name'])
    : new Set();
  const isFirstNameUnique = uniqueNameColumns.has('first_name');
  const isLastNameUnique = uniqueNameColumns.has('last_name');

  const companyName = String(profile.company_name || '').trim();
  const displayName = companyName || (email ? email.split('@')[0] : '') || `cleaner-${cleanerId}`;

  let username = null;
  if (hasUsername) {
    const baseUsername = slugify(companyName) || (email ? slugify(email.split('@')[0]) : '') || `cleaner-${cleanerId}`;
    username = baseUsername.slice(0, 60);

    const [usernameRows] = await promiseDb.query(
      'SELECT user_id FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (usernameRows?.length) {
      username = `${username}-${cleanerId}`.slice(0, 90);
    }
  }

  const passwordPlain = crypto.randomBytes(18).toString('hex');
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);

  // Prefer the cleaner role id from profile, otherwise lookup by role_name.
  let roleId = Number(profile.role_id || 0);
  if (!roleId) {
    const [roleRows] = await promiseDb.query(
      `SELECT role_id FROM roles WHERE LOWER(role_name) = 'cleaner' LIMIT 1`
    );
    roleId = Number(roleRows?.[0]?.role_id || 0) || 2;
  }

  const phoneNumber = String(profile.phone_number || '').trim() || 'N/A';
  const insertColumns = [];
  const insertValues = [];

  // Set explicit PK to satisfy bookings FK when cleaner_profile ids are used.
  insertColumns.push('user_id');
  insertValues.push(cleanerId);

  if (hasUsername) {
    insertColumns.push('username');
    insertValues.push(username);
  }

  if (columns.has('user_code')) {
    insertColumns.push('user_code');
    insertValues.push(`CLN${String(cleanerId).padStart(3, '0')}`);
  }

  if (columns.has('first_name')) {
    insertColumns.push('first_name');
    // Some dev DBs were created with an incorrect UNIQUE index on first_name.
    // If it exists, use a deterministic unique value to prevent accept/claim failures.
    const firstName = isFirstNameUnique ? `${displayName}-${cleanerId}` : displayName;
    insertValues.push(String(firstName).slice(0, 100));
  }
  if (columns.has('last_name')) {
    insertColumns.push('last_name');
    // Some dev DBs were created with an incorrect UNIQUE index on last_name.
    // If it exists, avoid inserting the same blank last_name for every cleaner.
    const lastName = isLastNameUnique ? `cleaner-${cleanerId}` : '';
    insertValues.push(String(lastName).slice(0, 100));
  }

  insertColumns.push('email');
  insertValues.push(email || `cleaner-${cleanerId}@local.invalid`);

  if (columns.has('phone_number')) {
    insertColumns.push('phone_number');
    insertValues.push(phoneNumber);
  }

  insertColumns.push('password');
  insertValues.push(passwordHash);

  insertColumns.push('role_id');
  insertValues.push(roleId);

  const placeholders = insertColumns.map(() => '?').join(', ');
  const colSql = insertColumns.map((c) => `\`${c}\``).join(', ');
  await promiseDb.query(`INSERT INTO users (${colSql}) VALUES (${placeholders})`, insertValues);
  return cleanerId;
};

// Create booking (mysql2)
const createBooking = async (req, res, next) => {
  try {
    const { booking_date, start_time, end_time, service_id, address, notes } = req.body;
    const user_id = req.user?.user_id;

    if (!user_id) return next(new AppError('Unauthorized', 401));
    if (!booking_date || !service_id) {
      return next(new AppError('booking_date and service_id are required', 400));
    }

    const [serviceRows] = await db
      .promise()
      .query('SELECT * FROM services WHERE service_id = ?', [service_id]);

    if (!serviceRows || serviceRows.length === 0) {
      return next(new AppError('Service not found', 404));
    }

    const svc = serviceRows[0];
    const total_price = Number(svc.price ?? svc.service_price ?? svc.cost ?? 0) || 0;
    const booking_reference = `BK-${Date.now()}`;
    const booking_time = start_time && end_time ? `${start_time} - ${end_time}` : start_time || '';

    const [result] = await db
      .promise()
      .query(
        `INSERT INTO bookings 
          (booking_reference, booking_date, booking_time, address, booking_desc, booking_status, total_price, payment_status, user_id, service_id, created_at) 
         VALUES (?, ?, ?, ?, ?, 'pending', ?, 'pending', ?, ?, NOW())`,
        [
          booking_reference,
          new Date(booking_date),
          booking_time,
          address || 'Address pending',
          notes || '',
          total_price,
          user_id,
          service_id
        ]
      );

    const booking_id = result.insertId;
    const [createdRows] = await db
      .promise()
      .query('SELECT * FROM bookings WHERE booking_id = ?', [booking_id]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: createdRows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get all bookings
const getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.booking_status = status;
    
    // If not admin, show only user's bookings
    if (req.user.role.role_name !== 'admin') {
      where.user_id = req.user.user_id;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: true,
          user: {
            select: {
              user_id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.booking.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get booking by ID
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) },
      include: {
        service: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone_number: true
          }
        },
        cleaner: {
          select: {
            user_id: true,
            username: true,
            phone_number: true
          }
        },
        payment: true,
        review: true,
        promotion: true
      }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// Update booking
const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { booking_date, service_id, promotion_id } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: parseInt(id) },
      data: {
        booking_date: booking_date ? new Date(booking_date) : undefined,
        service_id: service_id ? parseInt(service_id) : undefined,
        promotion_id: promotion_id ? parseInt(promotion_id) : null
      },
      include: {
        service: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// Delete booking
const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    await prisma.booking.delete({
      where: { booking_id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update booking status
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { booking_status } = req.body;

    const [rows] = await db.promise().query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    const booking = rows?.[0];
    if (!booking) return next(new AppError('Booking not found', 404));

    await db
      .promise()
      .query('UPDATE bookings SET booking_status = ? WHERE booking_id = ?', [booking_status, id]);

    await db
      .promise()
      .query(
        'INSERT INTO notifications (title, message, type_notification, user_id, booking_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          'Booking Status Updated',
          `Your booking #${id} status is now ${booking_status}`,
          'booking',
          booking.user_id,
          id
        ]
      )
      .catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Booking status updated',
      data: { booking_id: id, booking_status }
    });
  } catch (error) {
    next(error);
  }
};

// Assign cleaner
const assignCleaner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cleaner_id } = req.body;

    const booking = await prisma.booking.update({
      where: { booking_id: parseInt(id) },
      data: { cleaner_id: parseInt(cleaner_id) },
      include: {
        user: true,
        cleaner: true,
        service: true
      }
    });

    await prisma.notification.create({
      data: {
        title: 'New Assignment',
        message: `You have been assigned to booking #${id}`,
        type_notification: 'assignment',
        user_id: parseInt(cleaner_id),
        booking_id: parseInt(id)
      }
    });

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// Cancel booking
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const [rows] = await db.promise().query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    const booking = rows?.[0];
    if (!booking) return next(new AppError('Booking not found', 404));

    await db
      .promise()
      .query('UPDATE bookings SET booking_status = ? WHERE booking_id = ?', ['cancelled', id]);

    // Notify customer (best-effort)
    await db
      .promise()
      .query(
        'INSERT INTO notifications (title, message, type_notification, user_id, booking_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          'Booking cancelled',
          `Your booking #${id} was cancelled${reason ? `: ${reason}` : ''}.`,
          'booking',
          booking.user_id,
          id
        ]
      )
      .catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking_id: id, booking_status: 'cancelled' }
    });
  } catch (error) {
    next(error);
  }
};

// Get bookings by user
const getBookingsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { user_id: parseInt(userId) },
        include: {
          service: true,
          payment: true,
          review: true
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.booking.count({
        where: { user_id: parseInt(userId) }
      })
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get bookings by cleaner
const getBookingsByCleaner = async (req, res, next) => {
  try {
    const { cleanerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { cleaner_id: parseInt(cleanerId) },
        include: {
          service: true,
          user: {
            select: {
              username: true,
              phone_number: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.booking.count({
        where: { cleaner_id: parseInt(cleanerId) }
      })
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get booking history
const getBookingHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) },
      include: {
        service: true,
        user: true,
        cleaner: true,
        payment: true,
        review: true
      }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// Track booking (mysql2)
const trackBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            b.booking_id,
            b.booking_status,
            b.booking_date,
            b.booking_time,
            b.cleaner_id,
            c.first_name AS cleaner_first_name,
            c.last_name AS cleaner_last_name,
            c.phone_number AS cleaner_phone,
            s.name AS service_name
         FROM bookings b
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN services s ON s.service_id = b.service_id
         WHERE b.booking_id = ?`,
        [id]
      );

    if (!rows || rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Cleaner: list available (unassigned) pending bookings (mysql2)
const getAvailableBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const offset = (page - 1) * limit;

    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            b.*,
            s.name AS service_name,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_name,
            u.phone_number
         FROM bookings b
         JOIN services s ON s.service_id = b.service_id
         JOIN users u ON u.user_id = b.user_id
         WHERE LOWER(b.booking_status) = 'pending' AND (b.cleaner_id IS NULL OR b.cleaner_id = 0)
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

    const [countRows] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS total
         FROM bookings b
         WHERE b.booking_status = 'pending' AND (b.cleaner_id IS NULL OR b.cleaner_id = 0)`
      );

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: countRows[0]?.total || 0,
        pages: Math.ceil((countRows[0]?.total || 0) / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cleaner: claim/accept a pending booking (mysql2)
const claimBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promiseDb = db.promise();
    const accountSource = String(req.user?.account_source || '').toLowerCase();
    const roleName = String(req.user?.role?.role_name || '').trim().toLowerCase();
    if (roleName !== 'cleaner' && roleName !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }
    const rawCleanerId = req.user?.user_id;
    const cleanerId = accountSource === 'cleaner_profile'
      ? await ensureCleanerUserRow(promiseDb, rawCleanerId)
      : rawCleanerId;
    if (!cleanerId) return next(new AppError('Unauthorized', 401));

    const [rows] = await promiseDb.query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    const booking = rows?.[0];
    if (!booking) return next(new AppError('Booking not found', 404));
    if (booking.cleaner_id && booking.cleaner_id !== cleanerId) {
      return next(new AppError('Booking already assigned to another cleaner', 400));
    }
    if (String(booking.booking_status || '').toLowerCase() !== 'pending') {
      return next(new AppError('Only pending bookings can be claimed', 400));
    }

    await promiseDb.query(
        'UPDATE bookings SET cleaner_id = ?, booking_status = ? WHERE booking_id = ?',
        [cleanerId, 'confirmed', id]
      );

    // Notify customer if notifications table exists
    await promiseDb.query(
        'INSERT INTO notifications (title, message, type_notification, user_id, booking_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          'Booking accepted',
          `Your booking #${id} has been accepted by a cleaner.`,
          'booking',
          booking.user_id,
          id
        ]
      )
      .catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Booking claimed successfully',
      data: { booking_id: id, cleaner_id: cleanerId, booking_status: 'confirmed' }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
  assignCleaner,
  cancelBooking,
  getBookingsByUser,
  getBookingsByCleaner,
  getBookingHistory,
  trackBooking,
  getAvailableBookings,
  claimBooking
};
