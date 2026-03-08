const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  uploadAvatar,
} = require("../controllers/customer/authController");
const { verifyToken } = require("../utils/jwt.util");
const { upload } = require("../middlewares/upload.middleware");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = { user_id: decoded.user_id, email: decoded.email };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.post("/profile/avatar", authenticate, upload.single("avatar"), uploadAvatar);

module.exports = router;
