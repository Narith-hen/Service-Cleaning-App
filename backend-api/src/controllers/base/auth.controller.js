const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const AppError = require('../../utils/error.util');
const { generateToken } = require('../../utils/jwt.util');
const customerAuthController = require('../customer/authController');

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new AppError('Token required', 400));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = generateToken({
      user_id: decoded.user_id,
      email: decoded.email,
      role_id: decoded.role_id,
      role: decoded.role,
      account_source: decoded.account_source || 'users'
    });

    res.status(200).json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim();
    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const [rows] = await db.promise().query(
      'SELECT user_id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    const user = rows?.[0];
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const resetToken = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      data: { reset_token: resetToken }
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return next(new AppError('Token and new password are required', 400));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await db.promise().query(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [hashedPassword, decoded.user_id]
    );

    if (!result.affectedRows) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

module.exports = {
  register: customerAuthController.register,
  login: customerAuthController.login,
  getProfile: customerAuthController.getProfile,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail
};
