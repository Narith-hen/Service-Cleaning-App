const jwt = require('jsonwebtoken');

let warnedMissingSecret = false;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not configured');
  }

  if (!warnedMissingSecret) {
    console.warn('[auth] JWT_SECRET is missing. Using development fallback secret.');
    warnedMissingSecret = true;
  }

  return 'dev-local-jwt-secret-change-me';
};

const generateToken = (payload) => {
  return jwt.sign(
    payload, 
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  generateToken,
  verifyToken
};
