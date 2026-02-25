const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const { initializeSocket } = require('./config/socket');
const { redis } = require('./config/redis');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: global.io?.engine?.clientsCount || 0
  });
});

// Get online users count
app.get('/stats', (req, res) => {
  const { connectedUsers } = require('./config/socket');
  res.json({
    onlineUsers: connectedUsers.size,
    totalConnections: global.io?.engine?.clientsCount || 0
  });
});

// Initialize Socket.IO
const io = initializeSocket(server);
global.io = io; // Make io accessible globally

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Real-time server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await redis.quit();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});