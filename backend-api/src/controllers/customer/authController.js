const db = require('../../config/db');
const bcrypt = require("bcryptjs");

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

  try {
    const promiseDb = db.promise();
    const [rows] = await promiseDb.query(findUserSql, [loginId, loginId]);
    const user = rows?.[0];

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
        await promiseDb.query(
          "UPDATE users SET password = ? WHERE user_id = ?",
          [upgradedHash, user.user_id]
        );
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const role = String(user.role_name || "").toLowerCase() || "customer";

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
        role_id: user.role_id,
        role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};
