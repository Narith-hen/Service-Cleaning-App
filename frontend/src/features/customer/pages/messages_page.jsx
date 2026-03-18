import React, { useEffect, useMemo, useState } from 'react';
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
import '../../../styles/cleaner/my_jobs.scss';
import '../../../styles/customer/messages.scss';

const fallbackBookings = [];
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
  cleaner: booking?.cleaner || {
    id: booking?.cleaner_id || null,
    username: booking?.cleaner_username || booking?.cleaner_display_name || 'Cleaner',
    avatar: getFullImageUrl(booking?.cleaner_avatar || ''),
    phone: booking?.cleaner_phone || '',
    email: booking?.cleaner_email || ''
  }
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
    return Object.keys(parsed || {}).filter((key) => key && key !== 'default');
  } catch {
    return [];
  }
};

const hasStoredMessages = (threadId) => {
  try {
    const raw = localStorage.getItem(CUSTOMER_CHAT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const list = parsed && typeof parsed === 'object' ? parsed[String(threadId)] : null;
    return Array.isArray(list) && list.length > 0;
  } catch {
    return false;
  }
};

const CustomerMessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threadPreviews, setThreadPreviews] = useState({});
  const [activeThreadId, setActiveThreadId] = useState(
    searchParams.get('thread') || searchParams.get('booking')
  );
  const unreadByThread = useChatStore((state) => state.unreadByThread);
  const emptyPreviewText = 'Tap to open conversation.';

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await api.get('/bookings', { params: { page: 1, limit: 50 } });
        const bookingsData = response?.data?.data || [];
        let normalizedBookings = bookingsData.length > 0
          ? bookingsData.map(normalizeBooking)
          : [].map(normalizeBooking);

        const bookingId = searchParams.get('booking') || searchParams.get('thread');
        if (bookingId && !normalizedBookings.some((b) => b.booking_id === String(bookingId))) {
          normalizedBookings = [
            normalizeBooking({
              booking_id: bookingId,
              booking_date: new Date().toISOString(),
              booking_time: '10:00 AM',
              address: '123 Harmony Lane, Bright City',
              service: { name: 'Custom Cleaning' },
              cleaner: { id: '11', username: 'Cleaner 1' }
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
        const bookingId = searchParams.get('booking') || searchParams.get('thread');
        if (bookingId && !normalizedBookings.some((b) => b.booking_id === String(bookingId))) {
          normalizedBookings = [
            normalizeBooking({
              booking_id: bookingId,
              booking_date: new Date().toISOString(),
              booking_time: '10:00 AM',
              address: '123 Harmony Lane, Bright City',
              service: { name: 'Custom Cleaning' },
              cleaner: { id: '11', username: 'Cleaner 1' }
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
      if (!bookings.length) {
        setThreadPreviews({});
        return;
      }

        if (!getAuthToken()) {
          const fallbackMap = bookings.reduce((acc, booking) => {
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
          bookings.map(async (booking) => {
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
  }, [bookings]);

  useEffect(() => {
    const paramThreadId = searchParams.get('thread') || searchParams.get('booking');
    if (paramThreadId && paramThreadId !== activeThreadId) {
      setActiveThreadId(paramThreadId);
    }
  }, [searchParams, activeThreadId]);

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

  const visibleBookings = useMemo(() => {
    if (!bookings.length) return [];
    const forcedId = String(searchParams.get('booking') || searchParams.get('thread') || '');
    return bookings.filter((booking) => {
      const threadId = String(booking.booking_id);
      if (forcedId && threadId === forcedId) return true;
      const preview = threadPreviews[threadId];
      const unreadCount = unreadByThread[threadId] || 0;
      if (unreadCount > 0) return true;
      if (preview && preview !== emptyPreviewText) return true;
      return hasStoredMessages(threadId);
    });
  }, [bookings, threadPreviews, unreadByThread, emptyPreviewText, searchParams]);

  const handleSelectThread = (booking) => {
    const nextId = String(booking.booking_id);
    const params = new URLSearchParams(searchParams);
    params.set('thread', nextId);
    setSearchParams(params, { replace: true });
    setActiveThreadId(nextId);
  };

  if (loading) {
    return (
      <div className="customer-messages-page">
        <div className="customer-messages-empty">
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!bookings.length || !visibleBookings.length) {
    return (
      <div className="customer-messages-page">
        <div className="customer-messages-empty">
          <MessageOutlined />
          <h3>No messages yet</h3>
          <p>Your conversations will appear here once you have a confirmed booking.</p>
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
    <div className="customer-messages-page">
      <div className="customer-messages-header">
        <div>
          <p className="customer-messages-kicker">Conversations</p>
          <h1>Messages</h1>
        </div>
        <span className="customer-messages-count">{visibleBookings.length} threads</span>
      </div>

      <div className="customer-messages-shell">
        <aside className="customer-messages-list">
          <div className="customer-messages-list-header">
            <strong>All chats</strong>
            <MessageOutlined />
          </div>
          <div className="customer-messages-thread-list">
            {visibleBookings.map((booking) => {
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

        <div className="customer-messages-content">
          {activeBooking && (
            <div className="my-jobs-message-view">
              <CustomerMessagePanel
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
