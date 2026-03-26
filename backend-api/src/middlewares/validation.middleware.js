const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path || err.param || null,
        path: err.path || err.param || null,
        msg: err.msg,
        message: err.msg,
        location: err.location || null
      }))
    });
  }
  
  next();
};

module.exports = { validate };
