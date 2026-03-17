import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../../services/api';
import { useChatStore } from '../../../store/chatStore';
import { playChatSound } from '../../../utils/chatSound';

const CLEANER_CHAT_STORAGE_KEY = 'cleaner_message_threads_v1';

// Socket.io server URL - configure based on environment
const SOCKET_URL = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:4000';

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
      sender: message.sender === 'cleaner' ? 'cleaner' : 'customer',
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

const mapApiMessage = (message, currentUserId) => {
  const senderId = message?.sender_id != null ? String(message.sender_id) : '';
  const senderRole = message?.sender?.role?.role_name;
  const isCurrentUser = currentUserId && String(currentUserId) === senderId;

  let sender = 'customer';
  if (senderRole === 'cleaner' || senderRole === 'customer') {
    sender = senderRole;
  } else if (isCurrentUser) {
    sender = 'cleaner';
  }

  return {
    id: String(message?.id || `message-${Date.now()}`),
    sender,
    senderId: senderId || null,
    receiverId: message?.receiver_id != null ? String(message.receiver_id) : null,
    text: message?.message || '',
    imageUrl: message?.file_url || '',
    imageName: message?.file_type || '',
    createdAt: message?.created_at || new Date().toISOString(),
    edited: message?.edited === true,
    status: message?.is_read ? 'seen' : 'sent'
  };
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

export const useCleanerChat = ({ threadId, receiverId }) => {
  const normalizedThreadId = useMemo(() => normalizeThreadId(threadId), [threadId]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
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
    };

    const onConnect = () => {
      console.log('[useCleanerChat] Socket connected');
      setIsConnected(true);
      joinRoom();
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
      console.log('[useCleanerChat] Messages seen by:', readerId);
      if (messageId) {
        const seenId = String(messageId);
        setMessages((prev) => prev.map((m) => m.id === seenId ? { ...m, status: 'seen' } : m));
        return;
      }

      // Fallback: mark the latest cleaner message as seen.
      setMessages((prev) => {
        const cleanerMessages = prev.filter((m) => m.sender === 'cleaner');
        if (cleanerMessages.length > 0) {
          const latestCleanerMessage = cleanerMessages[cleanerMessages.length - 1];
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
      setMessages((prev) => {
        // Prevent duplicates if message already exists
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, {
          ...message,
          sender: message.sender || 'customer',
          status: 'received'
        }];
      });
      incrementUnread(normalizedThreadId);
      playChatSound('message', soundEnabled);
      if (message?.senderId || message?.sender_id || message?.receiverId || message?.receiver_id) {
        const currentUserId = String(getStoredUserId() || '');
        const senderId = String(message.senderId || message.sender_id || '');
        const receiverId = String(message.receiverId || message.receiver_id || '');
        const nextOtherId = senderId && senderId !== currentUserId ? senderId : receiverId;
        if (nextOtherId) setOtherUserId(String(nextOtherId));
      }
    };

    // Listen for typing indicator from customer
    const onUserTyping = ({ isTyping }) => {
      setIsCustomerTyping(isTyping);
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
      
      // Leave the booking room on cleanup
      socket.emit('booking:leave', normalizedThreadId);

      // Clear any pending typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [normalizedThreadId]);

  // Load messages when thread changes
  useEffect(() => {
    let cancelled = false;
    activeThreadRef.current = normalizedThreadId;
    setIsLoading(true);

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
      } catch {
        const fallback = loadMessages(normalizedThreadId);
        if (!cancelled) {
          setMessages(fallback);
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
  const markAsRead = useCallback(({ messageId } = {}) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('message:read', {
        threadId: normalizedThreadId,
        bookingId: normalizedThreadId,
        ...(messageId ? { messageId: String(messageId) } : {})
      });
      console.log('[useCleanerChat] Emitted message:read for thread:', normalizedThreadId);
    }

    if (getAuthToken()) {
      api.patch(`/messages/booking/${normalizedThreadId}/read`).catch(() => {});
    }
    clearUnread(normalizedThreadId);
  }, [normalizedThreadId, clearUnread]);

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

  const sendMessage = async ({ text, attachment }) => {
    const trimmedText = String(text || '').trim();
    const imageUrl = attachment?.preview || '';
    const imageName = attachment?.name || '';
    const imageFile = attachment?.file || null;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!trimmedText && !imageUrl) {
      return {
        success: false,
        error: 'Type a message or attach an image.'
      };
    }

    const optimisticMessage = {
      id: tempId,
      sender: 'cleaner',
      text: trimmedText,
      imageUrl,
      imageName,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    console.log('[useCleanerChat] Added optimistic message:', optimisticMessage);

    const token = getAuthToken();
    console.log('[useCleanerChat] Auth token:', token ? 'exists' : 'missing');
    
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

      console.log('[useCleanerChat] API Response:', response);

      const saved = response?.data?.data;
      console.log('[useCleanerChat] Saved message:', saved);
      const currentUserId = getStoredUserId();
      console.log('[useCleanerChat] Current user ID:', currentUserId);
      const mapped = saved ? mapApiMessage(saved, currentUserId) : optimisticMessage;
      console.log('[useCleanerChat] Mapped message:', mapped);
      mapped.status = 'sent';

      console.log('[useCleanerChat] Updating message with ID:', tempId);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? mapped : msg))
      );

      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit('message:send', {
          threadId: normalizedThreadId,
          bookingId: normalizedThreadId,
          message: mapped
        });
        console.log('[useCleanerChat] Emitted message:send:', mapped.id);
      }

      if (mapped.senderId || mapped.receiverId) {
        const nextOtherId = mapped.senderId && mapped.senderId === String(currentUserId)
          ? mapped.receiverId
          : mapped.senderId;
        if (nextOtherId) setOtherUserId(String(nextOtherId));
      }

      return { success: true };
    } catch (error) {
      console.error('[useCleanerChat] Send message error:', error);
      // On failure, remove the optimistic message from the UI
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      return {
        success: false,
        error: error?.response?.data?.message || 'Failed to send message. Check server connection.'
      };
    }
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
    showLoadingIndicator,
    isCustomerTyping,
    notifyTyping,
    otherUserId
  };
};
