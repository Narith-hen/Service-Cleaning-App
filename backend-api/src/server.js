// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// require('dotenv').config();

// const { errorHandler } = require('./middlewares/errorHandler');
// const routes = require('./routes');
// const prisma = require('./config/database');

// const app = express();
// const PORT = process.env.PORT || 3000;

// /* =========================
//    GLOBAL MIDDLEWARES
// ========================= */
// app.use(helmet());
// app.use(cors());
// app.use(morgan('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* =========================
//    ROUTES
// ========================= */
// app.use('/api', routes);

// /* =========================
//    HEALTH CHECK
// ========================= */
// app.get('/health', async (req, res) => {
//   try {
//     await prisma.$queryRaw`SELECT 1`;

//     res.status(200).json({
//       status: 'OK',
//       message: 'Server is running',
//       database: 'connected',
//       timestamp: new Date().toISOString(),
//     });

//   } catch (error) {

//     res.status(500).json({
//       status: 'ERROR',
//       message: 'Database connection failed',
//       timestamp: new Date().toISOString(),
//     });

//   }
// });

// /* =========================
//    ERROR HANDLER
// ========================= */
// app.use(errorHandler);

// /* =========================
//    404 HANDLER (FIXED)
//    ⚠️ DO NOT USE '*'
// ========================= */
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found',
//   });
// });

// /* =========================
//    START SERVER
// ========================= */
// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
//   console.log(`📝 Health check: http://localhost:${PORT}/health`);
// });

// /* =========================
//    GRACEFUL SHUTDOWN
// ========================= */
// process.on('SIGTERM', async () => {
//   console.log('SIGTERM received, closing connections...');
//   await prisma.$disconnect();
//   process.exit(0);
// });

// module.exports = app;

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const app = express();
const arcjetMiddleware = require("./middlewares/arcjet.middleware");

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(arcjetMiddleware);

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

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/admin.routes");
const serviceRoutes = require("./routes/service.routes");
const bookingRoutes = require("./routes/booking.routes");
const notificationRoutes = require("./routes/notification.routes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err?.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
