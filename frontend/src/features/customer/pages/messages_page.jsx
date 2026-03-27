import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import CustomerMessagePanel from '../components/customer_message_panel';
import api from '../../../services/api';
import { useChatStore } from '../../../store/chatStore';
import { formatSingleTimeLabel } from '../../../utils/timeFormat';
import {
  ensureRealtimeSocketConnected,
  getRealtimeSocket
} from '../../../services/socketService';
import '../../../styles/cleaner/my_jobs.scss';
import '../../../styles/customer/messages.scss';

const CUSTOMER_CHAT_STORAGE_KEY = 'cleaner_message_threads_v1';
const CUSTOMER_HIDDEN_CHAT_STORAGE_KEY = 'customer_hidden_message_threads_v1';

// Backend API URL for serving uploaded files
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper to get full URL (handles both cloudinary and local uploads)
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

const getPreviewText = (messageList) => {
  if (!Array.isArray(messageList) || messageList.length === 0) return 'Tap to open conversation.';
  const last = [...messageList].reverse().find((msg) => msg && (msg.text || msg.imageUrl || msg.message || msg.file_url));
  if (!last) return 'Tap to open conversation.';
  const textValue = last.text || last.message;
  if (textValue) {
    const trimmed = String(textValue).trim();
    if (!trimmed) return 'Tap to open conversation.';
    return trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed;
  }
  if (last.imageName || last.file_type) return `Image: ${last.imageName || last.file_type}`;
  return 'Image attachment';
};

const buildCleanerPayload = (booking) => {
  const directCleaner = booking?.cleaner && typeof booking.cleaner === 'object' ? booking.cleaner : {};
  const cleanerName =
    directCleaner.username ||
    directCleaner.name ||
    booking?.cleaner_display_name ||
    booking?.cleaner_name ||
    booking?.cleaner_username ||
    booking?.cleaner_full_name ||
    [booking?.cleaner_first_name, booking?.cleaner_last_name].filter(Boolean).join(' ').trim() ||
    booking?.cleaner_company ||
    'Cleaner';

  return {
    ...directCleaner,
    id: directCleaner.id || booking?.cleaner_id || null,
    username: cleanerName,
    avatar: getFullImageUrl(directCleaner.avatar || booking?.cleaner_avatar || ''),
    phone: directCleaner.phone || booking?.cleaner_phone || '',
    email: directCleaner.email || booking?.cleaner_email || ''
  };
};

const normalizeBooking = (booking) => ({
  booking_id: String(booking?.booking_id || booking?.id || 'unknown'),
  booking_status: String(booking?.booking_status || booking?.status || '').toLowerCase(),
  booking_date: booking?.booking_date || new Date().toISOString(),
  booking_time: booking?.booking_time || '09:00 AM',
  total_price: booking?.total_price ?? booking?.price ?? null,
  negotiated_price: booking?.negotiated_price ?? null,
  address:
    booking?.address
    || booking?.location
    || booking?.service_location
    || booking?.service?.location
    || 'Location not provided',
  service: booking?.service || { name: booking?.service_name || booking?.serviceTitle || 'Cleaning Service' },
  cleaner: buildCleanerPayload(booking)
});

const formatMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return `$${numeric.toFixed(2)}`;
};

const getAuthToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.token || localStorage.getItem('token') || null;
  } catch {
    return localStorage.getItem('token') || null;
  }
};

const getStoredUserId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.id || stored?.user_id || null;
  } catch {
    return null;
  }
};

const readStoredThreadIds = () => {
  try {
    const raw = localStorage.getItem(CUSTOMER_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    return Object.keys(parsed || {}).filter((key) => key && /^\d+$/.test(String(key)));
  } catch {
    return [];
  }
};

const readStoredThreads = () => {
  try {
    const raw = localStorage.getItem(CUSTOMER_CHAT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredThreads = (threads) => {
  try {
    localStorage.setItem(CUSTOMER_CHAT_STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // Ignore storage failures for thread cleanup.
  }
};

const readHiddenThreadIds = () => {
  try {
    const raw = localStorage.getItem(CUSTOMER_HIDDEN_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
  } catch {
    return [];
  }
};

const writeHiddenThreadIds = (threadIds) => {
  try {
    localStorage.setItem(CUSTOMER_HIDDEN_CHAT_STORAGE_KEY, JSON.stringify(threadIds));
  } catch {
    // Ignore storage failures for thread visibility state.
  }
};

const extractRealtimeMessage = (payload) => {
  if (payload?.message && typeof payload.message === 'object') {
    return {
      bookingId: String(payload.bookingId || payload.booking_id || payload.message.booking_id || ''),
      message: payload.message
    };
  }

  return {
    bookingId: String(payload?.bookingId || payload?.booking_id || payload?.booking_id || ''),
    message: payload
  };
};

const CustomerMessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threadPreviews, setThreadPreviews] = useState({});
  const [activeThreadId, setActiveThreadId] = useState(
    searchParams.get('thread') || searchParams.get('booking')
  );
  const [hiddenThreadIds, setHiddenThreadIds] = useState(() => readHiddenThreadIds());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState([]);
  const contentRef = useRef(null);
  const unreadByThread = useChatStore((state) => state.unreadByThread);
  const incrementUnread = useChatStore((state) => state.incrementUnread);
  const emptyPreviewText = 'Tap to open conversation.';

  const fetchTrackedBooking = async (bookingId) => {
    if (!bookingId || !getAuthToken()) return null;
    try {
      const response = await api.get(`/bookings/track/${bookingId}`);
      const data = response?.data?.data;
      const normalized = data ? normalizeBooking(data) : null;
      const currentUserId = String(getStoredUserId() || '');
      if (!normalized || !currentUserId) return normalized;

      const bookingCustomerId = String(
        data?.user_id
        || data?.customer_id
        || data?.user?.id
        || data?.customer?.id
        || ''
      );

      return bookingCustomerId === currentUserId ? normalized : null;
    } catch {
      return null;
    }
  };

  const visibleBookings = useMemo(() => {
    const hidden = new Set(hiddenThreadIds.map((id) => String(id)));
    if (bookings.length > 0) {
      return bookings.filter((booking) => !hidden.has(String(booking.booking_id)));
    }

    const storedThreadIds = readStoredThreadIds();
    if (!getAuthToken() && storedThreadIds.length > 0) {
      return storedThreadIds
        .filter((id) => !hidden.has(String(id)))
        .map((id) =>
        normalizeBooking({
          booking_id: String(id),
          booking_date: new Date().toISOString(),
          booking_time: '09:00 AM',
          address: 'Location not provided',
          service: { name: 'Cleaning Service' },
          cleaner: { id: '11', username: 'Cleaner' }
        })
        );
    }

    return [];
  }, [bookings, hiddenThreadIds]);

  useEffect(() => {
    writeHiddenThreadIds(hiddenThreadIds);
  }, [hiddenThreadIds]);

  useEffect(() => {
    const visibleIds = new Set(visibleBookings.map((booking) => String(booking.booking_id)));
    setSelectedThreadIds((prev) => prev.filter((id) => visibleIds.has(String(id))));
    if (selectionMode && visibleIds.size === 0) {
      setSelectionMode(false);
    }
  }, [visibleBookings, selectionMode]);

  useEffect(() => {
    let cancelled = false;
    
    const fetchBookings = async () => {
      setLoading(true);
      const selectedBookingId = searchParams.get('booking') || searchParams.get('thread');
      try {
        const response = await api.get('/bookings', { params: { page: 1, limit: 50 } });
        if (cancelled) return;
        const bookingsData = response?.data?.data || [];
        let normalizedBookings = bookingsData.length > 0
          ? bookingsData.map(normalizeBooking)
          : [].map(normalizeBooking);

        if (selectedBookingId && !normalizedBookings.some((b) => b.booking_id === String(selectedBookingId))) {
          const trackedBooking = await fetchTrackedBooking(selectedBookingId);
          if (cancelled) return;
          normalizedBookings = trackedBooking
            ? [trackedBooking, ...normalizedBookings]
            : normalizedBookings;
        }

        const storedThreadIds = readStoredThreadIds();
        if (storedThreadIds.length && !getAuthToken()) {
          const existing = new Set(normalizedBookings.map((b) => String(b.booking_id)));
          const synthetic = storedThreadIds
            .filter((id) => !existing.has(String(id)))
            .map((id) =>
              normalizeBooking({
                booking_id: id,
                booking_date: new Date().toISOString(),
                booking_time: '09:00 AM',
                address: 'Location not provided',
                service: { name: 'Cleaning Service' },
                cleaner: { id: '11', username: 'Cleaner' }
              })
            );
          normalizedBookings = [...synthetic, ...normalizedBookings];

        }

        setBookings(normalizedBookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        if (cancelled) return;
        let normalizedBookings = [].map(normalizeBooking);
        const selectedBookingId = searchParams.get('booking') || searchParams.get('thread');
        if (selectedBookingId && !normalizedBookings.some((b) => b.booking_id === String(selectedBookingId))) {
          const trackedBooking = await fetchTrackedBooking(selectedBookingId);
          if (cancelled) return;
          normalizedBookings = trackedBooking
            ? [trackedBooking, ...normalizedBookings]
            : normalizedBookings;
        }
        const storedThreadIds = readStoredThreadIds();
        if (storedThreadIds.length && !getAuthToken()) {
          const existing = new Set(normalizedBookings.map((b) => String(b.booking_id)));
          const synthetic = storedThreadIds
            .filter((id) => !existing.has(String(id)))
            .map((id) =>
              normalizeBooking({
                booking_id: id,
                booking_date: new Date().toISOString(),
                booking_time: '09:00 AM',
                address: 'Location not provided',
                service: { name: 'Cleaning Service' },
                cleaner: { id: '11', username: 'Cleaner' }
              })
            );
          normalizedBookings = [...synthetic, ...normalizedBookings];

        }
        setBookings(normalizedBookings);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBookings();
    
    // Poll for booking updates every 3 seconds to get cleaner info when booking is confirmed
    const pollInterval = setInterval(() => {
      const selectedBookingId = searchParams.get('booking') || searchParams.get('thread');
      if (selectedBookingId) {
        api.get(`/bookings/track/${selectedBookingId}`)
          .then((resp) => {
            if (cancelled) return;
            const data = resp?.data?.data;
            if (data) {
              const normalized = normalizeBooking(data);
              setBookings((prev) => {
                const existing = new Set(prev.map((b) => String(b.booking_id)));
                if (existing.has(String(normalized.booking_id))) {
                  return prev.map((b) => 
                    String(b.booking_id) === String(normalized.booking_id) ? normalized : b
                  );
                }
                return [normalized, ...prev];
              });
            }
          })
          .catch(() => {}); // Ignore polling errors
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadPreviews = async () => {
      if (!visibleBookings.length) {
        setThreadPreviews({});
        return;
      }

      if (!getAuthToken()) {
        const fallbackMap = visibleBookings.reduce((acc, booking) => {
          const threadId = String(booking.booking_id);
          acc[threadId] = emptyPreviewText;
          return acc;
        }, {});
        if (!cancelled) {
          setThreadPreviews(fallbackMap);
        }
        return;
      }

      try {
        const entries = await Promise.all(
          visibleBookings.map(async (booking) => {
            const threadId = String(booking.booking_id);
            try {
              const response = await api.get(`/messages/booking/${threadId}`);
              const payload = response?.data?.data || [];
              return [threadId, getPreviewText(payload)];
            } catch {
              return [threadId, emptyPreviewText];
            }
          })
        );

        if (!cancelled) {
          setThreadPreviews(Object.fromEntries(entries));
        }
      } catch {
        if (!cancelled) {
          setThreadPreviews({});
        }
      }
    };

    loadPreviews();

    return () => {
      cancelled = true;
    };
  }, [visibleBookings, emptyPreviewText]);

  useEffect(() => {
    const paramThreadId = searchParams.get('thread') || searchParams.get('booking');
    if (paramThreadId && paramThreadId !== activeThreadId) {
      setActiveThreadId(paramThreadId);
    }
  }, [searchParams, activeThreadId]);

  useEffect(() => {
    const socket = ensureRealtimeSocketConnected();
    if (!socket) return undefined;

    const onNewMessage = (payload) => {
      const { bookingId, message } = extractRealtimeMessage(payload);
      if (!bookingId || !message) return;

      setHiddenThreadIds((prev) => prev.filter((id) => String(id) !== String(bookingId)));

      setThreadPreviews((prev) => ({
        ...prev,
        [bookingId]: getPreviewText([message])
      }));

      const currentActiveId = String(activeThreadId || '');
      const senderRole = String(message?.sender?.role?.role_name || message?.sender || '').toLowerCase();
      if (bookingId !== currentActiveId && senderRole === 'cleaner') {
        incrementUnread(bookingId);
      }

      setBookings((prev) => {
        if (prev.some((booking) => String(booking.booking_id) === bookingId)) {
          return prev;
        }

        return [
          normalizeBooking({
            booking_id: bookingId,
            booking_date: new Date().toISOString(),
            booking_time: '09:00 AM',
            service: { name: 'Cleaning Service' },
            cleaner: {
              id: message?.sender_id || message?.senderId || null,
              username: message?.sender?.username || 'Cleaner'
            }
          }),
          ...prev
        ];
      });
    };

    const onMessagesSeen = ({ bookingId }) => {
      if (!bookingId) return;
      if (String(activeThreadId || '') === String(bookingId)) {
        useChatStore.getState().clearUnread(bookingId);
      }
    };

    socket.on('message:new', onNewMessage);
    socket.on('messages:seen', onMessagesSeen);

    return () => {
      getRealtimeSocket().off('message:new', onNewMessage);
      getRealtimeSocket().off('messages:seen', onMessagesSeen);
    };
  }, [activeThreadId, incrementUnread]);

  // If `cleaner` query param is provided, prefer selecting threads for that cleaner
  useEffect(() => {
    const cleanerParam = searchParams.get('cleaner');
    if (!cleanerParam || !bookings.length) return;
    const matching = bookings.filter((b) => String(b.cleaner?.id || b.cleaner_id || '') === String(cleanerParam));
    if (matching.length) {
      const nextId = String(matching[0].booking_id);
      setActiveThreadId(nextId);
      const params = new URLSearchParams(searchParams);
      params.set('thread', nextId);
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, bookings, setSearchParams]);

  useEffect(() => {
    if (!visibleBookings.length) return;
    const normalizedActive = String(activeThreadId || '');
    const exists = visibleBookings.some((booking) => booking.booking_id === normalizedActive);
    if (exists) return;
    const first = visibleBookings[0];
    const nextId = String(first.booking_id);
    const params = new URLSearchParams(searchParams);
    params.set('thread', nextId);
    setSearchParams(params, { replace: true });
    setActiveThreadId(nextId);
  }, [visibleBookings, activeThreadId, searchParams, setSearchParams]);

  const activeBooking = useMemo(() => {
    if (!visibleBookings.length) return null;
    const activeId = String(activeThreadId || '');
    return visibleBookings.find((b) => b.booking_id === activeId) || visibleBookings[0];
  }, [visibleBookings, activeThreadId]);

  const handleToggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedThreadIds([]);
      return;
    }

    setSelectionMode(true);
  };

  const handleToggleThreadSelection = (threadId, event) => {
    event?.stopPropagation();
    const normalizedThreadId = String(threadId);

    setSelectedThreadIds((prev) => (
      prev.includes(normalizedThreadId)
        ? prev.filter((id) => id !== normalizedThreadId)
        : [...prev, normalizedThreadId]
    ));
  };

  const handleSelectAllThreads = () => {
    const visibleIds = visibleBookings.map((booking) => String(booking.booking_id));
    if (!visibleIds.length) return;

    setSelectedThreadIds((prev) => (
      prev.length === visibleIds.length ? [] : visibleIds
    ));
  };

  const deleteThreads = (threadIds) => {
    const normalizedIds = [...new Set(threadIds.map((id) => String(id)).filter(Boolean))];
    if (!normalizedIds.length) return;

    const targetIds = new Set(normalizedIds);

    setHiddenThreadIds((prev) => [...new Set([...prev, ...normalizedIds])]);
    setBookings((prev) => prev.filter((item) => !targetIds.has(String(item.booking_id))));
    setThreadPreviews((prev) => {
      const next = { ...prev };
      normalizedIds.forEach((threadId) => {
        delete next[threadId];
      });
      return next;
    });

    const storedThreads = readStoredThreads();
    if (Object.keys(storedThreads).some((threadId) => targetIds.has(String(threadId)))) {
      const nextStoredThreads = { ...storedThreads };
      normalizedIds.forEach((threadId) => {
        delete nextStoredThreads[threadId];
      });
      writeStoredThreads(nextStoredThreads);
    }

    normalizedIds.forEach((threadId) => {
      useChatStore.getState().clearUnread(threadId);
    });

    setSelectedThreadIds((prev) => prev.filter((id) => !targetIds.has(String(id))));
    if (selectionMode) {
      setSelectionMode(false);
    }

    if (targetIds.has(String(activeThreadId || ''))) {
      const remaining = visibleBookings.filter((item) => !targetIds.has(String(item.booking_id)));
      const params = new URLSearchParams(searchParams);
      if (remaining.length > 0) {
        const nextId = String(remaining[0].booking_id);
        params.set('thread', nextId);
        setSearchParams(params, { replace: true });
        setActiveThreadId(nextId);
      } else {
        params.delete('thread');
        params.delete('booking');
        params.delete('cleaner');
        setSearchParams(params, { replace: true });
        setActiveThreadId(null);
      }
    }
  };

  const handleSelectThread = (booking) => {
    const nextId = String(booking.booking_id);
    const params = new URLSearchParams(searchParams);
    params.set('thread', nextId);
    setSearchParams(params, { replace: true });
    setActiveThreadId(nextId);

    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 980px)').matches) {
      window.requestAnimationFrame(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const handleDeleteThread = (booking, event) => {
    event.stopPropagation();
    const threadId = String(booking.booking_id);
    const cleanerLabel = booking.cleaner?.username || 'this cleaner';
    const confirmed = window.confirm(`Delete this chat with ${cleanerLabel}?`);
    if (!confirmed) return;

    deleteThreads([threadId]);
  };

  const handleDeleteSelectedThreads = () => {
    if (!selectedThreadIds.length) return;

    const confirmed = window.confirm(
      selectedThreadIds.length === visibleBookings.length
        ? 'Delete all chats?'
        : `Delete ${selectedThreadIds.length} selected chats?`
    );
    if (!confirmed) return;

    deleteThreads(selectedThreadIds);
  };

  if (loading) {
    return (
      <div className="customer-messages-page" style={{ padding: '24px', minHeight: '100%' }}>
        <div className="customer-messages-empty">
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!visibleBookings.length) {
    return (
      <div className="customer-messages-page" style={{ padding: '24px', minHeight: '100%' }}>
        <div className="customer-messages-empty">
          <MessageOutlined />
          <h3>No messages yet</h3>
          <p>Your conversations with cleaners will appear here after you make a booking.</p>
        </div>
      </div>
    );
  }

  const cleanerName = activeBooking?.cleaner?.username || 'Cleaner';
  const cleanerAvatar = activeBooking?.cleaner?.avatar || '';
  const cleanerId = activeBooking?.cleaner?.id || activeBooking?.cleaner_id || '';
  const serviceName = activeBooking?.service?.name || 'Cleaning Service';
  const jobId = `#SOMA-${activeBooking?.booking_id}`;
  const bookingDate = activeBooking
    ? new Date(activeBooking.booking_date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    : '';
  const bookingTime = formatSingleTimeLabel(activeBooking?.booking_time || '09:00 AM', '09:00 AM');
  const bookingLocation =
    activeBooking?.address
    || activeBooking?.location
    || activeBooking?.service_location
    || activeBooking?.service?.location
    || 'Location not provided';
  const negotiatedPrice = activeBooking?.negotiated_price != null
    ? formatMoney(activeBooking.negotiated_price)
    : '';
  const allVisibleSelected = visibleBookings.length > 0 && selectedThreadIds.length === visibleBookings.length;

  return (
    <div className="customer-messages-page" style={{ padding: '24px', minHeight: '100%' }}>
      <div className="customer-messages-header" data-customer-reveal>
        <div>
          <p className="customer-messages-kicker">Conversations</p>
          <h1>Messages</h1>
        </div>
        <span className="customer-messages-count">{visibleBookings.length} threads</span>
      </div>

      <div className="customer-messages-shell">
        <aside
          className="customer-messages-list"
          data-customer-reveal
          data-customer-panel
          style={{ '--customer-reveal-delay': 1 }}
        >
          <div className="customer-messages-list-header">
            <div className="customer-messages-list-header-copy">
              <strong>All chats</strong>
              {selectionMode && (
                <span>{selectedThreadIds.length} selected</span>
              )}
            </div>
            <div className="customer-messages-list-actions">
              {selectionMode ? (
                <>
                  <button
                    type="button"
                    className="customer-messages-list-action"
                    onClick={handleSelectAllThreads}
                  >
                    {allVisibleSelected ? 'Clear all' : 'Select all'}
                  </button>
                  <button
                    type="button"
                    className="customer-messages-list-action customer-messages-list-action-danger"
                    onClick={handleDeleteSelectedThreads}
                    disabled={!selectedThreadIds.length}
                  >
                    Delete selected
                  </button>
                  <button
                    type="button"
                    className="customer-messages-list-action"
                    onClick={handleToggleSelectionMode}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="customer-messages-list-action"
                    onClick={handleToggleSelectionMode}
                  >
                    Select
                  </button>
                  <MessageOutlined />
                </>
              )}
            </div>
          </div>
          <div className="customer-messages-thread-list">
            {visibleBookings.map((booking, index) => {
              const threadId = String(booking.booking_id);
              const isActive = String(activeBooking?.booking_id) === threadId;
              const isSelected = selectedThreadIds.includes(threadId);
              const preview = threadPreviews[threadId] || emptyPreviewText;
              const unreadCount = unreadByThread[threadId] || 0;
              return (
                <div
                  key={threadId}
                  className={`customer-messages-thread-row ${isActive ? 'active' : ''} ${selectionMode ? 'selecting' : ''} ${isSelected ? 'selected' : ''}`}
                  style={{ '--customer-reveal-delay': Math.min(index % 4, 3) }}
                >
                  {selectionMode && (
                    <button
                      type="button"
                      className={`customer-messages-thread-check ${isSelected ? 'selected' : ''}`}
                      onClick={(event) => handleToggleThreadSelection(threadId, event)}
                      aria-label={`${isSelected ? 'Deselect' : 'Select'} chat with ${booking.cleaner?.username || 'Cleaner'}`}
                      title={isSelected ? 'Deselect chat' : 'Select chat'}
                    >
                      <span />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`customer-messages-thread ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (selectionMode) {
                        handleToggleThreadSelection(threadId);
                        return;
                      }
                      handleSelectThread(booking);
                    }}
                    data-customer-button
                  >
                    <div className="thread-avatar">
                      {booking.cleaner?.avatar ? (
                        <img src={booking.cleaner.avatar} alt={booking.cleaner?.username || 'Cleaner'} className="thread-avatar-image" />
                      ) : (
                        (booking.cleaner?.username || 'C').charAt(0)
                      )}
                    </div>
                    <div className="thread-meta">
                      <strong>{booking.cleaner?.username || 'Cleaner'}</strong>
                      <span>{preview}</span>
                    </div>
                    <div className="thread-meta-right">
                      {unreadCount > 0 && (
                        <span className="thread-unread">{unreadCount}</span>
                      )}
                    </div>
                  </button>
                  {!selectionMode && (
                    <button
                      type="button"
                      className="customer-messages-thread-delete"
                      onClick={(event) => handleDeleteThread(booking, event)}
                      aria-label={`Delete chat with ${booking.cleaner?.username || 'Cleaner'}`}
                      title="Delete chat"
                    >
                      <DeleteOutlined />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="customer-messages-content" ref={contentRef} data-customer-reveal style={{ '--customer-reveal-delay': 2 }}>
          {activeBooking && (
            <div className="my-jobs-message-view">
              <CustomerMessagePanel
                key={String(activeBooking.booking_id)}
                threadId={String(activeBooking.booking_id)}
                cleanerName={cleanerName}
                cleanerAvatar={cleanerAvatar}
                subtitle={`${serviceName} Job - ${jobId}`}
                cleanerId={String(cleanerId)}
              />

              <aside className="my-jobs-details-panel">
                <h5>JOB DETAILS</h5>

                <div className="my-jobs-details-card">
                  <div className="my-jobs-detail-row">
                    <span className="my-jobs-detail-icon"><CalendarOutlined /></span>
                    <div>
                      <small>Date &amp; Time</small>
                      <strong>{bookingDate}, {bookingTime}</strong>
                    </div>
                  </div>
                  <div className="my-jobs-detail-row">
                    <span className="my-jobs-detail-icon"><EnvironmentOutlined /></span>
                    <div>
                      <small>Location</small>
                      <strong>{bookingLocation}</strong>
                    </div>
                  </div>

                </div>

                <div className="my-jobs-details-card my-jobs-details-card--service">
                  <div className="my-jobs-detail-row">
                    <span className="my-jobs-detail-icon"><FileTextOutlined /></span>
                    <div>
                      <small>Service</small>
                      <strong>{serviceName}</strong>
                    </div>
                  </div>
                </div>

                <button type="button" className="my-jobs-contract-btn">
                  <FileTextOutlined /> View Full Job Contract
                </button>

                {negotiatedPrice && (
                  <div className="my-jobs-price-card">
                    <div className="my-jobs-price-header">
                      <div>
                        <small>NEGOTIATED PRICE</small>
                        <strong>{negotiatedPrice}</strong>
                      </div>
                      <span className="my-jobs-price-badge">Cleaner</span>
                    </div>
                    <p className="my-jobs-price-status">Your cleaner submitted a new agreed price.</p>
                  </div>
                )}

                <div className="my-jobs-map-preview" />
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerMessagesPage;





