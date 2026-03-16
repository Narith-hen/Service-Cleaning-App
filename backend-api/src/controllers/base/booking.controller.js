const db = require('../../config/db');
const AppError = require('../../utils/error.util');

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

    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            b.booking_id,
            b.booking_status,
            b.booking_date,
            b.booking_time,
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
    const cleanerId = req.user?.user_id;
    if (!cleanerId) return next(new AppError('Unauthorized', 401));

    const [rows] = await db.promise().query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    const booking = rows?.[0];
    if (!booking) return next(new AppError('Booking not found', 404));
    if (booking.cleaner_id && booking.cleaner_id !== cleanerId) {
      return next(new AppError('Booking already assigned to another cleaner', 400));
    }
    if (booking.booking_status !== 'pending') {
      return next(new AppError('Only pending bookings can be claimed', 400));
    }

    await db
      .promise()
      .query(
        'UPDATE bookings SET cleaner_id = ?, booking_status = ? WHERE booking_id = ?',
        [cleanerId, 'confirmed', id]
      );

    // Notify customer if notifications table exists
    await db
      .promise()
      .query(
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

// Add booking images (mysql2)
const addBookingImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return next(new AppError('No images provided', 400));
    }

    const values = images.map((url) => [id, url]);
    await db
      .promise()
      .query(
        'INSERT INTO booking_images (booking_id, image_url, created_at) VALUES ?',
        [values.map(([bid, url]) => [bid, url, new Date()])]
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
