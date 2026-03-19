const db = require('../../config/db');
const AppError = require('../../utils/error.util');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const getBookingTableColumns = async (promiseDb) => {
  const [columns] = await promiseDb.query('SHOW COLUMNS FROM bookings');
  return new Set((columns || []).map((column) => column.Field));
};

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

const ensureBookingNegotiatedPriceColumn = async (promiseDb) => {
  const [rows] = await promiseDb.query("SHOW COLUMNS FROM bookings LIKE 'negotiated_price'");
  if (rows && rows.length > 0) return;
  await promiseDb.query(
    'ALTER TABLE bookings ADD COLUMN negotiated_price FLOAT NULL AFTER total_price'
  );
};

const ensureBookingImagesTable = async (promiseDb) => {
  await promiseDb.query(`
    CREATE TABLE IF NOT EXISTS booking_images (
      id INT NOT NULL AUTO_INCREMENT,
      booking_id INT NOT NULL,
      image_url LONGTEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_booking_images_booking_id (booking_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
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

    const promiseDb = db.promise();
    const [serviceRows] = await promiseDb.query(
      'SELECT * FROM services WHERE service_id = ?',
      [service_id]
    );

    if (!serviceRows || serviceRows.length === 0) {
      return next(new AppError('Service not found', 404));
    }

    const svc = serviceRows[0];
    const total_price = Number(svc.price ?? svc.service_price ?? svc.cost ?? 0) || 0;
    const booking_reference = `BK-${Date.now()}`;
    const booking_time = start_time && end_time ? `${start_time} - ${end_time}` : start_time || '';

    const bookingColumns = await getBookingTableColumns(promiseDb);
    const insertColumns = [];
    const insertValues = [];
    const appendBookingField = (column, value, required = false) => {
      if (bookingColumns.has(column)) {
        insertColumns.push(column);
        insertValues.push(value);
        return;
      }
      if (required) {
        throw new AppError(`Missing required bookings column: ${column}`, 500);
      }
    };

    appendBookingField('booking_reference', booking_reference, true);
    appendBookingField('booking_date', new Date(booking_date), true);
    appendBookingField('booking_time', booking_time);
    appendBookingField('address', address || 'Address pending');
    appendBookingField('booking_desc', notes || '');
    appendBookingField('booking_status', 'pending', true);
    appendBookingField('total_price', total_price, true);
    appendBookingField('payment_status', 'pending', true);
    appendBookingField('user_id', user_id, true);
    appendBookingField('service_id', service_id, true);
    appendBookingField('created_at', new Date());

    const placeholders = insertColumns.map(() => '?').join(', ');
    const columnSql = insertColumns.map((column) => `\`${column}\``).join(', ');
    const [result] = await promiseDb.query(
      `INSERT INTO bookings (${columnSql}) VALUES (${placeholders})`,
      insertValues
    );

    const booking_id = result.insertId;
    const [createdRows] = await promiseDb.query(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [booking_id]
    );

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
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClauses = [];
    const params = [];

    if (status) {
      whereClauses.push('LOWER(b.booking_status) = LOWER(?)');
      params.push(status);
    }

    if (req.user.role.role_name !== 'admin') {
      whereClauses.push('b.user_id = ?');
      params.push(req.user.user_id);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            b.*,
            s.name AS service_name,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_username,
            u.email AS customer_email,
            u.phone_number AS customer_phone,
            cp.company_name AS cleaner_company,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username,
            COALESCE(
              cp.company_name,
              TRIM(CONCAT_WS(' ', c.first_name, c.last_name))
            ) AS cleaner_display_name,
            COALESCE(cp.profile_image, c.avatar, c.profile_image) AS cleaner_avatar,
            u.avatar AS customer_avatar,
            c.phone_number AS cleaner_phone,
            c.email AS cleaner_email
         FROM bookings b
         JOIN services s ON s.service_id = b.service_id
         JOIN users u ON u.user_id = b.user_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
         ${whereSql}
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

    const [countRows] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS total 
         FROM bookings b
         ${whereSql}`,
        params
      );

    const total = countRows?.[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
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

    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            b.*,
            s.name AS service_name,
            s.price AS service_price,
            u.user_id AS customer_id,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_username,
            u.email AS customer_email,
            u.phone_number AS customer_phone,
            c.user_id AS cleaner_id,
            cp.company_name AS cleaner_company,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username,
            COALESCE(
              cp.company_name,
              TRIM(CONCAT_WS(' ', c.first_name, c.last_name))
            ) AS cleaner_display_name,
            COALESCE(cp.profile_image, c.avatar, c.profile_image) AS cleaner_avatar,
            u.avatar AS customer_avatar,
            c.phone_number AS cleaner_phone,
            c.email AS cleaner_email,
            p.payment_id,
            p.payment_status,
            p.amount,
            r.review_id,
            r.rating,
            r.command AS review_comment,
            promo.promotion_id,
            promo.discount_price,
            promo.start_date,
            promo.end_date
         FROM bookings b
         JOIN services s ON s.service_id = b.service_id
         JOIN users u ON u.user_id = b.user_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
         LEFT JOIN payments p ON p.booking_id = b.booking_id
         LEFT JOIN reviews r ON r.booking_id = b.booking_id
         LEFT JOIN promotions promo ON promo.promotion_id = b.promotion_id
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

// Update booking
const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { booking_date, service_id, promotion_id } = req.body;

    const [rows] = await db.promise().query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    if (!rows || rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    const payload = {};
    if (booking_date) payload.booking_date = new Date(booking_date);
    if (service_id) payload.service_id = parseInt(service_id);
    if (promotion_id !== undefined) payload.promotion_id = promotion_id ? parseInt(promotion_id) : null;

    if (Object.keys(payload).length === 0) {
      return next(new AppError('No fields to update', 400));
    }

    const setSql = Object.keys(payload)
      .map((field) => `${field} = ?`)
      .join(', ');
    const values = [...Object.values(payload), id];

    await db.promise().query(`UPDATE bookings SET ${setSql} WHERE booking_id = ?`, values);

    const [updated] = await db
      .promise()
      .query(
        `SELECT b.*, s.name AS service_name 
         FROM bookings b 
         JOIN services s ON s.service_id = b.service_id 
         WHERE b.booking_id = ?`,
        [id]
      );

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updated?.[0]
    });
  } catch (error) {
    next(error);
  }
};

// Delete booking
const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await db.promise().query('SELECT booking_id FROM bookings WHERE booking_id = ?', [id]);
    if (!rows || rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    await db.promise().query('DELETE FROM bookings WHERE booking_id = ?', [id]);

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

// Update negotiated price (cleaner/admin)
const updateNegotiatedPrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawPrice = req.body?.negotiated_price;
    const negotiatedPrice = Number(rawPrice);
    if (!Number.isFinite(negotiatedPrice) || negotiatedPrice <= 0) {
      return next(new AppError('Valid negotiated_price is required', 400));
    }

    const promiseDb = db.promise();
    await ensureBookingNegotiatedPriceColumn(promiseDb);

    const [rows] = await promiseDb.query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    const booking = rows?.[0];
    if (!booking) return next(new AppError('Booking not found', 404));

    const roleName = String(req.user?.role?.role_name || '').trim().toLowerCase();
    if (roleName !== 'admin') {
      const accountSource = String(req.user?.account_source || '').toLowerCase();
      const rawCleanerId = req.user?.user_id;
      const cleanerId = accountSource === 'cleaner_profile'
        ? await ensureCleanerUserRow(promiseDb, rawCleanerId)
        : rawCleanerId;
      if (!cleanerId) return next(new AppError('Unauthorized', 401));
      if (booking.cleaner_id && booking.cleaner_id !== cleanerId) {
        return next(new AppError('Not authorized for this booking', 403));
      }
      if (!booking.cleaner_id) {
        await promiseDb.query(
          'UPDATE bookings SET cleaner_id = ? WHERE booking_id = ?',
          [cleanerId, id]
        );
      }
    }

    await promiseDb.query(
      'UPDATE bookings SET negotiated_price = ? WHERE booking_id = ?',
      [negotiatedPrice, id]
    );

    await promiseDb.query(
      'INSERT INTO notifications (title, message, type_notification, user_id, booking_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [
        'Price updated',
        `Your cleaner proposed a price of $${negotiatedPrice.toFixed(2)} for booking #${id}.`,
        'booking',
        booking.user_id,
        id
      ]
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Negotiated price updated',
      data: { booking_id: id, negotiated_price: negotiatedPrice }
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

    const [rows] = await db.promise().query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    if (!rows || rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    await db
      .promise()
      .query('UPDATE bookings SET cleaner_id = ? WHERE booking_id = ?', [cleaner_id, id]);

    const [[booking]] = await db
      .promise()
      .query(
        `SELECT 
            b.*, 
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_username, 
            cp.company_name AS cleaner_company,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username, 
            COALESCE(
              cp.company_name,
              TRIM(CONCAT_WS(' ', c.first_name, c.last_name))
            ) AS cleaner_display_name,
            COALESCE(cp.profile_image, c.avatar, c.profile_image) AS cleaner_avatar,
            s.name AS service_name
         FROM bookings b
         JOIN users u ON u.user_id = b.user_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
         JOIN services s ON s.service_id = b.service_id
         WHERE b.booking_id = ?`,
        [id]
      );

    await db
      .promise()
      .query(
        'INSERT INTO notifications (title, message, type_notification, user_id, booking_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          'New Assignment',
          `You have been assigned to booking #${id}`,
          'assignment',
          parseInt(cleaner_id),
          parseInt(id)
        ]
      )
      .catch(() => {});

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
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            b.*,
            s.name AS service_name,
            p.payment_status,
            p.amount,
            r.rating,
            r.review_id
         FROM bookings b
         JOIN services s ON s.service_id = b.service_id
         LEFT JOIN payments p ON p.booking_id = b.booking_id
         LEFT JOIN reviews r ON r.booking_id = b.booking_id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, parseInt(limit), offset]
      );

    const [countRows] = await db
      .promise()
      .query('SELECT COUNT(*) AS total FROM bookings WHERE user_id = ?', [userId]);

    const total = countRows?.[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
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
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            b.*,
            s.name AS service_name,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_username,
            u.phone_number AS customer_phone,
            cp.company_name AS cleaner_company,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username,
            COALESCE(
              cp.company_name,
              TRIM(CONCAT_WS(' ', c.first_name, c.last_name))
            ) AS cleaner_display_name,
            COALESCE(cp.profile_image, c.avatar, c.profile_image) AS cleaner_avatar
         FROM bookings b
         JOIN services s ON s.service_id = b.service_id
         JOIN users u ON u.user_id = b.user_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
         WHERE b.cleaner_id = ?
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [cleanerId, parseInt(limit), offset]
      );

    const [countRows] = await db
      .promise()
      .query('SELECT COUNT(*) AS total FROM bookings WHERE cleaner_id = ?', [cleanerId]);

    const total = countRows?.[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
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

    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            b.*,
            s.name AS service_name,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_username,
            u.phone_number AS customer_phone,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username,
            c.phone_number AS cleaner_phone,
            p.payment_status,
            p.amount,
            r.rating,
            r.review_id,
            r.command AS review_comment
         FROM bookings b
         JOIN services s ON s.service_id = b.service_id
         JOIN users u ON u.user_id = b.user_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN payments p ON p.booking_id = b.booking_id
         LEFT JOIN reviews r ON r.booking_id = b.booking_id
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

// Track booking (mysql2)
const trackBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promiseDb = db.promise();
    await ensureBookingNegotiatedPriceColumn(promiseDb);

    const [rows] = await promiseDb
      .query(
        `SELECT 
            b.booking_id,
            b.booking_status,
            b.booking_date,
            b.booking_time,
            b.total_price,
            b.negotiated_price,
            b.cleaner_id,
            cp.company_name AS cleaner_company,
            COALESCE(cp.company_name, TRIM(CONCAT_WS(' ', c.first_name, c.last_name))) AS cleaner_display_name,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_full_name,
            c.first_name AS cleaner_first_name,
            c.last_name AS cleaner_last_name,
            c.phone_number AS cleaner_phone,
            c.email AS cleaner_email,
            COALESCE(cp.profile_image, c.avatar) AS cleaner_avatar,
            s.name AS service_name,
            b.user_id,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_full_name,
            u.phone_number AS customer_phone,
            u.email AS customer_email,
            u.avatar AS customer_avatar
         FROM bookings b
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
         JOIN users u ON u.user_id = b.user_id
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
            COALESCE(
              (
                SELECT si.image_url
                FROM service_images si
                WHERE si.service_id = s.service_id
                ORDER BY si.id DESC
                LIMIT 1
              ),
              s.image
            ) AS service_image,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_name,
            u.phone_number,
            u.avatar AS customer_avatar
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
    const isCleanerSource = accountSource === 'cleaner_profile' || accountSource === 'cleaner';
    const isAllowedRole = roleName === 'cleaner' || roleName === 'admin' || isCleanerSource;
    if (!isAllowedRole) {
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
  claimBooking,
  updateNegotiatedPrice
};

// Add booking images (mysql2)
const addBookingImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { images } = req.body;
    const bookingId = Number.parseInt(id, 10);
    const promiseDb = db.promise();

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return next(new AppError('Invalid booking id', 400));
    }

    if (!Array.isArray(images) || images.length === 0) {
      return next(new AppError('No images provided', 400));
    }

    await ensureBookingImagesTable(promiseDb);

    const [bookingRows] = await promiseDb.query(
      'SELECT booking_id FROM bookings WHERE booking_id = ? LIMIT 1',
      [bookingId]
    );
    if (!bookingRows?.length) {
      return next(new AppError('Booking not found', 404));
    }

    const normalizedImages = images
      .map((url) => String(url || '').trim())
      .filter(Boolean);

    if (!normalizedImages.length) {
      return next(new AppError('No valid images provided', 400));
    }

    await promiseDb.query(
      'INSERT INTO booking_images (booking_id, image_url, created_at) VALUES ?',
      [normalizedImages.map((url) => [bookingId, url, new Date()])]
    );

    res.status(201).json({
      success: true,
      message: 'Images saved'
    });
  } catch (error) {
    next(error);
  }
};

module.exports.addBookingImages = addBookingImages;
