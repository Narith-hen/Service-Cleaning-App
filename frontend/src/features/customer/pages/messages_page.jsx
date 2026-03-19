import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import CustomerMessagePanel from '../components/customer_message_panel';
import api from '../../../services/api';
import { useChatStore } from '../../../store/chatStore';
import {
  ensureRealtimeSocketConnected,
  getRealtimeSocket
} from '../../../services/socketService';
import '../../../styles/cleaner/my_jobs.scss';
import '../../../styles/customer/messages.scss';

const CUSTOMER_CHAT_STORAGE_KEY = 'cleaner_message_threads_v1';

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
  booking_date: booking?.booking_date || new Date().toISOString(),
  booking_time: booking?.booking_time || '09:00 AM',
  address:
    booking?.address
    || booking?.location
    || booking?.service_location
    || booking?.service?.location
    || 'Location not provided',
  service: booking?.service || { name: booking?.service_name || booking?.serviceTitle || 'Cleaning Service' },
  cleaner: buildCleanerPayload(booking)
});

const getAuthToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.token || localStorage.getItem('token') || null;
  } catch {
    return localStorage.getItem('token') || null;
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
  const contentRef = useRef(null);
  const unreadByThread = useChatStore((state) => state.unreadByThread);
  const incrementUnread = useChatStore((state) => state.incrementUnread);
  const emptyPreviewText = 'Tap to open conversation.';

  const fetchTrackedBooking = async (bookingId) => {
    if (!bookingId || !getAuthToken()) return null;
    try {
      const response = await api.get(`/bookings/track/${bookingId}`);
      const data = response?.data?.data;
      return data ? normalizeBooking(data) : null;
    } catch {
      return null;
    }
  };

  const visibleBookings = useMemo(() => {
    if (bookings.length > 0) {
      return bookings;
    }

    const storedThreadIds = readStoredThreadIds();
    if (storedThreadIds.length > 0) {
      return storedThreadIds.map((id) =>
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
  }, [bookings]);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const selectedBookingId = searchParams.get('booking') || searchParams.get('thread');
      try {
        const response = await api.get('/bookings', { params: { page: 1, limit: 50 } });
        const bookingsData = response?.data?.data || [];
        let normalizedBookings = bookingsData.length > 0
          ? bookingsData.map(normalizeBooking)
          : [].map(normalizeBooking);

        if (selectedBookingId && !normalizedBookings.some((b) => b.booking_id === String(selectedBookingId))) {
          const trackedBooking = await fetchTrackedBooking(selectedBookingId);
          normalizedBookings = trackedBooking
            ? [trackedBooking, ...normalizedBookings]
            : [
              normalizeBooking({
                booking_id: selectedBookingId,
                booking_date: new Date().toISOString(),
                booking_time: '10:00 AM',
                address: '123 Harmony Lane, Bright City',
                service: { name: 'Custom Cleaning' },
                cleaner: { id: null, username: 'Cleaner' }
              }),
              ...normalizedBookings
            ];
        }

        const storedThreadIds = readStoredThreadIds();
        if (storedThreadIds.length) {
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

          if (getAuthToken()) {
            const toHydrate = storedThreadIds.filter((id) => !existing.has(String(id)));
            const hydrated = await Promise.all(
              toHydrate.map(async (id) => {
                try {
                  const resp = await api.get(`/bookings/track/${id}`);
                  const data = resp?.data?.data;
                  return data ? normalizeBooking(data) : null;
                } catch {
                  return null;
                }
              })
            );

            hydrated.filter(Boolean).forEach((entry) => {
              normalizedBookings = normalizedBookings.map((booking) =>
                String(booking.booking_id) === String(entry.booking_id) ? entry : booking
              );
            });
          }
        }

        setBookings(normalizedBookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        let normalizedBookings = [].map(normalizeBooking);
        if (selectedBookingId && !normalizedBookings.some((b) => b.booking_id === String(selectedBookingId))) {
          const trackedBooking = await fetchTrackedBooking(selectedBookingId);
          normalizedBookings = trackedBooking
            ? [trackedBooking, ...normalizedBookings]
            : [
              normalizeBooking({
                booking_id: selectedBookingId,
                booking_date: new Date().toISOString(),
                booking_time: '10:00 AM',
                address: '123 Harmony Lane, Bright City',
                service: { name: 'Custom Cleaning' },
                cleaner: { id: null, username: 'Cleaner' }
              }),
              ...normalizedBookings
            ];
        }
        const storedThreadIds = readStoredThreadIds();
        if (storedThreadIds.length) {
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

          if (getAuthToken()) {
            const toHydrate = storedThreadIds.filter((id) => !existing.has(String(id)));
            const hydrated = await Promise.all(
              toHydrate.map(async (id) => {
                try {
                  const resp = await api.get(`/bookings/track/${id}`);
                  const data = resp?.data?.data;
                  return data ? normalizeBooking(data) : null;
                } catch {
                  return null;
                }
              })
            );

            hydrated.filter(Boolean).forEach((entry) => {
              normalizedBookings = normalizedBookings.map((booking) =>
                String(booking.booking_id) === String(entry.booking_id) ? entry : booking
              );
            });
          }
        }
        setBookings(normalizedBookings);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
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
  const bookingTime = activeBooking?.booking_time || '09:00 AM';
  const bookingLocation = activeBooking?.address || 'Location not provided';

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
            <strong>All chats</strong>
            <MessageOutlined />
          </div>
          <div className="customer-messages-thread-list">
            {visibleBookings.map((booking, index) => {
              const threadId = String(booking.booking_id);
              const isActive = String(activeBooking?.booking_id) === threadId;
              const preview = threadPreviews[threadId] || emptyPreviewText;
              const unreadCount = unreadByThread[threadId] || 0;
              return (
                <button
                  key={threadId}
                  type="button"
                  className={`customer-messages-thread ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectThread(booking)}
                  data-customer-button
                  style={{ '--customer-reveal-delay': Math.min(index % 4, 3) }}
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
                    <span className="thread-time">{booking.booking_time || '09:00 AM'}</span>
                    {unreadCount > 0 && (
                      <span className="thread-unread">{unreadCount}</span>
                    )}
                  </div>
                </button>
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

                <div className="my-jobs-checklist-card">
                  <h6>Checklist Preview</h6>
                  <ul>
                    <li><CheckCircleOutlined /> Kitchen Deep Clean</li>
                    <li><CheckCircleOutlined /> Bathroom Sanitization</li>
                    <li><ClockCircleOutlined /> Window Cleaning (Pending)</li>
                  </ul>
                </div>

                <button type="button" className="my-jobs-contract-btn">
                  <FileTextOutlined /> View Full Job Contract
                </button>

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
