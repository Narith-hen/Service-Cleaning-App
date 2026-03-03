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

  const sql = "INSERT INTO users (first_name, last_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [first_name, last_name, email, phone_number, hashedPassword], (err, result) => {
    if (err) {
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

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: result.insertId,
        first_name,
        last_name,
        email,
        phone_number,
      },
    });
  });
};
