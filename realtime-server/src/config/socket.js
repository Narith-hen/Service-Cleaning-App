const { Server } = require('socket.io');
const { redis, subscriber } = require('./redis');

const connectedUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify token with backend API or JWT
      // For now, we'll trust the token from the client
      // In production, verify with your auth service
      socket.userId = socket.handshake.auth.userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id} (User: ${socket.userId})`);
    
    // Store user connection
    if (socket.userId) {
      connectedUsers.set(socket.userId, socket.id);
      userSockets.set(socket.id, socket.userId);
      
      // Join user to their private room
      socket.join(`user:${socket.userId}`);
      
      // Update online status
      io.emit('user:online', { userId: socket.userId });
    }

    // Subscribe to Redis channels for this user
    subscribeToUserChannels(socket);

    // Handle joining booking room
    socket.on('booking:join', (bookingId) => {
      socket.join(`booking:${bookingId}`);
      console.log(`User ${socket.userId} joined booking room: ${bookingId}`);
    });

    // Handle leaving booking room
    socket.on('booking:leave', (bookingId) => {
      socket.leave(`booking:${bookingId}`);
      console.log(`User ${socket.userId} left booking room: ${bookingId}`);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.to(`booking:${data.bookingId}`).emit('user:typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      
      const userId = userSockets.get(socket.id);
      if (userId) {
        connectedUsers.delete(userId);
        userSockets.delete(socket.id);
        io.emit('user:offline', { userId });
      }
    });
  });

  // Subscribe to Redis channels for real-time updates from backend
  subscriber.subscribe('booking:updates', 'notification:new', 'user:status');

  subscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'booking:updates':
          handleBookingUpdate(io, data);
          break;
        case 'notification:new':
          handleNewNotification(io, data);
          break;
        case 'user:status':
          handleUserStatus(io, data);
          break;
      }
    } catch (error) {
      console.error('Error processing Redis message:', error);
    }
  });

  return io;
};

const subscribeToUserChannels = (socket) => {
  if (!socket.userId) return;

  // Subscribe to user-specific Redis channel
  subscriber.subscribe(`user:${socket.userId}`, (err, count) => {
    if (err) {
      console.error(`Failed to subscribe to user ${socket.userId} channel:`, err);
    }
  });
};

const handleBookingUpdate = (io, data) => {
  // Emit to specific booking room
  io.to(`booking:${data.bookingId}`).emit('booking:updated', data);
  
  // Also emit to involved users
  if (data.userIds) {
    data.userIds.forEach(userId => {
      io.to(`user:${userId}`).emit('booking:updated', data);
    });
  }
};

const handleNewNotification = (io, data) => {
  // Emit to specific user
  io.to(`user:${data.userId}`).emit('notification:new', data);
};

const handleUserStatus = (io, data) => {
  io.emit('user:status', data);
};

module.exports = {
  initializeSocket,
  connectedUsers,
  userSockets
};