import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Use shared storage key with cleaner - messages will be shared
const CHAT_STORAGE_KEY = 'cleaner_message_threads_v1';

// Socket.io server URL - configure based on environment
const SOCKET_URL = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:4000';

const defaultMessages = [
  {
    id: 'seed-1',
    sender: 'cleaner',
    text: "Hi! I've accepted your cleaning request for tomorrow. I'll be arriving around 9 AM.",
    imageUrl: '',
    imageName: '',
    createdAt: '2026-03-10T10:42:00',
    status: 'seen'
  },
  {
    id: 'seed-2',
    sender: 'customer',
    text: 'Great! Looking forward to it. Please focus on the kitchen and bathrooms.',
    imageUrl: '',
    imageName: '',
    createdAt: '2026-03-10T10:45:00',
    status: 'seen'
  },
  {
    id: 'seed-3',
    sender: 'cleaner',
    text: 'No problem! I\'ll give extra attention to those areas. See you tomorrow!',
    imageUrl: '',
    imageName: '',
    createdAt: '2026-03-10T10:48:00',
    status: 'seen'
  }
];

const normalizeThreadId = (threadId) => String(threadId || 'default');

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(Boolean)
    .map((message, index) => ({
      id: String(message.id || `message-${index + 1}`),
      sender: message.sender === 'customer' ? 'customer' : 'cleaner',
      text: typeof message.text === 'string' ? message.text : '',
      imageUrl: typeof message.imageUrl === 'string' ? message.imageUrl : '',
      imageName: typeof message.imageName === 'string' ? message.imageName : '',
      createdAt: typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString(),
      edited: message.edited === true,
      status: message.status || 'sent'
    }))
    .filter((message) => message.text || message.imageUrl);
};

const readStoredThreads = () => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredThreads = (threads) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // Ignore storage failures so chat still works for the current session.
  }
};

const loadMessages = (threadId) => {
  const threads = readStoredThreads();
  const normalized = sanitizeMessages(threads[threadId]);
  return normalized.length ? normalized : defaultMessages;
};

export const formatCustomerChatTime = (createdAt) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

// Create a shared socket instance
let socketInstance = null;
const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socketInstance;
};

export const useCustomerChat = ({ threadId }) => {
  const normalizedThreadId = useMemo(() => normalizeThreadId(threadId), [threadId]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [isCleanerTyping, setIsCleanerTyping] = useState(false);
  
  // Track the thread that the current messages belong to so the write effect
  // never writes stale messages from a previous thread into a new thread.
  const activeThreadRef = useRef(normalizedThreadId);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const joinRoom = () => {
      // Join the booking room for this thread
      socket.emit('booking:join', normalizedThreadId);
      
      // Notify server that customer has joined (to mark messages as seen)
      socket.emit('chat:join', { 
        bookingId: normalizedThreadId, 
        userType: 'customer' 
      });
    };

    const onConnect = () => {
      console.log('[useCustomerChat] Socket connected');
      setIsConnected(true);
      joinRoom();
    };

    const onDisconnect = () => {
      console.log('[useCustomerChat] Socket disconnected');
      setIsConnected(false);
    };

    // Listen for message status updates from server
    const onMessageSent = ({ id }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === id ? { ...m, status: 'sent' } : m)
      );
    };

    const onMessageDelivered = ({ id }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === id ? { ...m, status: 'delivered' } : m)
      );
    };

    const onMessageSeen = ({ id }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === id ? { ...m, status: 'seen' } : m)
      );
    };

    const onMessagesSeen = ({ readerId }) => {
      setMessages((prev) => {
        const customerMessages = prev.filter((m) => m.sender === 'customer');
        if (customerMessages.length > 0) {
          const latestCustomerMessage = customerMessages[customerMessages.length - 1];
          if (latestCustomerMessage.status !== 'seen') {
            return prev.map((m) => 
              m.id === latestCustomerMessage.id ? { ...m, status: 'seen' } : m
            );
          }
        }
        return prev;
      });
    };

    // Listen for incoming messages from cleaner
    const onNewMessage = (message) => {
      setMessages((prev) => {
        // Prevent duplicates if message already exists
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, {
          ...message,
          sender: message.sender || 'cleaner',
          status: 'received'
        }];
      });

      // When receiving a new message, automatically mark it as seen
      setTimeout(() => {
        socket.emit('message:read', {
          threadId: normalizedThreadId,
          bookingId: normalizedThreadId
        });
      }, 500);
    };

    // Listen for typing indicator from cleaner
    const onUserTyping = ({ isTyping }) => {
      setIsCleanerTyping(isTyping);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:sent', onMessageSent);
    socket.on('message:delivered', onMessageDelivered);
    socket.on('message:seen', onMessageSeen);
    socket.on('messages:seen', onMessagesSeen);
    socket.on('message:new', onNewMessage);
    socket.on('user:typing', onUserTyping);

    // Connect if not already connected
    if (!socket.connected) {
      // Attach authentication data for the handshake
      const token = localStorage.getItem('token') || 'demo-customer-token';
      let userId = 'hen-narith';
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.id) userId = user.id;
      } catch (e) {}

      socket.auth = { token, userId };
      socket.connect();
    } else {
      setIsConnected(true);
      joinRoom();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:sent', onMessageSent);
      socket.off('message:delivered', onMessageDelivered);
      socket.off('message:seen', onMessageSeen);
      socket.off('messages:seen', onMessagesSeen);
      socket.off('message:new', onNewMessage);
      socket.off('user:typing', onUserTyping);
      
      socket.emit('booking:leave', normalizedThreadId);

      // Clear any pending typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [normalizedThreadId]);

  // Load messages when thread changes
  useEffect(() => {
    activeThreadRef.current = normalizedThreadId;
    setIsLoading(true);

    // Load messages immediately to prevent race conditions with socket events
    const messages = loadMessages(normalizedThreadId);
    setMessages(messages);
    setIsLoading(false);
  }, [normalizedThreadId]);

  // Save messages to localStorage
  useEffect(() => {
    if (activeThreadRef.current !== normalizedThreadId) return;
    if (messages === defaultMessages || messages.length === 0) return;
    const threads = readStoredThreads();
    const updated = { ...threads, [normalizedThreadId]: messages };
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      const fallback = messages.map(({ imageUrl, imageName, ...rest }) => rest);
      writeStoredThreads({ ...threads, [normalizedThreadId]: fallback });
    }
  }, [messages, normalizedThreadId]);

  // Fallback simulation for when socket is not available
  useEffect(() => {
    if (isConnected) return;
    
    const sending = messages.filter((m) => m.sender === 'customer' && m.status === 'sending');
    if (!sending.length) return;

    const ids = sending.map((m) => m.id);
    const mark = (status, delay) => setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => ids.includes(m.id) ? { ...m, status } : m)
      );
    }, delay);

    const t1 = mark('sent', 600);
    const t2 = mark('delivered', 1400);
    const t3 = setTimeout(() => {
      setMessages((prev) => {
        const customerMessages = prev.filter((m) => m.sender === 'customer');
        if (customerMessages.length > 0) {
          const latestId = customerMessages[customerMessages.length - 1].id;
          return prev.map((m) => m.id === latestId ? { ...m, status: 'seen' } : m);
        }
        return prev;
      });
    }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [messages, isConnected]);

  const markAsRead = useCallback(() => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('message:read', {
        threadId: normalizedThreadId,
        bookingId: normalizedThreadId
      });
    }
  }, [normalizedThreadId]);

  const notifyTyping = useCallback(() => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('typing', {
        bookingId: normalizedThreadId,
        isTyping: true
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          bookingId: normalizedThreadId,
          isTyping: false
        });
      }, 3000); // Stop typing after 3 seconds of inactivity
    }
  }, [normalizedThreadId]);

  const sendMessage = ({ text, attachment }) => {
    const trimmedText = String(text || '').trim();
    const imageUrl = attachment?.preview || '';
    const imageName = attachment?.name || '';
    const messageId = `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!trimmedText && !imageUrl) {
      return { success: false, error: 'Type a message or attach an image.' };
    }

    const newMessage = {
      id: messageId,
      sender: 'customer',
      text: trimmedText,
      imageUrl,
      imageName,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMessage]);

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('message:send', {
        threadId: normalizedThreadId,
        bookingId: normalizedThreadId,
        message: newMessage
      });
    }

    return { success: true };
  };

  const editMessage = ({ id, text }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id && m.sender === 'customer' ? { ...m, text, edited: true } : m
      )
    );
  };

  return {
    messages,
    sendMessage,
    editMessage,
    markAsRead,
    isConnected,
    isLoading,
    showLoadingIndicator,
    isCleanerTyping,
    notifyTyping
  };
};
