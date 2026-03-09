const db = require('../../config/db');
const bcrypt = require("bcryptjs");
const { generateToken } = require('../../utils/jwt.util');
const fs = require("fs");
const path = require("path");

const toNullableString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};

const getUserTableColumns = async () => {
  const [columns] = await db.promise().query("SHOW COLUMNS FROM users");
  return new Set((columns || []).map((column) => column.Field));
};

const ensureAvatarColumnExists = async () => {
  const columns = await getUserTableColumns();
  if (columns.has("avatar")) {
    return true;
  }

  await db.promise().query("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL");
  return true;
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
        COALESCE(SUM(total_price), 0) AS totalSpent
      FROM bookings
      WHERE user_id = ?
    `,
    [userId]
  );

  const totalBookings = Number(bookingRows?.[0]?.totalBookings || 0);
  const totalSpent = Number(bookingRows?.[0]?.totalSpent || 0);

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

  if (!loginId || !password) {
    return res.status(400).json({
      success: false,
      message: "Email (or user code) and password are required",
    });
  }

  const findUserSql = `
    SELECT
      u.user_id,
      u.user_code,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number,
      u.password,
      u.role_id,
      r.role_name
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    WHERE u.email = ? OR u.user_code = ?
    LIMIT 1
  `;
  const findCleanerSql = `
    SELECT
      cp.cleaner_id AS user_id,
      cp.cleaner_code AS user_code,
      cp.company_name AS first_name,
      NULL AS last_name,
      cp.company_email AS email,
      cp.phone_number,
      cp.profile_image AS avatar,
      cp.password,
      cp.role_id,
      r.role_name
    FROM cleaner_profile cp
    LEFT JOIN roles r ON r.role_id = cp.role_id
    WHERE cp.company_email = ? OR cp.cleaner_code = ?
    LIMIT 1
  `;

  try {
    const promiseDb = db.promise();
    let accountSource = "users";
    let [rows] = await promiseDb.query(findUserSql, [loginId, loginId]);
    let user = rows?.[0];

    if (!user) {
      accountSource = "cleaner_profile";
      [rows] = await promiseDb.query(findCleanerSql, [loginId, loginId]);
      user = rows?.[0];
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const storedPassword = String(user.password || "");
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
            [upgradedHash, user.user_id]
          );
        } else {
          await promiseDb.query(
            "UPDATE cleaner_profile SET password = ? WHERE cleaner_id = ?",
            [upgradedHash, user.user_id]
          );
        }
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
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
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
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
