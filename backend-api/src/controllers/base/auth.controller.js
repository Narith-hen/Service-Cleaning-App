const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/error.util');
const { generateToken } = require('../../utils/jwt.util');

const register = async (req, res, next) => {
  try {
    const { username, email, password, phone_number } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return next(new AppError('User with this email or username already exists', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        phone_number,
        role_id: 2 // Default customer role
      },
      include: { role: true }
    });

    await prisma.setting.create({
      data: {
        user_id: user.user_id,
        language: 'en',
        notification_enabled: true,
        dark_mode: false
      }
    });

    const token = generateToken({ user_id: user.user_id, email: user.email });

    delete user.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { ...user, token }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid credentials', 401));
    }

    const token = generateToken({ user_id: user.user_id, email: user.email });

    delete user.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { ...user, token }
    });
  } catch (error) {
    next(error);
  }
};

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
      email: decoded.email 
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
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { user_id: decoded.user_id },
      data: { password: hashedPassword }
    });

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      include: {
        role: true,
        setting: true
      }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    delete user.password;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile
};