const db = require('../../config/db');
const bcrypt = require("bcrypt");
const { generateToken } = require('../../utils/jwt.util');
const fs = require("fs");
const path = require("path");
const { sendWelcomeEmail } = require('../../services/email.service');

const toNullableString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};

const getTableColumnsSafe = async (tableName) => {
  try {
    const [columns] = await db.promise().query(`SHOW COLUMNS FROM \`${tableName}\``);
    return new Set((columns || []).map((column) => column.Field));
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return new Set();
    }
    throw error;
  }
};

const getUserTableColumns = async () => {
  return getTableColumnsSafe('users');
};

const ensureAvatarColumnExists = async () => {
  const columns = await getUserTableColumns();
  if (columns.has("avatar")) {
    return true;
  }

  await db.promise().query("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL");
  return true;
};

const getCleanerProfileColumns = async () => {
  return getTableColumnsSafe('cleaner_profile');
};

const getCleanerStatusEnumValues = async () => {
  const [rows] = await db.promise().query(`SHOW COLUMNS FROM cleaner_profile LIKE 'status'`);
  const statusType = String(rows?.[0]?.Type || '');
  const enumMatches = statusType.match(/'([^']+)'/g) || [];
  return enumMatches.map((value) => value.replace(/'/g, ''));
};

const normalizeCleanerStatusInput = (status, allowedValues = []) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return null;

  const wanted = normalized === 'inactive' ? 'inactive' : normalized === 'pending' ? 'pending' : 'active';
  const directMatch = allowedValues.find((value) => value.toLowerCase() === wanted);
  if (directMatch) return directMatch;

  if (wanted === 'pending') {
    const inactiveMatch = allowedValues.find((value) => value.toLowerCase() === 'inactive');
    if (inactiveMatch) return inactiveMatch;
  }

  const activeMatch = allowedValues.find((value) => value.toLowerCase() === 'active');
  return activeMatch || null;
};

const buildUserLoginQuery = (columns) => {
  if (!columns?.has('user_id') || !columns?.has('password')) {
    return null;
  }

  const conditions = [];
  const params = [];

  if (columns.has('email')) {
    conditions.push('LOWER(u.email) = ?');
    params.push('loginId');
  }

  if (columns.has('user_code')) {
    conditions.push('LOWER(u.user_code) = ?');
    params.push('loginId');
  }

  if (columns.has('username')) {
    conditions.push('LOWER(u.username) = ?');
    params.push('loginId');
  }

  if (conditions.length === 0) {
    return null;
  }

  return {
    sql: `
      SELECT
        u.user_id AS user_id,
        ${columns.has('user_code') ? 'u.user_code' : 'NULL'} AS user_code,
        ${
          columns.has('first_name')
            ? 'u.first_name'
            : columns.has('username')
              ? 'u.username'
              : 'NULL'
        } AS first_name,
        ${columns.has('last_name') ? 'u.last_name' : 'NULL'} AS last_name,
        ${columns.has('email') ? 'u.email' : 'NULL'} AS email,
        ${columns.has('phone_number') ? 'u.phone_number' : 'NULL'} AS phone_number,
        ${columns.has('avatar') ? 'u.avatar' : 'NULL'} AS avatar,
        u.password AS password,
        ${columns.has('role_id') ? 'u.role_id' : 'NULL'} AS role_id,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      WHERE ${conditions.join(' OR ')}
      LIMIT 1
    `,
    params,
  };
};

const buildCleanerLoginQuery = (columns) => {
  if (!columns?.has('cleaner_id')) {
    return null;
  }

  const passwordColumn = columns.has('password')
    ? 'password'
    : columns.has('cleaner_password')
      ? 'cleaner_password'
      : '';

  if (!passwordColumn) {
    return null;
  }

  const conditions = [];
  const params = [];

  if (columns.has('company_email')) {
    conditions.push('LOWER(cp.company_email) = ?');
    params.push('loginId');
  }

  if (columns.has('cleaner_code')) {
    conditions.push('LOWER(cp.cleaner_code) = ?');
    params.push('loginId');
  }

  if (conditions.length === 0) {
    return null;
  }

  return {
    sql: `
      SELECT
        cp.cleaner_id AS user_id,
        ${columns.has('cleaner_code') ? 'cp.cleaner_code' : 'NULL'} AS user_code,
        ${columns.has('company_name') ? 'cp.company_name' : 'NULL'} AS first_name,
        NULL AS last_name,
        ${columns.has('company_email') ? 'cp.company_email' : 'NULL'} AS email,
        ${columns.has('phone_number') ? 'cp.phone_number' : 'NULL'} AS phone_number,
        ${columns.has('profile_image') ? 'cp.profile_image' : 'NULL'} AS avatar,
        cp.${passwordColumn} AS password,
        ${columns.has('role_id') ? 'cp.role_id' : 'NULL'} AS role_id,
        r.role_name
      FROM cleaner_profile cp
      LEFT JOIN roles r ON r.role_id = cp.role_id
      WHERE ${conditions.join(' OR ')}
      LIMIT 1
    `,
    params,
    passwordColumn,
  };
};

const buildProfileResponse = async (userId) => {
  const promiseDb = db.promise();
  const [userRows] = await promiseDb.query("SELECT * FROM users WHERE user_id = ? LIMIT 1", [userId]);
  const user = userRows?.[0];

  if (!user) return null;

  const [bookingRows] = await promiseDb.query(
    `
      SELECT
        COUNT(*) AS totalBookings,
        COALESCE(SUM(total_price), 0) AS bookingTotalSpent
      FROM bookings
      WHERE user_id = ?
    `,
    [userId]
  );

  const [paymentRows] = await promiseDb.query(
    `
      SELECT
        COALESCE(SUM(
          CASE
            WHEN LOWER(COALESCE(p.payment_status, '')) IN ('completed', 'paid')
              THEN COALESCE(p.amount, 0)
            ELSE 0
          END
        ), 0) AS paymentTotalSpent,
        COUNT(p.payment_id) AS paymentCount
      FROM bookings b
      LEFT JOIN payments p ON p.booking_id = b.booking_id
      WHERE b.user_id = ?
    `,
    [userId]
  );

  const totalBookings = Number(bookingRows?.[0]?.totalBookings || 0);
  const bookingTotalSpent = Number(bookingRows?.[0]?.bookingTotalSpent || 0);
  const paymentTotalSpent = Number(paymentRows?.[0]?.paymentTotalSpent || 0);
  const paymentCount = Number(paymentRows?.[0]?.paymentCount || 0);
  const totalSpent = paymentCount > 0 ? paymentTotalSpent : bookingTotalSpent;

  const createdAt = user.created_at ? new Date(user.created_at) : null;
  const joinDate = createdAt
    ? createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return {
    user_id: user.user_id,
    user_code: user.user_code || null,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    email: user.email || null,
    phone_number: user.phone_number || null,
    city: user.city || null,
    state: user.state || null,
    country: user.country || null,
    avatar: user.avatar || null,
    joinDate,
    totalBookings,
    totalSpent,
  };
};

const buildCleanerProfileResponse = async (cleanerId) => {
  const promiseDb = db.promise();
  const [rows] = await promiseDb.query(
    `
      SELECT
        cp.cleaner_id,
        cp.cleaner_code,
        cp.company_name,
        cp.company_email,
        cp.phone_number,
        cp.profile_image,
        cp.total_jobs,
        cp.created_at,
        cp.role_id,
        r.role_name
      FROM cleaner_profile cp
      LEFT JOIN roles r ON r.role_id = cp.role_id
      WHERE cp.cleaner_id = ?
      LIMIT 1
    `,
    [cleanerId]
  );

  const cleaner = rows?.[0];
  if (!cleaner) return null;

  const createdAt = cleaner.created_at ? new Date(cleaner.created_at) : null;
  const joinDate = createdAt
    ? createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return {
    user_id: cleaner.cleaner_id,
    user_code: cleaner.cleaner_code || null,
    name: cleaner.company_name || null,
    first_name: cleaner.company_name || null,
    last_name: null,
    email: cleaner.company_email || null,
    phone_number: cleaner.phone_number || null,
    avatar: cleaner.profile_image || null,
    joinDate,
    totalBookings: Number(cleaner.total_jobs || 0),
    totalSpent: 0,
    role_id: Number(cleaner.role_id || 2),
    role: String(cleaner.role_name || 'cleaner').toLowerCase(),
    account_source: 'cleaner_profile',
  };
};

exports.register = async (req, res) => {
  const first_name = req.body.first_name || req.body.firstName;
  const last_name = req.body.last_name || req.body.lastName;
  const email = req.body.email;
  const phone_number = req.body.phone_number || req.body.phone;
  const password = req.body.password;

  if (!first_name || !last_name || !email || !phone_number || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  let hashedPassword;
  try {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    hashedPassword = await bcrypt.hash(password, saltRounds);
  } catch (hashError) {
    console.error(hashError);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }

  const getNextCodeSql = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(user_code, 4) AS UNSIGNED)), 0) + 1 AS next_number
    FROM users
    WHERE user_code LIKE 'CUS%'
  `;
  const getCustomerRoleSql = `
    SELECT role_id
    FROM roles
    WHERE LOWER(role_name) = 'customer'
    LIMIT 1
  `;
  const insertSql = `
    INSERT INTO users (user_code, first_name, last_name, email, phone_number, password, role_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const promiseDb = db.promise();
    const [roleRows] = await promiseDb.query(getCustomerRoleSql);
    const role_id = Number(roleRows?.[0]?.role_id || 2);
    const [rows] = await promiseDb.query(getNextCodeSql);
    const nextNumber = Number(rows?.[0]?.next_number || 1);
    const user_code = `CUS${String(nextNumber).padStart(3, "0")}`;

    const [result] = await promiseDb.query(insertSql, [
      user_code,
      first_name,
      last_name,
      email,
      phone_number,
      hashedPassword,
      role_id,
    ]);

    sendWelcomeEmail({ to: email, firstName: first_name }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: result.insertId,
        user_code,
        first_name,
        last_name,
        email,
        phone_number,
        role_id,
      },
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const loginId = String(email || "").trim();
  const normalizedLoginId = loginId.toLowerCase();

  if (!loginId || !password) {
    return res.status(400).json({
      success: false,
      message: "Email (or user code) and password are required",
    });
  }

  try {
    const promiseDb = db.promise();
    const [userColumns, cleanerColumns] = await Promise.all([
      getUserTableColumns(),
      getCleanerProfileColumns(),
    ]);
    const userLoginQuery = buildUserLoginQuery(userColumns);
    const cleanerLoginQuery = buildCleanerLoginQuery(cleanerColumns);
    const resolveParams = (queryDef) => (queryDef?.params || []).map((value) => (
      value === 'loginId' ? normalizedLoginId : value
    ));

    const verifyPasswordAndMaybeUpgrade = async (accountSource, candidate) => {
      const storedPassword = String(
        candidate?.password ?? candidate?.hashed_password ?? candidate?.cleaner_password ?? ""
      );
      if (!storedPassword) return { ok: false };

      const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
      let isPasswordValid = false;

      if (isBcryptHash) {
        isPasswordValid = await bcrypt.compare(password, storedPassword);
      } else {
        // Legacy records may still store plain text passwords.
        isPasswordValid = password === storedPassword;

        // Upgrade plain text password to bcrypt hash after successful login.
        if (isPasswordValid) {
          const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
          const upgradedHash = await bcrypt.hash(password, saltRounds);
          if (accountSource === "users") {
            await promiseDb.query(
              "UPDATE users SET password = ? WHERE user_id = ?",
              [upgradedHash, candidate.user_id]
            );
          } else if (cleanerLoginQuery?.passwordColumn) {
            await promiseDb.query(
              `UPDATE cleaner_profile SET ${cleanerLoginQuery.passwordColumn} = ? WHERE cleaner_id = ?`,
              [upgradedHash, candidate.user_id]
            );
          }
        }
      }

      return { ok: isPasswordValid };
    };

    let accountSource = "users";
    let rows = [];
    if (userLoginQuery) {
      [rows] = await promiseDb.query(userLoginQuery.sql, resolveParams(userLoginQuery));
    }
    let user = rows?.[0] || null;

    if (user) {
      const userCheck = await verifyPasswordAndMaybeUpgrade("users", user);
      if (!userCheck.ok) {
        // If a cleaner shares the same email/code, try that account too.
        rows = [];
        if (cleanerLoginQuery) {
          [rows] = await promiseDb.query(cleanerLoginQuery.sql, resolveParams(cleanerLoginQuery));
        }
        const cleanerCandidate = rows?.[0] || null;
        if (cleanerCandidate) {
          const cleanerCheck = await verifyPasswordAndMaybeUpgrade("cleaner_profile", cleanerCandidate);
          if (cleanerCheck.ok) {
            accountSource = "cleaner_profile";
            user = cleanerCandidate;
          } else {
            return res.status(401).json({
              success: false,
              message: "Invalid email or password",
            });
          }
        } else {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }
      }
    } else {
      rows = [];
      if (cleanerLoginQuery) {
        [rows] = await promiseDb.query(cleanerLoginQuery.sql, resolveParams(cleanerLoginQuery));
      }
      user = rows?.[0] || null;
      accountSource = "cleaner_profile";

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const cleanerCheck = await verifyPasswordAndMaybeUpgrade("cleaner_profile", user);
      if (!cleanerCheck.ok) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    }

    const role = String(
      user.role_name || (Number(user.role_id) === 1 ? "admin" : Number(user.role_id) === 2 ? "cleaner" : "customer")
    ).toLowerCase();
    const token = generateToken({
      user_id: user.user_id,
      email: user.email,
      role_id: user.role_id,
      role,
      account_source: accountSource,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user_id: user.user_id,
        user_code: user.user_code,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        avatar: user.avatar || null,
        role_id: user.role_id,
        token,
        role,
        account_source: accountSource,
      },
    });
  } catch (err) {
    console.error(err);
    const isAuthConfigError = String(err?.message || "").includes("JWT_SECRET");
    return res.status(500).json({
      success: false,
      message: isAuthConfigError
        ? "Server authentication configuration error (missing JWT_SECRET)"
        : "Login failed",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const accountSource = String(req.user?.account_source || '').trim().toLowerCase();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let profile = null;
    if (accountSource === 'cleaner_profile') {
      profile = await buildCleanerProfileResponse(userId);
    } else {
      profile = await buildProfileResponse(userId);
      if (!profile) {
        profile = await buildCleanerProfileResponse(userId);
      }
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const accountSource = String(req.user?.account_source || '').trim().toLowerCase();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (accountSource === 'cleaner_profile') {
      const cleanerColumns = await getCleanerProfileColumns();
      const promiseDb = db.promise();
      const updates = [];
      const values = [];
      const pushUpdate = (column, value) => {
        if (!cleanerColumns.has(column) || value === undefined) return;
        updates.push(`${column} = ?`);
        values.push(value);
      };

      const cleanerName = toNullableString(req.body.company_name ?? req.body.companyName ?? req.body.name);
      const cleanerEmail = toNullableString(req.body.company_email ?? req.body.email);
      const cleanerPhone = toNullableString(req.body.phone_number ?? req.body.phone);
      const cleanerAvatar = req.body.avatar === undefined ? undefined : toNullableString(req.body.avatar);
      const cleanerStatus = req.body.account_status ?? req.body.status;
      const currentPassword = toNullableString(req.body.current_password ?? req.body.currentPassword);
      const newPassword = toNullableString(req.body.new_password ?? req.body.newPassword);

      pushUpdate('company_name', cleanerName);
      pushUpdate('company_email', cleanerEmail);
      pushUpdate('phone_number', cleanerPhone);
      pushUpdate('profile_image', cleanerAvatar);

      if (newPassword !== undefined) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current password is required to change password',
          });
        }

        const [passwordRows] = await promiseDb.query(
          'SELECT password FROM cleaner_profile WHERE cleaner_id = ? LIMIT 1',
          [userId]
        );
        const storedPassword = String(passwordRows?.[0]?.password || '');
        if (!storedPassword) {
          return res.status(400).json({
            success: false,
            message: 'Password is not available for this account',
          });
        }

        const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
        const currentPasswordMatches = isBcryptHash
          ? await bcrypt.compare(currentPassword, storedPassword)
          : currentPassword === storedPassword;

        if (!currentPasswordMatches) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect',
          });
        }

        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        pushUpdate('password', hashedPassword);
      }

      if (cleanerStatus !== undefined && cleanerColumns.has('status')) {
        const allowedStatuses = await getCleanerStatusEnumValues();
        const normalizedStatus = normalizeCleanerStatusInput(cleanerStatus, allowedStatuses);
        if (!normalizedStatus) {
          return res.status(400).json({
            success: false,
            message: 'Invalid cleaner status',
          });
        }
        pushUpdate('status', normalizedStatus);
      }

      if (updates.length > 0) {
        values.push(userId);
        await promiseDb.query(
          `UPDATE cleaner_profile SET ${updates.join(', ')} WHERE cleaner_id = ?`,
          values
        );
      }

      const profile = await buildCleanerProfileResponse(userId);
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: profile,
      });
    }

    if (req.body.avatar !== undefined) {
      await ensureAvatarColumnExists();
    }
    const availableColumns = await getUserTableColumns();

    const incomingFirstName = req.body.first_name || req.body.firstName;
    const incomingLastName = req.body.last_name || req.body.lastName;
    const incomingName = toNullableString(req.body.name);

    let firstName = toNullableString(incomingFirstName);
    let lastName = toNullableString(incomingLastName);

    if ((!firstName || !lastName) && incomingName) {
      const parts = incomingName.split(/\s+/).filter(Boolean);
      firstName = firstName ?? (parts[0] || null);
      lastName = lastName ?? (parts.slice(1).join(' ') || null);
    }

    const candidateUpdates = {
      first_name: firstName,
      last_name: lastName,
      email: toNullableString(req.body.email),
      phone_number: toNullableString(req.body.phone_number ?? req.body.phone),
      city: toNullableString(req.body.city),
      state: toNullableString(req.body.state),
      country: toNullableString(req.body.country),
      avatar: req.body.avatar === undefined ? undefined : req.body.avatar,
    };

    const updateKeys = Object.entries(candidateUpdates)
      .filter(([column, value]) => availableColumns.has(column) && value !== undefined)
      .map(([column]) => column);

    if (updateKeys.length > 0) {
      const setClause = updateKeys.map((column) => `${column} = ?`).join(', ');
      const values = updateKeys.map((column) => candidateUpdates[column]);
      values.push(userId);

      await db.promise().query(`UPDATE users SET ${setClause} WHERE user_id = ?`, values);
    }

    const profile = await buildProfileResponse(userId);
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const accountSource = String(req.user?.account_source || '').trim().toLowerCase();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Avatar file is required",
      });
    }

    if (accountSource === 'cleaner_profile') {
      const cleanerColumns = await getCleanerProfileColumns();
      if (!cleanerColumns.has('profile_image')) {
        return res.status(500).json({
          success: false,
          message: 'Cleaner profile image column is missing',
        });
      }

      const [existingRows] = await db.promise().query(
        "SELECT profile_image FROM cleaner_profile WHERE cleaner_id = ? LIMIT 1",
        [userId]
      );
      const previousAvatar = existingRows?.[0]?.profile_image || null;
      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      await db.promise().query(
        "UPDATE cleaner_profile SET profile_image = ? WHERE cleaner_id = ?",
        [avatarPath, userId]
      );

      if (
        previousAvatar &&
        typeof previousAvatar === "string" &&
        previousAvatar.startsWith("/uploads/avatars/")
      ) {
        const oldFileName = previousAvatar.split("/").pop();
        const oldFilePath = path.join(__dirname, "../../../uploads/avatars", oldFileName);
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, () => {});
        }
      }

      const profile = await buildCleanerProfileResponse(userId);
      return res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: profile,
      });
    }

    await ensureAvatarColumnExists();

    const [existingRows] = await db.promise().query(
      "SELECT avatar FROM users WHERE user_id = ? LIMIT 1",
      [userId]
    );
    const previousAvatar = existingRows?.[0]?.avatar || null;

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    await db.promise().query("UPDATE users SET avatar = ? WHERE user_id = ?", [avatarPath, userId]);

    if (
      previousAvatar &&
      typeof previousAvatar === "string" &&
      previousAvatar.startsWith("/uploads/avatars/")
    ) {
      const oldFileName = previousAvatar.split("/").pop();
      const oldFilePath = path.join(__dirname, "../../../uploads/avatars", oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlink(oldFilePath, () => {});
      }
    }

    const profile = await buildProfileResponse(userId);
    return res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: profile,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to upload avatar",
    });
  }
};
