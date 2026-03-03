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
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});
