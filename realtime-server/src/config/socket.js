const { Server } = require('socket.io');
const { redis, subscriber } = require('./redis');
const jwt = require('jsonwebtoken');

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

      const secret = process.env.JWT_SECRET || 'dev-local-jwt-secret-change-me';
      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.user_id;
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

    // Handle cleaner joining the general cleaners room
    socket.on('join:cleaners', () => {
      socket.join('cleaners-room');
      console.log(`User ${socket.userId} joined the general cleaners room.`);
    });

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

    // Handle customer joining a matching room while waiting for a cleaner
    socket.on('join:matching', (bookingId) => {
      socket.join(`booking:${bookingId}`);
      console.log(`User ${socket.userId} is waiting for a match for booking: ${bookingId}`);
    });

    // Handle message read event
    socket.on('message:read', (data) => {
      // When a user reads messages in a booking, notify others in the room.
      // The client will determine if they are the recipient and should update the UI.
      const bookingId = data?.bookingId;
      if (!bookingId) return;

      const messageId = data?.messageId != null && String(data.messageId).trim() !== ''
        ? String(data.messageId)
        : null;

      socket.to(`booking:${bookingId}`).emit('messages:seen', {
        readerId: socket.userId,
        ...(messageId ? { messageId } : {})
      });

      // Back-compat: some clients listen for a single-message seen event.
      if (messageId) {
        socket.to(`booking:${bookingId}`).emit('message:seen', {
          id: messageId,
          readerId: socket.userId
        });
      }
    });

    // Handle sending a new message
    socket.on('message:send', (data) => {
      const { bookingId, message } = data;
      
      if (!bookingId || !message) return;

      const senderId = String(message.senderId || message.sender_id || '');
      if (!senderId || senderId !== String(socket.userId)) {
        console.warn('Rejected message: sender mismatch', senderId, socket.userId);
        return;
      }
      
      // Broadcast the new message to others in the booking room
      socket.to(`booking:${bookingId}`).emit('message:new', message);
      
      // Confirm the message was sent to the sender
      socket.emit('message:sent', { id: message.id });
      
      // After a delay, mark as delivered
      setTimeout(() => {
        socket.emit('message:delivered', { id: message.id });
        
        // Notify the other party about delivery
        socket.to(`booking:${bookingId}`).emit('message:delivered', { id: message.id });
      }, 500);
      
      console.log(`Message sent in booking ${bookingId}:`, message.id);
    });

    // Handle customer joining a chat (mark messages as seen)
    socket.on('chat:join', (data) => {
      const { bookingId, userType } = data;
      
      if (!bookingId) return;
      
      // Only customers mark messages as seen when they join
      if (userType === 'customer') {
        // After a short delay, notify the cleaner that messages were seen
        setTimeout(() => {
          socket.to(`booking:${bookingId}`).emit('messages:seen', {
            readerId: socket.userId,
            timestamp: Date.now()
          });
          console.log(`Customer ${socket.userId} seen messages in booking ${bookingId}`);
        }, 800); // Small delay to simulate reading
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.to(`booking:${data.bookingId}`).emit('user:typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    });

    // Handle new job posting from customer
    socket.on('job:new', (jobDetails) => {
      // Broadcast to all cleaners in the cleaners-room
      io.to('cleaners-room').emit('job:available', jobDetails);
      console.log('New job available, notifying cleaners:', jobDetails.bookingId);
    });

    // Handle cleaner accepting a job
    socket.on('job:accepted', ({ bookingId, cleaner }) => {
      // Notify the customer on the matching page
      io.to(`booking:${bookingId}`).emit('job:matched', { bookingId, cleaner });
      // Notify other cleaners to remove this job from their list
      io.to('cleaners-room').emit('job:removed', { bookingId });
      console.log(`Job ${bookingId} was accepted by cleaner ${cleaner.id}`);
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
