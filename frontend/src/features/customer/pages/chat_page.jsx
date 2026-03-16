import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, MessageOutlined } from '@ant-design/icons';
import CustomerMessagePanel from '../components/customer_message_panel';
import '../../../styles/customer/chat.scss';
import '../../../styles/cleaner/my_jobs.scss';
import api from '../../../services/api';

const DEMO_BOOKINGS = [];

const CustomerChatPage = () => {
  const [searchParams] = useSearchParams();
  const { bookingId: pathBookingId } = useParams();
  const navigate = useNavigate();
  const bookingId = pathBookingId || searchParams.get('booking');
  const ALERTED_BOOKING_PREFIX = 'alerted_booking_';
  const LAST_BOOKING_KEY = 'last_booking_id';

  const [dynamicBookings, setDynamicBookings] = useState([]);
  const [fallbackBookingId, setFallbackBookingId] = useState(() => {
    try {
      return localStorage.getItem(LAST_BOOKING_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const normalizeEntry = (trackData = {}, base = {}) => {
      const cleanerName =
        trackData.cleaner_display_name?.trim() ||
        trackData.cleaner_full_name?.trim() ||
        [trackData.cleaner_first_name, trackData.cleaner_last_name].filter(Boolean).join(' ').trim() ||
        'Assigned Cleaner';

      const dateStr = trackData.booking_date
        ? new Date(trackData.booking_date).toDateString()
        : base.booking_date
          ? new Date(base.booking_date).toDateString()
          : '';

      return {
        id: String(trackData.booking_id || base.booking_id || base.id || ''),
        jobId: `#JOB-${trackData.booking_id || base.booking_id || base.id || ''}`,
        title: trackData.service_name || base.service?.name || 'Cleaning',
        cleanerName,
        cleanerAvatar: trackData.cleaner_avatar || base.cleaner_avatar || '',
        cleanerPhone: trackData.cleaner_phone || base.cleaner_phone || '',
        cleanerEmail: trackData.cleaner_email || base.cleaner_email || '',
        customerName: trackData.customer_full_name || '',
        customerPhone: trackData.customer_phone || '',
        customerEmail: trackData.customer_email || '',
        date: dateStr,
        time: trackData.booking_time || base.booking_time || '',
        status: trackData.booking_status || base.booking_status || 'confirmed'
      };
    };

    const hydrateBookings = async () => {
      try {
        const listResp = await api.get('/bookings', {
          params: { status: 'confirmed' }
        });
        const bookings = listResp?.data?.data || [];

        const enriched = await Promise.all(
          bookings.map(async (b) => {
            try {
              const t = await api.get(`/bookings/track/${b.booking_id}`);
              const track = t?.data?.data || {};
              return normalizeEntry(track, b);
            } catch {
              return normalizeEntry({}, b);
            }
          })
        );

        if (bookingId && !enriched.some((b) => String(b.id) === String(bookingId))) {
          try {
            const t = await api.get(`/bookings/track/${bookingId}`);
            const track = t?.data?.data;
            if (track) {
              enriched.unshift(normalizeEntry(track));
            }
          } catch {
            /* ignore */
          }
        }

        // If still empty but we have a booking id, try direct track fetch
        const directId = bookingId || fallbackBookingId;
        let finalList = [...enriched].sort((a, b) => Number(b.id) - Number(a.id));
        if (!finalList.length && directId) {
          try {
            const t = await api.get(`/bookings/track/${directId}`);
            const track = t?.data?.data;
            if (track) finalList.push(normalizeEntry(track));
          } catch {
            /* ignore */
          }
        }

        setDynamicBookings(finalList);
      } catch (err) {
        // If list fetch fails, try at least to load the targeted booking
        if (bookingId) {
          try {
            const t = await api.get(`/bookings/track/${bookingId}`);
            const track = t?.data?.data;
            if (track) {
              setDynamicBookings([normalizeEntry(track)]);
              return;
            }
          } catch {
            /* ignore */
          }
        }
        setDynamicBookings([]);
      }
    };

    hydrateBookings();
  }, [bookingId, fallbackBookingId]);

  const [selectedBooking, setSelectedBooking] = useState(
    bookingId || dynamicBookings[0]?.id || null
  );

  useEffect(() => {
    if (!selectedBooking) {
      if (bookingId) {
        setSelectedBooking(bookingId);
      } else if (dynamicBookings[0]?.id) {
        setSelectedBooking(dynamicBookings[0].id);
      }
    }
  }, [dynamicBookings, selectedBooking, bookingId]);

  const activeBooking = useMemo(() => {
    const source = dynamicBookings;
    return source.find((b) => String(b.id) === String(selectedBooking)) || source[0];
  }, [dynamicBookings, selectedBooking]);

  // Alert the customer when a booking is confirmed (once per booking)
  useEffect(() => {
    if (!activeBooking?.id) return;
    const key = `${ALERTED_BOOKING_PREFIX}${activeBooking.id}`;
    try {
      if (
        String(activeBooking.status || '').toLowerCase() === 'confirmed' &&
        !localStorage.getItem(key)
      ) {
        alert(`Your cleaner accepted booking #${activeBooking.id}.`);
        localStorage.setItem(key, '1');
      }
    } catch {
      /* ignore storage issues */
    }
  }, [activeBooking]);

  if (!activeBooking) {
    return (
      <div className="customer-chat-page">
        <div className="customer-chat-empty">
          <MessageOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
          <h3>No Active Bookings</h3>
          <p>You don't have any confirmed bookings yet.</p>
          <button 
            type="button" 
            className="back-btn"
            onClick={() => navigate('/customer/bookings')}
          >
            Book a Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-chat-page">
      <div className="customer-chat-container">
        {/* Booking List Sidebar */}
        <aside className="customer-chat-sidebar">
          <div className="chat-sidebar-header">
            <button 
              type="button" 
              className="back-btn-icon"
              onClick={() => navigate('/customer/dashboard')}
              aria-label="Back to dashboard"
            >
              <ArrowLeftOutlined />
            </button>
            <h3>My Chats</h3>
          </div>

          <div className="chat-booking-list">
            {dynamicBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                className={`chat-booking-item ${selectedBooking === booking.id ? 'active' : ''}`}
                onClick={() => setSelectedBooking(booking.id)}
              >
                <div className="booking-avatar">
                  {booking.cleanerAvatar ? (
                    <img src={booking.cleanerAvatar} alt={booking.cleanerName} />
                  ) : (
                    booking.cleanerName.charAt(0)
                  )}
                </div>
                <div className="booking-info">
                  <strong>{booking.cleanerName}</strong>
                  <small>{booking.title}</small>
                  <span className="booking-date">{booking.date}</span>
                </div>
                {booking.status === 'confirmed' && (
                  <span className="booking-status confirmed">✓</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="customer-chat-main">
          <div className="customer-chat-header">
            <div className="chat-header-info">
              <h2>{activeBooking.cleanerName}</h2>
              <p>{activeBooking.title} - {activeBooking.jobId}</p>
              {activeBooking.cleanerPhone && (
                <small className="chat-meta-line">Phone: {activeBooking.cleanerPhone}</small>
              )}
              {activeBooking.cleanerEmail && (
                <small className="chat-meta-line">Email: {activeBooking.cleanerEmail}</small>
              )}
            </div>
            <div className="chat-header-meta">
              <span className="chat-date">{activeBooking.date}</span>
              <span className="chat-time">{activeBooking.time}</span>
            </div>
          </div>

          <CustomerMessagePanel
            threadId={activeBooking.id}
            cleanerName={activeBooking.cleanerName}
            subtitle={`${activeBooking.title} - ${activeBooking.jobId}`}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerChatPage;
