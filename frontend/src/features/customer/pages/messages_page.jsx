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
    username:
      booking?.cleaner_name
      || [booking?.cleaner_first_name, booking?.cleaner_last_name].filter(Boolean).join(' ').trim()
      || booking?.cleaner_username
      || 'Cleaner'
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

const CustomerMessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threadPreviews, setThreadPreviews] = useState({});
  const [activeThreadId, setActiveThreadId] = useState(
    searchParams.get('thread') || searchParams.get('booking')
  );
  const unreadByThread = useChatStore((state) => state.unreadByThread);

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
          acc[threadId] = 'Tap to open conversation.';
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
              return [threadId, 'Tap to open conversation.'];
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
    if (!bookings.length) return;
    const normalizedActive = String(activeThreadId || '');
    const exists = bookings.some((booking) => booking.booking_id === normalizedActive);
    if (exists) return;
    const first = bookings[0];
    const nextId = String(first.booking_id);
    const params = new URLSearchParams(searchParams);
    params.set('thread', nextId);
    setSearchParams(params, { replace: true });
    setActiveThreadId(nextId);
  }, [bookings, activeThreadId, searchParams, setSearchParams]);

  const activeBooking = useMemo(() => {
    if (!bookings.length) return null;
    const activeId = String(activeThreadId || '');
    return bookings.find((b) => b.booking_id === activeId) || bookings[0];
  }, [bookings, activeThreadId]);

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

  if (!bookings.length) {
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
        <span className="customer-messages-count">{bookings.length} threads</span>
      </div>

      <div className="customer-messages-shell">
        <aside className="customer-messages-list">
          <div className="customer-messages-list-header">
            <strong>All chats</strong>
            <MessageOutlined />
          </div>
          <div className="customer-messages-thread-list">
            {bookings.map((booking) => {
              const threadId = String(booking.booking_id);
              const isActive = String(activeBooking?.booking_id) === threadId;
              const preview = threadPreviews[threadId] || 'Tap to open conversation.';
              const unreadCount = unreadByThread[threadId] || 0;
              return (
                <button
                  key={threadId}
                  type="button"
                  className={`customer-messages-thread ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectThread(booking)}
                >
                  <div className="thread-avatar">{(booking.cleaner?.username || 'C').charAt(0)}</div>
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
                subtitle={`${serviceName} Job - ${jobId}`}
                cleanerId={String(activeBooking.cleaner_id)}
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
