import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const CLEANER_CHAT_STORAGE_KEY = 'cleaner_message_threads_v1';

// Socket.io server URL - configure based on environment
const SOCKET_URL = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:4000';

const defaultMessages = [];

const normalizeThreadId = (threadId) => String(threadId || 'default');

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(Boolean)
    .filter((message) => !String(message.id || '').startsWith('auto-accept-'))
    .map((message, index) => ({
      id: String(message.id || `message-${index + 1}`),
      sender: message.sender === 'cleaner' ? 'cleaner' : 'customer',
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
    const raw = localStorage.getItem(CLEANER_CHAT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredThreads = (threads) => {
  try {
    localStorage.setItem(CLEANER_CHAT_STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // Ignore storage failures so chat still works for the current session.
  }
};

const loadMessages = (threadId) => {
  const threads = readStoredThreads();
  const normalized = sanitizeMessages(threads[threadId]);
  return normalized.length ? normalized : defaultMessages;
};

export const formatCleanerChatTime = (createdAt) => {
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

export const useCleanerChat = ({ threadId }) => {
  const normalizedThreadId = useMemo(() => normalizeThreadId(threadId), [threadId]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  
  // Track the thread that the current messages belong to so the write effect
  // never writes stale messages from a previous thread into a new thread.
  const activeThreadRef = useRef(normalizedThreadId);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      console.log('[useCleanerChat] Socket connected');
      setIsConnected(true);
      
      // Join the booking room for this thread
      socket.emit('booking:join', normalizedThreadId);
    };

    const onDisconnect = () => {
      console.log('[useCleanerChat] Socket disconnected');
      setIsConnected(false);
    };

    // Listen for message status updates from server
    const onMessageSent = ({ id }) => {
      console.log('[useCleanerChat] Message sent:', id);
      setMessages((prev) =>
        prev.map((m) => m.id === id ? { ...m, status: 'sent' } : m)
      );
    };

    const onMessageDelivered = ({ id }) => {
      console.log('[useCleanerChat] Message delivered:', id);
      setMessages((prev) =>
        prev.map((m) => m.id === id ? { ...m, status: 'delivered' } : m)
      );
    };

    const onMessageSeen = ({ id }) => {
      console.log('[useCleanerChat] Message seen:', id);
      // Only mark the specific message as seen (the latest one)
      setMessages((prev) =>
        prev.map((m) => m.id === id ? { ...m, status: 'seen' } : m)
      );
    };

    const onMessagesSeen = ({ readerId, messageId }) => {
      // When customer reads messages, mark the latest cleaner message as seen
      console.log('[useCleanerChat] Messages seen by:', readerId);
      setMessages((prev) => {
        const cleanerMessages = prev.filter((m) => m.sender === 'cleaner');
        if (cleanerMessages.length > 0) {
          const latestCleanerMessage = cleanerMessages[cleanerMessages.length - 1];
          // Only update if the message is not already seen
          if (latestCleanerMessage.status !== 'seen') {
            return prev.map((m) => 
              m.id === latestCleanerMessage.id ? { ...m, status: 'seen' } : m
            );
          }
        }
        return prev;
      });
    };

    // Listen for incoming messages from customer
    const onNewMessage = (message) => {
      console.log('[useCleanerChat] New message received:', message);
      setMessages((prev) => [...prev, {
        ...message,
        sender: 'customer',
        status: 'received'
      }]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:sent', onMessageSent);
    socket.on('message:delivered', onMessageDelivered);
    socket.on('message:seen', onMessageSeen);
    socket.on('messages:seen', onMessagesSeen);
    socket.on('message:new', onNewMessage);

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:sent', onMessageSent);
      socket.off('message:delivered', onMessageDelivered);
      socket.off('message:seen', onMessageSeen);
      socket.off('messages:seen', onMessagesSeen);
      socket.off('message:new', onNewMessage);
      
      // Leave the booking room on cleanup
      socket.emit('booking:leave', normalizedThreadId);
    };
  }, [normalizedThreadId]);

  // Load messages when thread changes
  useEffect(() => {
    activeThreadRef.current = normalizedThreadId;
    setIsLoading(true);
    
    // Show loading indicator only if loading takes longer than 500ms
    const showLoadingTimer = setTimeout(() => {
      setShowLoadingIndicator(true);
    }, 500);
    
    // Load messages
    const messages = loadMessages(normalizedThreadId);
    
    // If fast, show immediately. If slow, wait for 2s
    const loadTimer = setTimeout(() => {
      setMessages(messages);
      setIsLoading(false);
      setShowLoadingIndicator(false);
    }, 2000);
    
    return () => {
      clearTimeout(showLoadingTimer);
      clearTimeout(loadTimer);
    };
  }, [normalizedThreadId]);

  // Save messages to localStorage
  useEffect(() => {
    // Skip write if messages belong to a different thread (race between load & write effects).
    if (activeThreadRef.current !== normalizedThreadId) return;
    if (messages === defaultMessages || messages.length === 0) return;
    const threads = readStoredThreads();
    const updated = { ...threads, [normalizedThreadId]: messages };
    try {
      localStorage.setItem(CLEANER_CHAT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage quota exceeded — retry without imageUrl to save space.
      const fallback = messages.map(({ imageUrl, imageName, ...rest }) => rest);
      writeStoredThreads({ ...threads, [normalizedThreadId]: fallback });
    }
  }, [messages, normalizedThreadId]);

  // Fallback simulation for when socket is not available (demo mode)
  // This runs when isConnected is false and there's a pending message
  useEffect(() => {
    if (isConnected) return; // Skip simulation when socket is connected
    
    const sending = messages.filter((m) => m.sender === 'cleaner' && m.status === 'sending');
    if (!sending.length) return;

    const ids = sending.map((m) => m.id);
    const mark = (status, delay) => setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => ids.includes(m.id) ? { ...m, status } : m)
      );
    }, delay);

    const t1 = mark('sent', 600);
    const t2 = mark('delivered', 1400);
    // Only mark latest message as seen (not all messages)
    const t3 = setTimeout(() => {
      setMessages((prev) => {
        const cleanerMessages = prev.filter((m) => m.sender === 'cleaner');
        if (cleanerMessages.length > 0) {
          const latestId = cleanerMessages[cleanerMessages.length - 1].id;
          return prev.map((m) => 
            m.id === latestId ? { ...m, status: 'seen' } : m
          );
        }
        return prev;
      });
    }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [messages, isConnected]);

  // Function to emit message:read event when customer views messages
  const markAsRead = useCallback(() => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('message:read', {
        threadId: normalizedThreadId,
        bookingId: normalizedThreadId
      });
      console.log('[useCleanerChat] Emitted message:read for thread:', normalizedThreadId);
    }
  }, [normalizedThreadId]);

  const sendMessage = ({ text, attachment }) => {
    const trimmedText = String(text || '').trim();
    const imageUrl = attachment?.preview || '';
    const imageName = attachment?.name || '';
    const messageId = `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!trimmedText && !imageUrl) {
      return {
        success: false,
        error: 'Type a message or attach an image.'
      };
    }

    const newMessage = {
      id: messageId,
      sender: 'cleaner',
      text: trimmedText,
      imageUrl,
      imageName,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    // Add message locally first
    setMessages((prev) => [...prev, newMessage]);

    // Emit to socket if connected
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('message:send', {
        threadId: normalizedThreadId,
        bookingId: normalizedThreadId,
        message: newMessage
      });
      console.log('[useCleanerChat] Emitted message:send:', messageId);
    }

    return { success: true };
  };

  const editMessage = ({ id, text }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id && m.sender === 'cleaner'
          ? { ...m, text, edited: true }
          : m
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
    showLoadingIndicator
  };
};
