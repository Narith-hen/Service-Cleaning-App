const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const app = express();
const arcjetMiddleware = require("./middlewares/arcjet.middleware");
const db = require("./config/db");

const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '25mb';

app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(arcjetMiddleware);

app.get("/health", async (req, res) => {
  try {
    await db.promise().query("SELECT 1");
    res.status(200).json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Backward-compatible fallback:
// Some earlier uploads were saved in /uploads/misc while DB stored /uploads/services/<file>.
app.get("/uploads/services/:file", (req, res, next) => {
  const servicesPath = path.join(__dirname, "../uploads/services", req.params.file);
  const miscPath = path.join(__dirname, "../uploads/misc", req.params.file);

  if (fs.existsSync(servicesPath)) {
    return res.sendFile(servicesPath);
  }
  if (fs.existsSync(miscPath)) {
    return res.sendFile(miscPath);
  }
  return next();
});

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const serviceRoutes = require("./routes/service.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");
const notificationRoutes = require("./routes/notification.routes");
const messageRoutes = require("./routes/message.routes");
const userRoutes = require("./routes/user.routes");
const reviewRoutes = require("./routes/review.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((err, req, res, next) => {
  const statusCode = Number(err?.statusCode || err?.status) || 500;
  const isOperational = Boolean(err?.isOperational);
  const shouldLog = !isOperational || statusCode >= 500;

  if (shouldLog) {
    console.error(err);
  } else {
    console.warn(`${req.method} ${req.originalUrl} -> ${statusCode}: ${err?.message || 'Request failed'}`);
  }

  res.status(statusCode).json({
    success: false,
    message: err?.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
const closeServer = async (signal) => {
  try {
    await new Promise((resolve, reject) => {
      server.close((serverError) => {
        if (serverError) {
          reject(serverError);
          return;
        }

        resolve();
      });
    });

    await db.promise().end();
  } catch (error) {
    console.error(`Error during ${signal} shutdown:`, error);
  } finally {
    process.exit(0);
  }
};

process.on("SIGTERM", async () => {
  await closeServer("SIGTERM");
});

process.on("SIGINT", async () => {
  await closeServer("SIGINT");
});
