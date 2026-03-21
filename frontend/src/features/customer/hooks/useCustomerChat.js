import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../../services/api';
import { useChatStore } from '../../../store/chatStore';
import { playChatSound } from '../../../utils/chatSound';

// Use shared storage key with cleaner - messages will be shared
const CHAT_STORAGE_KEY = 'cleaner_message_threads_v1';

// Socket.io server URL - configure based on environment
const SOCKET_URL = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:4000';

// Backend API URL for serving uploaded images
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper to get full image URL (handles both cloudinary and local uploads)
const getFullImageUrl = (fileUrl) => {
  if (!fileUrl) return '';
  // If it's already a full URL (cloudinary or external), return as is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  // If it's a local path, prepend the backend API URL
  if (fileUrl.startsWith('/uploads/')) {
    // Remove leading slash from fileUrl if present
    const cleanPath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    return `${API_BASE_URL}/${cleanPath}`;
  }
  return fileUrl;
};

const defaultMessages = [];

const normalizeThreadId = (threadId) => String(threadId || 'default');

const getStoredUserId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.id || stored?.user_id || null;
  } catch {
    return null;
  }
};

const getAuthToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.token || localStorage.getItem('token') || null;
  } catch {
    return localStorage.getItem('token') || null;
  }
};

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(Boolean)
    .filter((message) => !String(message.id || '').startsWith('auto-accept-'))
    .map((message, index) => ({
      id: String(message.id || `message-${index + 1}`),
      sender: message.sender === 'customer' ? 'customer' : 'cleaner',
      senderId: message.senderId || message.sender_id || null,
      receiverId: message.receiverId || message.receiver_id || null,
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

const mapApiMessage = (message, currentUserId) => {
  const senderId = message?.sender_id != null ? String(message.sender_id) : '';
  const senderRole = message?.sender?.role?.role_name;
  const isCurrentUser = currentUserId && String(currentUserId) === senderId;

  let sender = 'cleaner';
  if (senderRole === 'cleaner' || senderRole === 'customer') {
    sender = senderRole;
  } else if (isCurrentUser) {
    sender = 'customer';
  }

  return {
    id: String(message?.id || `message-${Date.now()}`),
    sender,
    senderId: senderId || null,
    receiverId: message?.receiver_id != null ? String(message.receiver_id) : null,
    text: message?.message || '',
    imageUrl: getFullImageUrl(message?.file_url || ''),
    imageName: message?.file_type || '',
    createdAt: message?.created_at || new Date().toISOString(),
    edited: message?.edited === true,
    status: message?.is_read ? 'seen' : 'sent'
  };
};

const unwrapRealtimeMessagePayload = (payload) => {
  if (payload?.message && typeof payload.message === 'object') {
    return {
      bookingId: String(payload.bookingId || payload.booking_id || payload.threadId || payload.message.booking_id || ''),
      message: payload.message
    };
  }

  return {
    bookingId: String(payload?.bookingId || payload?.booking_id || payload?.threadId || payload?.booking_id || ''),
    message: payload
  };
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

export const useCustomerChat = ({ threadId, receiverId }) => {
  const normalizedThreadId = useMemo(() => normalizeThreadId(threadId), [threadId]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [isCleanerTyping, setIsCleanerTyping] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [chatError, setChatError] = useState('');
  const soundEnabled = useChatStore((state) => state.soundEnabled);
  const setUserOnline = useChatStore((state) => state.setUserOnline);
  const setUserOffline = useChatStore((state) => state.setUserOffline);
  const incrementUnread = useChatStore((state) => state.incrementUnread);
  const clearUnread = useChatStore((state) => state.clearUnread);
  
  // Track the thread that the current messages belong to so the write effect
  // never writes stale messages from a previous thread into a new thread.
  const activeThreadRef = useRef(normalizedThreadId);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSoundRef = useRef(0);

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

    const onMessagesSeen = ({ messageId }) => {
      if (messageId) {
        const seenId = String(messageId);
        setMessages((prev) => prev.map((m) => m.id === seenId ? { ...m, status: 'seen' } : m));
        return;
      }

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
    const onNewMessage = (incomingPayload) => {
      const { bookingId: incomingBookingId, message: rawMessage } = unwrapRealtimeMessagePayload(incomingPayload);
      const currentUserId = getStoredUserId();
      const message = rawMessage?.message != null || rawMessage?.file_url != null
        ? mapApiMessage(rawMessage, currentUserId)
        : rawMessage;

      if (incomingBookingId && incomingBookingId !== normalizedThreadId) {
        incrementUnread(incomingBookingId);
        return;
      }

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
      if (message.sender !== 'customer') {
        incrementUnread(normalizedThreadId);
        playChatSound('message', soundEnabled);
      }
      if (message?.senderId || message?.sender_id || message?.receiverId || message?.receiver_id) {
        const normalizedCurrentUserId = String(currentUserId || '');
        const senderId = String(message.senderId || message.sender_id || '');
        const receiverId = String(message.receiverId || message.receiver_id || '');
        const nextOtherId = senderId && senderId !== normalizedCurrentUserId ? senderId : receiverId;
        if (nextOtherId) setOtherUserId(String(nextOtherId));
      }

    };

    // Listen for typing indicator from cleaner
    const onUserTyping = ({ isTyping }) => {
      setIsCleanerTyping(isTyping);
      if (isTyping) {
        const now = Date.now();
        if (now - lastTypingSoundRef.current > 2000) {
          playChatSound('typing', soundEnabled);
          lastTypingSoundRef.current = now;
        }
      }
    };

    const onUserOnline = ({ userId }) => {
      if (userId) setUserOnline(userId);
    };

    const onUserOffline = ({ userId }) => {
      if (userId) setUserOffline(userId);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:sent', onMessageSent);
    socket.on('message:delivered', onMessageDelivered);
    socket.on('message:seen', onMessageSeen);
    socket.on('messages:seen', onMessagesSeen);
    socket.on('message:new', onNewMessage);
    socket.on('user:typing', onUserTyping);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);

    // Connect if not already connected
    if (!socket.connected) {
      const token = getAuthToken();
      if (!token) {
        setIsConnected(false);
      } else {
        let userId = 'unknown';
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          if (user?.id) userId = user.id;
        } catch (e) {}

        socket.auth = { token, userId };
        socket.connect();
      }
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
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
      
      socket.emit('booking:leave', normalizedThreadId);

      // Clear any pending typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [normalizedThreadId, incrementUnread, soundEnabled, setUserOnline, setUserOffline]);

  // Load messages when thread changes
  useEffect(() => {
    let cancelled = false;
    activeThreadRef.current = normalizedThreadId;
    setIsLoading(true);
    setAccessDenied(false);
    setChatError('');

    const loadFromApi = async () => {
      if (!getAuthToken()) {
        const fallback = loadMessages(normalizedThreadId);
        if (!cancelled) {
          setMessages(fallback);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await api.get(`/messages/booking/${normalizedThreadId}`);
        const payload = response?.data?.data || [];
        const currentUserId = getStoredUserId();
        const mapped = payload.map((message) => mapApiMessage(message, currentUserId));
        if (!cancelled) {
          setAccessDenied(false);
          setChatError('');
          setMessages(mapped.length ? mapped : []);
          if (currentUserId && payload.length) {
            const first = payload.find((message) => message?.sender_id && message?.receiver_id);
            if (first) {
              const nextOtherId = String(first.sender_id) === String(currentUserId)
                ? first.receiver_id
                : first.sender_id;
              setOtherUserId(String(nextOtherId));
            }
          }
        }
      } catch (error) {
        const statusCode = Number(error?.response?.status || 0);
        const errorMessage = error?.response?.data?.message || 'Unable to load this conversation.';

        if (!cancelled) {
          if (statusCode === 401 || statusCode === 403) {
            setAccessDenied(true);
            setChatError(errorMessage);
            setMessages([]);
          } else {
            const fallback = loadMessages(normalizedThreadId);
            setMessages(fallback);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadFromApi();
    return () => {
      cancelled = true;
    };
  }, [normalizedThreadId, clearUnread]);


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

  const markAsRead = useCallback(({ messageId } = {}) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('message:read', {
        threadId: normalizedThreadId,
        bookingId: normalizedThreadId,
        ...(messageId ? { messageId: String(messageId) } : {})
      });
    }

    if (getAuthToken()) {
      api.patch(`/messages/booking/${normalizedThreadId}/read`).catch(() => {});
    }
    clearUnread(normalizedThreadId);
  }, [normalizedThreadId, clearUnread]);

  const notifyTyping = useCallback(() => {
    if (accessDenied) return;
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
  }, [normalizedThreadId, accessDenied]);

  const sendMessage = async ({ text, attachment }) => {
    const trimmedText = String(text || '').trim();
    const imageUrl = attachment?.preview || '';
    const imageName = attachment?.name || '';
    const imageFile = attachment?.file || null;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (accessDenied) {
      return {
        success: false,
        error: chatError || 'Not authorized to access this conversation'
      };
    }

    if (!trimmedText && !imageUrl) {
      return { success: false, error: 'Type a message or attach an image.' };
    }

    const optimisticMessage = {
      id: tempId,
      sender: 'customer',
      text: trimmedText,
      imageUrl,
      imageName,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    console.log('[useCustomerChat] Added optimistic message:', optimisticMessage);

    const token = getAuthToken();
    console.log('[useCustomerChat] Auth token:', token ? 'exists' : 'missing');

    if (!token) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      return {
        success: false,
        error: 'Please log in to send messages.'
      };
    }

    try {
      let resolvedUrl = imageUrl;
      let resolvedName = imageName;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadResponse = await api.post('/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        resolvedUrl = uploadResponse?.data?.data?.file_url || resolvedUrl;
        resolvedName = uploadResponse?.data?.data?.file_type || resolvedName;
      }

      const response = await api.post('/messages', {
        booking_id: normalizedThreadId,
        message: trimmedText,
        file_url: resolvedUrl || undefined,
        file_type: resolvedName || undefined,
        receiver_id: receiverId || otherUserId
      });

      console.log('[useCustomerChat] API Response:', response);

      const saved = response?.data?.data;
      console.log('[useCustomerChat] Saved message:', saved);
      const currentUserId = getStoredUserId();
      console.log('[useCustomerChat] Current user ID:', currentUserId);
      const mapped = saved ? mapApiMessage(saved, currentUserId) : optimisticMessage;
      console.log('[useCustomerChat] Mapped message:', mapped);
      mapped.status = 'sent';

      console.log('[useCustomerChat] Updating message with ID:', tempId);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? mapped : msg))
      );

      if (mapped.senderId || mapped.receiverId) {
        const nextOtherId = mapped.senderId && mapped.senderId === String(currentUserId)
          ? mapped.receiverId
          : mapped.senderId;
        if (nextOtherId) setOtherUserId(String(nextOtherId));
      }

      return { success: true };
    } catch (error) {
      console.error('[useCustomerChat] Send message error:', error);
      // Remove the optimistic message from the UI on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      const statusCode = Number(error?.response?.status || 0);
      const errorMessage = error?.response?.data?.message || 'Failed to send message. Check server connection.';
      if (statusCode === 401 || statusCode === 403) {
        setAccessDenied(true);
        setChatError(errorMessage);
      }
      return {
        success: false,
        error: errorMessage
      };
    }
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
    notifyTyping,
    otherUserId,
    accessDenied,
    chatError
  };
};
