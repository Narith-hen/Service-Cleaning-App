const db = require('../../config/db');
const redis = require('../../config/redis');
const AppError = require('../../utils/error.util');
const { syncCleanerCompletedJobs } = require('../../utils/cleanerReviewStats.util');
const bcrypt = require('bcrypt');
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

const ensureBookingServiceStatusColumn = async (promiseDb) => {
  const [rows] = await promiseDb.query("SHOW COLUMNS FROM bookings LIKE 'service_status'");
  if (rows && rows.length > 0) return;
  await promiseDb.query(
    "ALTER TABLE bookings ADD COLUMN service_status VARCHAR(50) NULL AFTER booking_status"
  );
};

const ensureBookingStartedAtColumn = async (promiseDb) => {
  const [rows] = await promiseDb.query("SHOW COLUMNS FROM bookings LIKE 'started_at'");
  if (rows && rows.length > 0) return;
  await promiseDb.query(
    'ALTER TABLE bookings ADD COLUMN started_at DATETIME NULL AFTER service_status'
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
    )
  `);
};

const insertBookingImagesInChunks = async (promiseDb, bookingId, images, chunkSize = 3) => {
  for (let index = 0; index < images.length; index += chunkSize) {
    const batch = images.slice(index, index + chunkSize);
    await promiseDb.query(
      'INSERT INTO booking_images (booking_id, image_url, created_at) VALUES ?',
      [batch.map((url) => [bookingId, url, new Date()])]
    );
  }
};

const getStoredBookingImageUrls = (files = []) => (
  (Array.isArray(files) ? files : [])
    .map((file) => file?.filename ? `/uploads/bookings/${file.filename}` : '')
    .filter(Boolean)
);

const normalizeCoordinate = (value, min, max) => {
  if (value === undefined || value === null || value === '') return null;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
    return null;
  }
  return numericValue;
};

const resolveCustomerBookingUserIds = async (promiseDb, user) => {
  const ids = new Set();
  const numericUserId = Number(user?.user_id);
  const normalizedEmail = String(user?.email || '').trim().toLowerCase();

  if (Number.isInteger(numericUserId) && numericUserId > 0) {
    ids.add(numericUserId);
  }

  if (normalizedEmail) {
    const [emailRows] = await promiseDb.query(
      `
        SELECT u.user_id
        FROM users u
        LEFT JOIN roles r ON r.role_id = u.role_id
        WHERE LOWER(u.email) = ?
          AND LOWER(COALESCE(r.role_name, 'customer')) IN ('customer', 'admin')
      `,
      [normalizedEmail]
    );

    for (const row of emailRows || []) {
      const rowId = Number(row?.user_id);
      if (Number.isInteger(rowId) && rowId > 0) {
        ids.add(rowId);
      }
    }
  }

  return Array.from(ids);
};

const getBookingTrackingMeta = (statusValue) => {
  const status = String(statusValue || 'pending').trim().toLowerCase();

  switch (status) {
    case 'completed':
      return { service_tracking_status: 'completed', service_tracking_label: 'Service Completed' };
    case 'in_progress':
    case 'in-progress':
      return { service_tracking_status: 'in_progress', service_tracking_label: 'Service In Progress' };
    case 'started':
      return { service_tracking_status: 'started', service_tracking_label: 'Service Started' };
    case 'confirmed':
    case 'accepted':
      return { service_tracking_status: 'booked', service_tracking_label: 'Service Booked' };
    case 'cancelled':
    case 'rejected':
      return { service_tracking_status: 'cancelled', service_tracking_label: 'Service Cancelled' };
    case 'payment_required':
      return { service_tracking_status: 'payment_required', service_tracking_label: 'Awaiting Payment Confirmation' };
    case 'booked':
      return { service_tracking_status: 'booked', service_tracking_label: 'Service Booked' };
    default:
      return { service_tracking_status: 'booked', service_tracking_label: 'Service Booked' };
  }
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


const withBookingServiceMeta = (booking) => {
  const existingService = booking?.service && typeof booking.service === 'object'
    ? booking.service
    : null;
  const serviceId =
    existingService?.service_id ??
    existingService?.id ??
    booking?.service_id ??
    null;
  const serviceName =
    existingService?.name ||
    booking?.service_name ||
    booking?.serviceTitle ||
    booking?.title ||
    null;
  const serviceImage =
    existingService?.image ||
    booking?.service_image ||
    booking?.image ||
    null;

  const service = existingService || serviceId || serviceName || serviceImage
    ? {
        ...(existingService || {}),
        service_id: existingService?.service_id ?? existingService?.id ?? serviceId,
        id: existingService?.id ?? existingService?.service_id ?? serviceId,
        name: existingService?.name || serviceName,
        image: existingService?.image || serviceImage
      }
    : null;

  return {
    ...booking,
    service_name: serviceName,
    service_image: serviceImage,
    service
  };
};

const withBookingTrackingMeta = (booking) => ({
  ...withBookingServiceMeta(booking),
  ...getBookingTrackingMeta(booking?.service_status || booking?.booking_status)
});

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
    const { booking_date, start_time, end_time, service_id, address, notes, latitude, longitude } = req.body;
    const user_id = req.user?.user_id;
    const normalizedAddress = typeof address === 'string' ? address.trim() : '';
    const normalizedLatitude = normalizeCoordinate(latitude, -90, 90);
    const normalizedLongitude = normalizeCoordinate(longitude, -180, 180);

    if (!user_id) return next(new AppError('Unauthorized', 401));
    if (!booking_date || !service_id) {
      return next(new AppError('booking_date and service_id are required', 400));
    }
    if (!normalizedAddress && (normalizedLatitude === null || normalizedLongitude === null)) {
      return next(new AppError('Address or coordinates are required', 400));
    }

    const promiseDb = db.promise();
    const [pendingPaymentRows] = await promiseDb.query(
      `
        SELECT booking_id
        FROM bookings
        WHERE user_id = ?
          AND LOWER(COALESCE(booking_status, '')) = 'payment_required'
          AND LOWER(COALESCE(payment_status, 'pending')) NOT IN ('paid', 'completed')
        LIMIT 1
      `,
      [user_id]
    );
    if (pendingPaymentRows?.[0]?.booking_id) {
      return next(
        new AppError(
          `Please complete payment for booking #${pendingPaymentRows[0].booking_id} before creating a new booking`,
          403
        )
      );
    }

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
    const normalizedStartTime = typeof start_time === 'string' ? start_time.trim() : '';
    const normalizedEndTime = typeof end_time === 'string' ? end_time.trim() : '';
    const booking_time =
      normalizedStartTime && normalizedEndTime
        ? `${normalizedStartTime} - ${normalizedEndTime}`
        : normalizedStartTime || '';

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


    appendBookingField('booking_reference', booking_reference);
    appendBookingField('booking_date', new Date(booking_date), true);
    appendBookingField('booking_time', booking_time);
    appendBookingField('address', normalizedAddress || 'Address pending');
    appendBookingField('latitude', normalizedLatitude);
    appendBookingField('longitude', normalizedLongitude);
    appendBookingField('booking_desc', typeof notes === 'string' ? notes.trim() : '');
    appendBookingField('booking_status', 'pending', true);
    appendBookingField('service_status', 'booked');
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
      `SELECT
          b.*,
          s.name AS service_name,
          ${SERVICE_IMAGE_SELECT_SQL} AS service_image
       FROM bookings b
       LEFT JOIN services s ON s.service_id = b.service_id
       WHERE b.booking_id = ?`,
      [booking_id]
    );

    const createdBooking = withBookingTrackingMeta(createdRows[0]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: createdBooking
    });

    publishJobCreated(createdBooking);
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
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_username,
            u.email AS customer_email,
            u.phone_number AS customer_phone,
            cp.company_name AS cleaner_company,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username,
            COALESCE(
              cp.company_name,
              TRIM(CONCAT_WS(' ', c.first_name, c.last_name))
            ) AS cleaner_display_name,
            COALESCE(cp.profile_image, c.avatar) AS cleaner_avatar,
            u.avatar AS customer_avatar,
            c.phone_number AS cleaner_phone,
            c.email AS cleaner_email
         FROM bookings b
         LEFT JOIN services s ON s.service_id = b.service_id
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
      data: rows.map(withBookingTrackingMeta),
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
    const bookingId = Number.parseInt(id, 10);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return next(new AppError('Invalid booking id', 400));
    }

    const promiseDb = db.promise();
    await ensureBookingImagesTable(promiseDb);
    await ensureBookingStartedAtColumn(promiseDb);

    const [rows] = await promiseDb
      .query(
        `SELECT 
            b.*,
            s.name AS service_name,
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
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
            COALESCE(cp.profile_image, c.avatar) AS cleaner_avatar,
            u.avatar AS customer_avatar,
            c.phone_number AS cleaner_phone,
            c.email AS cleaner_email,
            p.payment_id,
            p.payment_status,
            p.amount,
            r.review_id,
            r.rating,
            r.comment AS review_comment
         FROM bookings b
         LEFT JOIN services s ON s.service_id = b.service_id
         JOIN users u ON u.user_id = b.user_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
         LEFT JOIN payments p ON p.booking_id = b.booking_id
         LEFT JOIN reviews r ON r.booking_id = b.booking_id
         WHERE b.booking_id = ?`,
        [bookingId]
      );

    if (!rows || rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    const [imageRows] = await promiseDb.query(
      `SELECT image_id, image_url, created_at
       FROM booking_images
       WHERE booking_id = ?
       ORDER BY created_at ASC, image_id ASC`,
      [bookingId]
    );

    const booking = withBookingTrackingMeta(rows[0]);
    booking.images = (imageRows || []).map((imageRow) => ({
      id: imageRow.image_id,
      url: imageRow.image_url,
      created_at: imageRow.created_at
    }));

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

const publishJobCreated = async (booking) => {
  try {
    if (!booking?.booking_id) return;

    const startTime = String(booking?.booking_time || '').split('-')[0].trim() || 'TBD';
    await redis.publish('job:created', JSON.stringify({
      bookingId: String(booking.booking_id),
      serviceTitle: booking.service_name || 'Cleaning',
      startTime,
      bookingData: booking
    }));
  } catch (error) {
    console.error('Failed to publish job:created event:', error);
  }
};

// Update booking
const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { booking_date, service_id } = req.body;

    const [rows] = await db.promise().query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    if (!rows || rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    const payload = {};
    if (booking_date) payload.booking_date = new Date(booking_date);
    if (service_id) payload.service_id = parseInt(service_id);

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
        `SELECT
            b.*,
            s.name AS service_name,
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image
         FROM bookings b
         LEFT JOIN services s ON s.service_id = b.service_id
         WHERE b.booking_id = ?`,
        [id]
      );

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: withBookingTrackingMeta(updated?.[0])
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
    const rawBookingStatus = req.body?.booking_status;
    const rawServiceStatus = req.body?.service_status;

    if (!rawBookingStatus && !rawServiceStatus) {
      return next(new AppError('booking_status or service_status is required', 400));
    }
    const normalizedBookingStatus = rawBookingStatus ? String(rawBookingStatus).trim().toLowerCase() : null;
    const normalizedServiceStatus = rawServiceStatus ? String(rawServiceStatus).trim().toLowerCase() : null;
    const allowedBookingStatuses = new Set(['pending', 'confirmed', 'in_progress', 'payment_required', 'completed', 'cancelled']);
    const allowedServiceStatuses = new Set(['pending', 'booked', 'started', 'in_progress', 'completed', 'cancelled']);
    if (normalizedBookingStatus && !allowedBookingStatuses.has(normalizedBookingStatus)) {
      return next(new AppError('Invalid booking status', 400));
    }
    if (normalizedServiceStatus && !allowedServiceStatuses.has(normalizedServiceStatus)) {
      return next(new AppError('Invalid service status', 400));
    }

    const promiseDb = db.promise();
    await ensureBookingServiceStatusColumn(promiseDb);
    await ensureBookingStartedAtColumn(promiseDb);
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
      if (!booking.cleaner_id || Number(booking.cleaner_id) !== Number(cleanerId)) {
        return next(new AppError('Not authorized for this booking', 403));
      }
    }

    const bookingColumns = await getBookingTableColumns(promiseDb);
    const updates = [];
    const params = [];

    if (normalizedBookingStatus && bookingColumns.has('booking_status')) {
      updates.push('booking_status = ?');
      params.push(normalizedBookingStatus);
    }
    if (normalizedServiceStatus && bookingColumns.has('service_status')) {
      updates.push('service_status = ?');
      params.push(normalizedServiceStatus);
    }
    if (
      normalizedServiceStatus
      && ['started', 'in_progress'].includes(normalizedServiceStatus)
      && bookingColumns.has('started_at')
      && !booking.started_at
    ) {
      updates.push('started_at = NOW()');
    }

    if (!updates.length) {
      return next(new AppError('No status column found on bookings table', 500));
    }

    await promiseDb.query(
      `UPDATE bookings SET ${updates.join(', ')} WHERE booking_id = ?`,
      [...params, id]
    );

    if (booking.cleaner_id) {
      await syncCleanerCompletedJobs(promiseDb, Number(booking.cleaner_id));
    }

    await promiseDb
      .query(
        'INSERT INTO notifications (title, message, type_notification, user_id, booking_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          'Booking Status Updated',
          `Your booking #${id} status is now ${getBookingTrackingMeta(normalizedServiceStatus || normalizedBookingStatus).service_tracking_label}`,
          'booking',
          booking.user_id,
          id
        ]
      )
      .catch(() => {});

    const [updatedRows] = await promiseDb.query('SELECT * FROM bookings WHERE booking_id = ? LIMIT 1', [id]);
    const updatedBooking = updatedRows?.[0] || booking;

    res.status(200).json({
      success: true,
      message: 'Booking status updated',
      data: {
        booking_id: id,
        booking_status: updatedBooking.booking_status,
        service_status: updatedBooking.service_status || null,
        started_at: updatedBooking.started_at || null,
        ...getBookingTrackingMeta(updatedBooking.service_status || updatedBooking.booking_status)
      }
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
            COALESCE(cp.profile_image, c.avatar) AS cleaner_avatar,
            s.name AS service_name,
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image
         FROM bookings b
         JOIN users u ON u.user_id = b.user_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
         LEFT JOIN services s ON s.service_id = b.service_id
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
      data: withBookingTrackingMeta(booking)
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
    const promiseDb = db.promise();
    await ensureBookingServiceStatusColumn(promiseDb);

    const [rows] = await promiseDb.query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    const booking = rows?.[0];
    if (!booking) return next(new AppError('Booking not found', 404));

    const roleName = String(req.user?.role?.role_name || '').trim().toLowerCase();
    if (roleName !== 'admin' && Number(booking.user_id) !== Number(req.user?.user_id)) {
      return next(new AppError('Not authorized for this booking', 403));
    }

    const bookingColumns = await getBookingTableColumns(promiseDb);
    const updates = ['booking_status = ?'];
    const params = ['cancelled'];

    if (bookingColumns.has('service_status')) {
      updates.push('service_status = ?');
      params.push('cancelled');
    }

    await promiseDb.query(
      `UPDATE bookings SET ${updates.join(', ')} WHERE booking_id = ?`,
      [...params, id]
    );

    // Notify customer (best-effort)
    await promiseDb
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
      data: {
        booking_id: id,
        booking_status: 'cancelled',
        service_status: 'cancelled',
        ...getBookingTrackingMeta('cancelled')
      }
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
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
            cp.company_name AS cleaner_company,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username,
            COALESCE(
              cp.company_name,
              TRIM(CONCAT_WS(' ', c.first_name, c.last_name))
            ) AS cleaner_display_name,
            COALESCE(cp.profile_image, c.avatar) AS cleaner_avatar,
            c.phone_number AS cleaner_phone,
            c.email AS cleaner_email,
            p.payment_status,
            p.amount,
            r.rating,
            r.review_id
         FROM bookings b
         LEFT JOIN services s ON s.service_id = b.service_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
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
      data: rows.map(withBookingTrackingMeta),
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

// Get booking history for the logged-in customer
const getMyBookingHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.min(5, Math.max(1, parseInt(req.query.limit || 5, 10)));
    const offset = (page - 1) * limit;
    const promiseDb = db.promise();
    const userId = Number(req.user?.user_id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }


    const [rows] = await promiseDb.query(
      `SELECT 
          b.*,
          s.name AS service_name,
          ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
          cp.company_name AS cleaner_company,
          TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username,
          COALESCE(
            cp.company_name,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name))
          ) AS cleaner_display_name,
          COALESCE(cp.profile_image, c.avatar) AS cleaner_avatar,
          c.phone_number AS cleaner_phone,
          c.email AS cleaner_email,
          p.payment_status,
          p.amount,
          r.rating,
          r.review_id
       FROM bookings b
       LEFT JOIN services s ON s.service_id = b.service_id
       LEFT JOIN users c ON c.user_id = b.cleaner_id
       LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
       LEFT JOIN payments p ON p.booking_id = b.booking_id
       LEFT JOIN reviews r ON r.booking_id = b.booking_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC, b.booking_id DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countRows] = await promiseDb.query(
      `SELECT COUNT(*) AS total
       FROM bookings
       WHERE user_id = ?`,
      [userId]
    );

    const total = countRows?.[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: rows.map(withBookingTrackingMeta),
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

// Get bookings by cleaner
const getBookingsByCleaner = async (req, res, next) => {
  try {
    const { cleanerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const promiseDb = db.promise();
    const roleName = String(req.user?.role?.role_name || '').trim().toLowerCase();

    if (roleName !== 'admin') {
      const accountSource = String(req.user?.account_source || '').toLowerCase();
      const rawCleanerId = req.user?.user_id;
      const authorizedCleanerId = accountSource === 'cleaner_profile'
        ? await ensureCleanerUserRow(promiseDb, rawCleanerId)
        : rawCleanerId;

      if (!authorizedCleanerId) {
        return next(new AppError('Unauthorized', 401));
      }

      if (Number(authorizedCleanerId) !== Number(cleanerId)) {
        return next(new AppError('Not authorized to view these bookings', 403));
      }
    }

    const [rows] = await promiseDb
      .query(
        `SELECT 
            b.*,
            s.name AS service_name,
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
            u.user_id AS customer_id,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_username,
            u.phone_number AS customer_phone,
            u.email AS customer_email,
            u.avatar AS customer_avatar,
            cp.company_name AS cleaner_company,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username,
            COALESCE(
              cp.company_name,
              TRIM(CONCAT_WS(' ', c.first_name, c.last_name))
            ) AS cleaner_display_name,
            COALESCE(cp.profile_image, c.avatar) AS cleaner_avatar
         FROM bookings b
         LEFT JOIN services s ON s.service_id = b.service_id
         JOIN users u ON u.user_id = b.user_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
         WHERE b.cleaner_id = ?
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [cleanerId, parseInt(limit), offset]
      );

    const [countRows] = await promiseDb
      .query('SELECT COUNT(*) AS total FROM bookings WHERE cleaner_id = ?', [cleanerId]);

    const total = countRows?.[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: rows.map(withBookingTrackingMeta),
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
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
            TRIM(CONCAT_WS(' ', u.first_name, u.last_name)) AS customer_username,
            u.phone_number AS customer_phone,
            cp.company_name AS cleaner_company,
            COALESCE(
              cp.company_name,
              TRIM(CONCAT_WS(' ', c.first_name, c.last_name))
            ) AS cleaner_display_name,
            TRIM(CONCAT_WS(' ', c.first_name, c.last_name)) AS cleaner_username,
            COALESCE(cp.profile_image, c.avatar) AS cleaner_avatar,
            c.phone_number AS cleaner_phone,
            p.payment_status,
            p.amount,
            r.rating,
            r.review_id,
            r.comment AS review_comment
         FROM bookings b
         LEFT JOIN services s ON s.service_id = b.service_id
         JOIN users u ON u.user_id = b.user_id
         LEFT JOIN users c ON c.user_id = b.cleaner_id
         LEFT JOIN cleaner_profile cp ON cp.cleaner_id = b.cleaner_id
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
      data: withBookingTrackingMeta(rows[0])
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
            b.address,
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
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
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
      data: withBookingTrackingMeta(rows[0])
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
            ${SERVICE_IMAGE_SELECT_SQL} AS service_image,
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
  getMyBookingHistory,
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

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return next(new AppError('Invalid booking id', 400));
    }

    const uploadedFileUrls = getStoredBookingImageUrls(req.files);
    const bodyImages = Array.isArray(images) ? images : [];

    if (uploadedFileUrls.length === 0 && bodyImages.length === 0) {
      return next(new AppError('No images provided', 400));
    }

    const promiseDb = db.promise();
    await ensureBookingImagesTable(promiseDb);
    const [bookingRows] = await promiseDb.query(
      'SELECT booking_id FROM bookings WHERE booking_id = ? LIMIT 1',
      [bookingId]
    );
    if (!bookingRows?.length) {
      return next(new AppError('Booking not found', 404));
    }

    const normalizedImages = [...uploadedFileUrls, ...bodyImages]
      .map((url) => String(url || '').trim())
      .filter(Boolean);

    if (!normalizedImages.length) {
      return next(new AppError('No valid images provided', 400));
    }

    await insertBookingImagesInChunks(promiseDb, bookingId, normalizedImages);

    res.status(201).json({
      success: true,
      message: 'Images saved'
    });
  } catch (error) {
    if (error?.code === 'ECONNRESET') {
      return next(new AppError(
        'Image upload failed because the database connection was reset. Try fewer or smaller images.',
        413
      ));
    }
    next(error);
  }
};

module.exports.addBookingImages = addBookingImages;






