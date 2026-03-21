const db = require('../../config/db');
const bcrypt = require('bcrypt');
const AppError = require('../../utils/error.util');

const getUserTableColumns = async () => {
  const [columns] = await db.promise().query('SHOW COLUMNS FROM users');
  return new Set((columns || []).map((column) => column.Field));
};

const buildDisplayName = (row) => {
  if (row.username) return row.username;
  const first = String(row.first_name || '').trim();
  const last = String(row.last_name || '').trim();
  const fullName = `${first} ${last}`.trim();
  if (fullName) return fullName;
  if (row.email) return String(row.email).split('@')[0];
  return `user-${row.user_id}`;
};

const mapUserRow = (row) => ({
  // Support both schemas: boolean `is_active` and string `status`.
  // If only `status` exists, treat anything other than "inactive" as active.
  ...(() => {
    const hasIsActive = row.is_active !== null && row.is_active !== undefined;
    const statusText = String(row.status || '').trim().toLowerCase();
    const activeFromStatus = statusText ? statusText !== 'inactive' : true;
    const isActive = hasIsActive ? Boolean(row.is_active) : activeFromStatus;
    return {
      is_active: isActive,
      status: isActive ? 'Active' : 'Inactive',
    };
  })(),
  user_id: row.user_id,
  user_code: row.user_code ?? null,
  username: buildDisplayName(row),
  first_name: row.first_name ?? null,
  last_name: row.last_name ?? null,
  email: row.email ?? null,
  phone_number: row.phone_number ?? null,
  avatar: row.avatar ?? null,
  created_at: row.created_at ?? null,
  role_id: row.role_id ?? null,
  role: {
    role_id: row.role_id ?? null,
    role_name: row.role_name ?? null,
  },
  _count: {
    bookings: Number(row.bookings_count || 0),
    reviews: Number(row.reviews_count || 0),
  },
});

const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;
    const role = req.query.role ? String(req.query.role).trim() : '';
    const search = req.query.search ? String(req.query.search).trim() : '';
    const columns = await getUserTableColumns();

    const selectParts = [
      'u.user_id',
      columns.has('user_code') ? 'u.user_code' : 'NULL AS user_code',
      columns.has('username') ? 'u.username' : 'NULL AS username',
      columns.has('first_name') ? 'u.first_name' : 'NULL AS first_name',
      columns.has('last_name') ? 'u.last_name' : 'NULL AS last_name',
      'u.email',
      'u.phone_number',
      columns.has('avatar') ? 'u.avatar' : 'NULL AS avatar',
      'u.created_at',
      'u.role_id',
      columns.has('is_active') ? 'u.is_active' : 'NULL AS is_active',
      columns.has('status') ? 'u.status' : 'NULL AS status',
      'r.role_name',
      'COALESCE(bk.total_bookings, 0) AS bookings_count',
      'COALESCE(rv.total_reviews, 0) AS reviews_count',
    ];

    const whereClauses = [];
    const whereParams = [];

    if (role) {
      whereClauses.push('LOWER(r.role_name) = LOWER(?)');
      whereParams.push(role);
    }

    if (search) {
      const searchParts = ['u.email LIKE ?', 'u.phone_number LIKE ?'];
      const searchParams = [`%${search}%`, `%${search}%`];

      if (columns.has('username')) {
        searchParts.push('u.username LIKE ?');
        searchParams.push(`%${search}%`);
      }
      if (columns.has('first_name')) {
        searchParts.push('u.first_name LIKE ?');
        searchParams.push(`%${search}%`);
      }
      if (columns.has('last_name')) {
        searchParts.push('u.last_name LIKE ?');
        searchParams.push(`%${search}%`);
      }
      if (columns.has('user_code')) {
        searchParts.push('u.user_code LIKE ?');
        searchParams.push(`%${search}%`);
      }

      whereClauses.push(`(${searchParts.join(' OR ')})`);
      whereParams.push(...searchParams);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const listSql = `
      SELECT ${selectParts.join(', ')}
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS total_bookings
        FROM bookings
        GROUP BY user_id
      ) bk ON bk.user_id = u.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS total_reviews
        FROM reviews
        GROUP BY user_id
      ) rv ON rv.user_id = u.user_id
      ${whereSql}
      ORDER BY u.created_at DESC
      LIMIT ?
      OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      ${whereSql}
    `;

    const promiseDb = db.promise();
    const [users] = await promiseDb.query(listSql, [...whereParams, limit, skip]);
    const [countRows] = await promiseDb.query(countSql, whereParams);
    const total = Number(countRows?.[0]?.total || 0);

    res.status(200).json({
      success: true,
      data: users.map(mapUserRow),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { username, email, password, phone_number, role_id } = req.body;
    const columns = await getUserTableColumns();
    const promiseDb = db.promise();

    const [existingRows] = await promiseDb.query(
      `
        SELECT user_id
        FROM users
        WHERE email = ? OR ${columns.has('username') ? 'username' : 'email'} = ?
        LIMIT 1
      `,
      [email, username]
    );

    if (existingRows?.length > 0) {
      return next(new AppError('User already exists', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertColumns = ['email', 'password', 'phone_number', 'role_id'];
    const insertValues = [email, hashedPassword, phone_number || null, parseInt(role_id, 10)];

    if (columns.has('username')) {
      insertColumns.unshift('username');
      insertValues.unshift(username);
    } else {
      const [firstName = '', ...rest] = String(username || '').trim().split(/\s+/);
      const lastName = rest.join(' ').trim();
      if (columns.has('first_name')) {
        insertColumns.unshift('first_name');
        insertValues.unshift(firstName || username);
      }
      if (columns.has('last_name')) {
        insertColumns.splice(insertColumns.includes('first_name') ? 1 : 0, 0, 'last_name');
        insertValues.splice(insertColumns.includes('first_name') ? 1 : 0, 0, lastName || null);
      }
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    const [insertResult] = await promiseDb.query(
      `INSERT INTO users (${insertColumns.join(', ')}) VALUES (${placeholders})`,
      insertValues
    );

    const createdUserId = Number(insertResult.insertId);
    const [rows] = await promiseDb.query(
      `
        SELECT
          u.user_id,
          ${columns.has('user_code') ? 'u.user_code' : 'NULL AS user_code'},
          ${columns.has('username') ? 'u.username' : 'NULL AS username'},
          ${columns.has('first_name') ? 'u.first_name' : 'NULL AS first_name'},
          ${columns.has('last_name') ? 'u.last_name' : 'NULL AS last_name'},
          u.email,
          u.phone_number,
          ${columns.has('avatar') ? 'u.avatar' : 'NULL AS avatar'},
          u.created_at,
          u.role_id,
          ${columns.has('is_active') ? 'u.is_active' : 'NULL AS is_active'},
          ${columns.has('status') ? 'u.status' : 'NULL AS status'},
          r.role_name,
          COALESCE(bk.total_bookings, 0) AS bookings_count,
          COALESCE(rv.total_reviews, 0) AS reviews_count
        FROM users u
        LEFT JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS total_bookings
          FROM bookings
          GROUP BY user_id
        ) bk ON bk.user_id = u.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS total_reviews
          FROM reviews
          GROUP BY user_id
        ) rv ON rv.user_id = u.user_id
        WHERE u.user_id = ?
        LIMIT 1
      `,
      [createdUserId]
    );

    res.status(201).json({
      success: true,
      data: rows[0] ? mapUserRow(rows[0]) : null,
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return next(new AppError('User already exists', 400));
    }
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, phone_number, role_id, is_active, status } = req.body;
    const userId = parseInt(id, 10);
    const columns = await getUserTableColumns();
    const updates = [];
    const values = [];

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone_number !== undefined) {
      updates.push('phone_number = ?');
      values.push(phone_number);
    }
    if (role_id !== undefined) {
      updates.push('role_id = ?');
      values.push(parseInt(role_id, 10));
    }
    const normalizedStatus = status === undefined
      ? undefined
      : (String(status).trim().toLowerCase() === 'inactive' ? 'inactive' : 'active');
    const normalizedIsActive = is_active === undefined
      ? undefined
      : Boolean(is_active);

    if (normalizedIsActive !== undefined && columns.has('is_active')) {
      updates.push('is_active = ?');
      values.push(normalizedIsActive ? 1 : 0);
    }
    if (normalizedStatus !== undefined && columns.has('status')) {
      updates.push('status = ?');
      values.push(normalizedStatus);
    }
    if (normalizedIsActive !== undefined && normalizedStatus === undefined && columns.has('status')) {
      updates.push('status = ?');
      values.push(normalizedIsActive ? 'active' : 'inactive');
    }
    if (normalizedStatus !== undefined && normalizedIsActive === undefined && columns.has('is_active')) {
      updates.push('is_active = ?');
      values.push(normalizedStatus === 'active' ? 1 : 0);
    }
    if (username !== undefined) {
      if (columns.has('username')) {
        updates.push('username = ?');
        values.push(username);
      } else {
        const [firstName = '', ...rest] = String(username || '').trim().split(/\s+/);
        const lastName = rest.join(' ').trim();
        if (columns.has('first_name')) {
          updates.push('first_name = ?');
          values.push(firstName || username);
        }
        if (columns.has('last_name')) {
          updates.push('last_name = ?');
          values.push(lastName || null);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const promiseDb = db.promise();
    values.push(userId);
    const [updateResult] = await promiseDb.query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    if (!updateResult?.affectedRows) {
      return next(new AppError('User not found', 404));
    }

    const [rows] = await promiseDb.query(
      `
        SELECT
          u.user_id,
          ${columns.has('user_code') ? 'u.user_code' : 'NULL AS user_code'},
          ${columns.has('username') ? 'u.username' : 'NULL AS username'},
          ${columns.has('first_name') ? 'u.first_name' : 'NULL AS first_name'},
          ${columns.has('last_name') ? 'u.last_name' : 'NULL AS last_name'},
          u.email,
          u.phone_number,
          ${columns.has('avatar') ? 'u.avatar' : 'NULL AS avatar'},
          u.created_at,
          u.role_id,
          ${columns.has('is_active') ? 'u.is_active' : 'NULL AS is_active'},
          ${columns.has('status') ? 'u.status' : 'NULL AS status'},
          r.role_name,
          COALESCE(bk.total_bookings, 0) AS bookings_count,
          COALESCE(rv.total_reviews, 0) AS reviews_count
        FROM users u
        LEFT JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS total_bookings
          FROM bookings
          GROUP BY user_id
        ) bk ON bk.user_id = u.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS total_reviews
          FROM reviews
          GROUP BY user_id
        ) rv ON rv.user_id = u.user_id
        WHERE u.user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: rows[0] ? mapUserRow(rows[0]) : null,
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return next(new AppError('User already exists', 400));
    }
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  const userId = parseInt(req.params.id, 10);
  const pool = db.promise();
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Delete settings
    await connection.query('DELETE FROM settings WHERE user_id = ?', [userId]);

    // Delete notifications
    await connection.query('DELETE FROM notifications WHERE user_id = ?', [userId]);

    // Get bookings for user (customer or cleaner)
    const [bookings] = await connection.query(
      'SELECT booking_id FROM bookings WHERE user_id = ? OR cleaner_id = ?',
      [userId, userId]
    );
    const bookingIds = bookings.map(row => row.booking_id);

    if (bookingIds.length > 0) {
      // Delete payments
      await connection.query('DELETE FROM payments WHERE booking_id IN (?)', [bookingIds]);

      // Delete reviews (by booking or user)
      await connection.query(
        'DELETE FROM reviews WHERE booking_id IN (?) OR user_id = ? OR cleaner_id = ?',
        [bookingIds, userId, userId]
      );

      // Delete bookings
      await connection.query('DELETE FROM bookings WHERE booking_id IN (?)', [bookingIds]);
    }

    // Delete user
    const [result] = await connection.query('DELETE FROM users WHERE user_id = ?', [userId]);
    await connection.commit();
    connection.release();

    if (result.affectedRows === 0) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'User (cleaner) and all related data deleted successfully',
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
      connection.release();
    }
    next(error);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
