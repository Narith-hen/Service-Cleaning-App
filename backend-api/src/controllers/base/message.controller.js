const db = require('../../config/db');
const promiseDb = db.promise();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const AppError = require('../../utils/error.util');
const { uploadChatImage } = require('../../services/cloudinary.service');
const {
  publishMessageCreated,
  publishMessageRead
} = require('../../services/message-realtime.service');

const getMessageTableColumns = async () => {
  const [columns] = await promiseDb.query('SHOW COLUMNS FROM messages');
  return new Set((columns || []).map((column) => column.Field));
};

const serializeMessage = (message) => {
  const senderRoleName = String(message.sender_role_name || '').trim().toLowerCase();
  const receiverRoleName = String(message.receiver_role_name || '').trim().toLowerCase();
  const messageId = message.message_id ?? message.id ?? null;

  return {
    id: messageId ? messageId.toString() : null,
    booking_id: message.booking_id ? message.booking_id.toString() : null,
    service_id: message.service_id ? message.service_id.toString() : null,
    sender_id: message.sender_user_id?.toString(),
    receiver_id: message.receiver_user_id?.toString(),
    message: message.message || '',
    file_url: message.file_url || '',
    file_type: message.file_type || '',
    is_read: Boolean(message.is_read),
    created_at: message.created_at,
    updated_at: message.updated_at,
    seen_at: message.seen_at,
    sender: {
      user_id: message.sender_user_id,
      username: (message.sender_first_name || '') + ' ' + (message.sender_last_name || ''),
      email: message.sender_email,
      role: { role_name: senderRoleName || null }
    },
    receiver: {
      user_id: message.receiver_user_id,
      username: (message.receiver_first_name || '') + ' ' + (message.receiver_last_name || ''),
      email: message.receiver_email,
      role: { role_name: receiverRoleName || null }
    }
  };
};

const getUserTableColumns = async () => {
  const [columns] = await promiseDb.query('SHOW COLUMNS FROM users');
  return new Set((columns || []).map((column) => column.Field));
};

const getUniqueIndexColumns = async (tableName, columnNames) => {
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

const resolveMessagingUserId = async (user) => {
  const rawUserId = Number(user?.user_id);
  if (!Number.isInteger(rawUserId) || rawUserId <= 0) {
    throw new AppError('Unauthorized', 401);
  }

  const accountSource = String(user?.account_source || '').trim().toLowerCase();
  if (accountSource !== 'cleaner_profile' && accountSource !== 'cleaner') {
    return rawUserId;
  }

  const [existingById] = await promiseDb.query(
    'SELECT user_id FROM users WHERE user_id = ? LIMIT 1',
    [rawUserId]
  );
  if (existingById?.[0]?.user_id) {
    return rawUserId;
  }

  const [profileRows] = await promiseDb.query(
    `
      SELECT cleaner_id, company_email, company_name, phone_number, role_id
      FROM cleaner_profile
      WHERE cleaner_id = ?
      LIMIT 1
    `,
    [rawUserId]
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

  const userColumns = await getUserTableColumns();
  const hasUsername = userColumns.has('username');
  const uniqueNameColumns = (userColumns.has('first_name') || userColumns.has('last_name'))
    ? await getUniqueIndexColumns('users', ['first_name', 'last_name'])
    : new Set();
  const isFirstNameUnique = uniqueNameColumns.has('first_name');
  const isLastNameUnique = uniqueNameColumns.has('last_name');

  const companyName = String(profile.company_name || '').trim();
  const displayName = companyName || (email ? email.split('@')[0] : '') || `cleaner-${rawUserId}`;

  let username = null;
  if (hasUsername) {
    const baseUsername = slugify(companyName) || (email ? slugify(email.split('@')[0]) : '') || `cleaner-${rawUserId}`;
    username = baseUsername.slice(0, 60);

    const [usernameRows] = await promiseDb.query(
      'SELECT user_id FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (usernameRows?.length) {
      username = `${username}-${rawUserId}`.slice(0, 90);
    }
  }

  const insertColumns = ['user_id'];
  const insertValues = [rawUserId];

  if (hasUsername) {
    insertColumns.push('username');
    insertValues.push(username);
  }

  if (userColumns.has('user_code')) {
    insertColumns.push('user_code');
    insertValues.push(`CLN${String(rawUserId).padStart(3, '0')}`);
  }

  if (userColumns.has('first_name')) {
    insertColumns.push('first_name');
    const firstName = isFirstNameUnique ? `${displayName}-${rawUserId}` : displayName;
    insertValues.push(String(firstName).slice(0, 100));
  }

  if (userColumns.has('last_name')) {
    insertColumns.push('last_name');
    const lastName = isLastNameUnique ? `cleaner-${rawUserId}` : '';
    insertValues.push(String(lastName).slice(0, 100));
  }

  insertColumns.push('email');
  insertValues.push(email || `cleaner-${rawUserId}@local.invalid`);

  if (userColumns.has('phone_number')) {
    insertColumns.push('phone_number');
    insertValues.push(String(profile.phone_number || '').trim() || 'N/A');
  }

  if (userColumns.has('password')) {
    const passwordPlain = crypto.randomBytes(18).toString('hex');
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);
    insertColumns.push('password');
    insertValues.push(passwordHash);
  }

  insertColumns.push('role_id');
  insertValues.push(Number(profile.role_id || 2) || 2);

  const placeholders = insertColumns.map(() => '?').join(', ');
  const columnsSql = insertColumns.map((column) => `\`${column}\``).join(', ');
  await promiseDb.query(
    `INSERT INTO users (${columnsSql}) VALUES (${placeholders})`,
    insertValues
  );

  return rawUserId;
};

const assertBookingAccess = async (bookingId, user) => {
  const [bookings] = await promiseDb.query(`SELECT * FROM bookings WHERE booking_id = ?`, [bookingId]);
  if (!bookings || !bookings.length) {
    throw new AppError('Booking not found', 404);
  }
  const booking = bookings[0];
  const normalizedUserId = await resolveMessagingUserId(user);
  const isCustomer = booking.user_id === normalizedUserId;
  const isCleaner = booking.cleaner_id === normalizedUserId;
  const normalizedBookingStatus = String(booking.booking_status || '').trim().toLowerCase();

  if (!isCustomer && !isCleaner) {
    throw new AppError('Not authorized to access this conversation', 403);
  }
  if (isCleaner && normalizedBookingStatus === 'pending') {
    throw new AppError('Cleaner cannot access chat before accepting this booking', 403);
  }
  return { booking, isCustomer, isCleaner };
};

const getMessagesByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingIdValue = Number(bookingId);

    if (!Number.isFinite(bookingIdValue) || bookingIdValue <= 0) {
      return next(new AppError('Invalid booking id', 400));
    }

    await assertBookingAccess(bookingIdValue, req.user);

    const [messages] = await promiseDb.query(`
      SELECT m.*, 
        s_acc.user_id as sender_user_id,
        r_acc.user_id as receiver_user_id,
        su.first_name as sender_first_name, su.last_name as sender_last_name, su.email as sender_email, su.role_id as sender_role_id,
        sr.role_name as sender_role_name,
        ru.first_name as receiver_first_name, ru.last_name as receiver_last_name, ru.email as receiver_email, ru.role_id as receiver_role_id,
        rr.role_name as receiver_role_name
      FROM messages m
      LEFT JOIN acc s_acc ON m.sender_id = s_acc.acc_id
      LEFT JOIN acc r_acc ON m.receiver_id = r_acc.acc_id
      LEFT JOIN users su ON s_acc.user_id = su.user_id
      LEFT JOIN users ru ON r_acc.user_id = ru.user_id
      LEFT JOIN roles sr ON su.role_id = sr.role_id
      LEFT JOIN roles rr ON ru.role_id = rr.role_id
      WHERE m.booking_id = ?
      ORDER BY m.created_at ASC
    `, [bookingIdValue]);

    res.status(200).json({
      success: true,
      data: messages.map(serializeMessage)
    });
  } catch (error) {
    next(error);
  }
};

const createMessage = async (req, res, next) => {
  try {
    const { booking_id, message, file_url, file_type } = req.body;
    const bookingIdValue = Number(booking_id);

    if (!Number.isFinite(bookingIdValue) || bookingIdValue <= 0) {
      return next(new AppError('Booking ID is required', 400));
    }

    if (!message && !file_url) {
      return next(new AppError('Message text or file is required', 400));
    }

    const { booking, isCustomer } = await assertBookingAccess(bookingIdValue, req.user);

    if (!booking.cleaner_id) {
      return next(new AppError('Cleaner has not been assigned to this booking yet', 400));
    }

    // Check if chat is blocked
    const isBlocked = isCustomer ? Boolean(booking.cleaner_blocked) : Boolean(booking.customer_blocked);
    if (isBlocked) {
      return next(new AppError('This chat is blocked. You cannot send messages.', 403));
    }

    const senderUserId = await resolveMessagingUserId(req.user);
    const receiverUserId = isCustomer ? booking.cleaner_id : booking.user_id;

    const [accs] = await promiseDb.query(`SELECT user_id, acc_id FROM acc WHERE user_id IN (?, ?)`, [senderUserId, receiverUserId]);
    
    let senderAccId = accs.find(a => a.user_id === senderUserId)?.acc_id;
    let receiverAccId = accs.find(a => a.user_id === receiverUserId)?.acc_id;

    if (!senderAccId) {
      const [res1] = await promiseDb.query("INSERT INTO acc (user_id) VALUES (?)", [senderUserId]);
      senderAccId = res1.insertId;
    }
    if (!receiverAccId) {
      const [res2] = await promiseDb.query("INSERT INTO acc (user_id) VALUES (?)", [receiverUserId]);
      receiverAccId = res2.insertId;
    }

    const messageColumns = await getMessageTableColumns();
    const insertColumns = [];
    const insertValues = [];
    const appendMessageField = (column, value, required = false) => {
      if (messageColumns.has(column)) {
        insertColumns.push(column);
        insertValues.push(value);
        return;
      }
      if (required) {
        throw new AppError(`Missing required messages column: ${column}`, 500);
      }
    };

    appendMessageField('booking_id', bookingIdValue, true);
    appendMessageField('service_id', booking.service_id);
    appendMessageField('sender_id', senderAccId, true);
    appendMessageField('receiver_id', receiverAccId, true);
    appendMessageField('message', message || null);
    appendMessageField('file_url', file_url || null);
    appendMessageField('file_type', file_type || null);
    appendMessageField('is_read', 0);

    const placeholders = insertColumns.map(() => '?').join(', ');
    const columnsSql = insertColumns.map((column) => `\`${column}\``).join(', ');
    const [insertResult] = await promiseDb.query(
      `INSERT INTO messages (${columnsSql}) VALUES (${placeholders})`,
      insertValues
    );

    const messageIdColumn = messageColumns.has('message_id')
      ? 'message_id'
      : messageColumns.has('id')
        ? 'id'
        : null;

    const [newMessage] = await promiseDb.query(`
      SELECT m.*, 
        s_acc.user_id as sender_user_id,
        r_acc.user_id as receiver_user_id,
        su.first_name as sender_first_name, su.last_name as sender_last_name, su.email as sender_email, su.role_id as sender_role_id,
        sr.role_name as sender_role_name,
        ru.first_name as receiver_first_name, ru.last_name as receiver_last_name, ru.email as receiver_email, ru.role_id as receiver_role_id,
        rr.role_name as receiver_role_name
      FROM messages m
      LEFT JOIN acc s_acc ON m.sender_id = s_acc.acc_id
      LEFT JOIN acc r_acc ON m.receiver_id = r_acc.acc_id
      LEFT JOIN users su ON s_acc.user_id = su.user_id
      LEFT JOIN users ru ON r_acc.user_id = ru.user_id
      LEFT JOIN roles sr ON su.role_id = sr.role_id
      LEFT JOIN roles rr ON ru.role_id = rr.role_id
      WHERE m.${messageIdColumn || 'message_id'} = ?
    `, [insertResult.insertId]);

    const serializedMessage = serializeMessage(newMessage[0]);

    await publishMessageCreated({
      bookingId: bookingIdValue,
      senderUserId,
      receiverUserId,
      message: serializedMessage
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: serializedMessage
    });
  } catch (error) {
    next(error);
  }
};

const markMessagesRead = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingIdValue = Number(bookingId);

    if (!Number.isFinite(bookingIdValue) || bookingIdValue <= 0) {
      return next(new AppError('Invalid booking id', 400));
    }

    const normalizedReaderUserId = await resolveMessagingUserId(req.user);
    await assertBookingAccess(bookingIdValue, req.user);
    
    const [accs] = await promiseDb.query(`SELECT acc_id FROM acc WHERE user_id = ?`, [normalizedReaderUserId]);
    if (!accs.length) {
       return res.status(200).json({ success: true, message: 'No messages to mark', data: { updated: 0 } });
    }
    const receiverAccId = accs[0].acc_id;

    const [updated] = await promiseDb.query(`
      UPDATE messages 
      SET is_read = 1, seen_at = NOW() 
      WHERE booking_id = ? AND receiver_id = ? AND is_read = 0
    `, [bookingIdValue, receiverAccId]);

    let latestSeenMessageId = null;
    if (updated.affectedRows > 0) {
      const messageColumns = await getMessageTableColumns();
      const messageIdColumn = messageColumns.has('message_id')
        ? 'message_id'
        : messageColumns.has('id')
          ? 'id'
          : null;

      if (messageIdColumn) {
      const [latestSeenRows] = await promiseDb.query(`
        SELECT ${messageIdColumn} AS message_id
        FROM messages
        WHERE booking_id = ? AND receiver_id = ?
        ORDER BY COALESCE(seen_at, updated_at, created_at) DESC
        LIMIT 1
      `, [bookingIdValue, receiverAccId]);

        if (latestSeenRows.length) {
          latestSeenMessageId = latestSeenRows[0].message_id ?? null;
        }
      }
    }

    if (updated.affectedRows > 0) {
      await publishMessageRead({
        bookingId: bookingIdValue,
        readerUserId: normalizedReaderUserId,
        messageId: latestSeenMessageId,
        updatedCount: updated.affectedRows
      });
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: { updated: updated.affectedRows }
    });
  } catch (error) {
    next(error);
  }
};

const uploadMessageImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Image file is required', 400));
    }

    const uploaded = await uploadChatImage(req.file.path);
    const fileUrl = uploaded?.url || `/uploads/misc/${req.file.filename}`;
    const fileType = req.file.originalname || req.file.mimetype || 'image';

    res.status(200).json({
      success: true,
      data: {
        file_url: fileUrl,
        file_type: fileType
      }
    });
  } catch (error) {
    next(error);
  }
};

// Block or unblock a chat conversation
const toggleBlockChat = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingIdValue = Number(bookingId);

    if (!Number.isFinite(bookingIdValue) || bookingIdValue <= 0) {
      return next(new AppError('Invalid booking id', 400));
    }

    const normalizedUserId = await resolveMessagingUserId(req.user);
    const { booking, isCustomer } = await assertBookingAccess(bookingIdValue, req.user);

    // Determine which field to update based on user role
    const blockField = isCustomer ? 'customer_blocked' : 'cleaner_blocked';
    const currentBlocked = isCustomer ? booking.customer_blocked : booking.cleaner_blocked;
    const newBlocked = !currentBlocked;

    await promiseDb.query(
      `UPDATE bookings SET ${blockField} = ?, blocked_at = ? WHERE booking_id = ?`,
      [newBlocked, newBlocked ? new Date() : null, bookingIdValue]
    );

    res.status(200).json({
      success: true,
      message: newBlocked ? 'Chat blocked successfully' : 'Chat unblocked successfully',
      data: {
        blocked: newBlocked,
        blockedBy: isCustomer ? 'customer' : 'cleaner'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete all messages in a chat conversation
const deleteChat = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingIdValue = Number(bookingId);

    if (!Number.isFinite(bookingIdValue) || bookingIdValue <= 0) {
      return next(new AppError('Invalid booking id', 400));
    }

    await assertBookingAccess(bookingIdValue, req.user);

    // Delete all messages for this booking
    const [result] = await promiseDb.query(
      'DELETE FROM messages WHERE booking_id = ?',
      [bookingIdValue]
    );

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully',
      data: {
        deletedCount: result.affectedRows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get chat blocking status
const getChatBlockStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingIdValue = Number(bookingId);

    if (!Number.isFinite(bookingIdValue) || bookingIdValue <= 0) {
      return next(new AppError('Invalid booking id', 400));
    }

    const normalizedUserId = await resolveMessagingUserId(req.user);
    const { booking, isCustomer } = await assertBookingAccess(bookingIdValue, req.user);

    res.status(200).json({
      success: true,
      data: {
        customer_blocked: Boolean(booking.customer_blocked),
        cleaner_blocked: Boolean(booking.cleaner_blocked),
        is_blocked: isCustomer ? Boolean(booking.cleaner_blocked) : Boolean(booking.customer_blocked),
        blocked_at: booking.blocked_at
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessagesByBooking,
  createMessage,
  markMessagesRead,
  uploadMessageImage,
  toggleBlockChat,
  deleteChat,
  getChatBlockStatus
};
