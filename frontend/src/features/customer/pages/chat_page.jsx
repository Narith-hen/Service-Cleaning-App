import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, MessageOutlined } from '@ant-design/icons';
import CustomerMessagePanel from '../components/customer_message_panel';
import '../../../styles/customer/chat.scss';
import '../../../styles/cleaner/my_jobs.scss';
import api from '../../../services/api';

// Fallback data when API is unavailable
const DEMO_BOOKINGS = [
  {
    id: 'booking-1',
    jobId: '#SOMA-48291',
    title: 'Deep House Cleaning',
    cleanerName: 'Maria Garcia',
    date: 'March 24, 2026',
    time: '09:00 AM - 12:00 PM',
    status: 'confirmed'
  }
];

const CustomerChatPage = () => {
  const [searchParams] = useSearchParams();
  const { bookingId: pathBookingId } = useParams();
  const navigate = useNavigate();
  const bookingId = pathBookingId || searchParams.get('booking');

  const [dynamicBookings, setDynamicBookings] = useState([]);

  useEffect(() => {
    const normalizeEntry = (trackData = {}, base = {}) => {
      const cleanerName =
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

        setDynamicBookings(enriched.length ? enriched : DEMO_BOOKINGS);
      } catch {
        setDynamicBookings(DEMO_BOOKINGS);
      }
    };

    hydrateBookings();
  }, [bookingId]);

  const [selectedBooking, setSelectedBooking] = useState(
    bookingId || dynamicBookings[0]?.id || null
  );

  useEffect(() => {
    const source = dynamicBookings.length ? dynamicBookings : DEMO_BOOKINGS;
    if (!selectedBooking && source[0]?.id) {
      setSelectedBooking(source[0].id);
    }
  }, [dynamicBookings, selectedBooking]);

  const activeBooking = useMemo(() => {
    const source = dynamicBookings.length ? dynamicBookings : DEMO_BOOKINGS;
    return source.find((b) => String(b.id) === String(selectedBooking)) || source[0];
  }, [dynamicBookings, selectedBooking]);

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
            {(dynamicBookings.length ? dynamicBookings : DEMO_BOOKINGS).map((booking) => (
              <button
                key={booking.id}
                type="button"
                className={`chat-booking-item ${selectedBooking === booking.id ? 'active' : ''}`}
                onClick={() => setSelectedBooking(booking.id)}
              >
                <div className="booking-avatar">
                  {booking.cleanerName.charAt(0)}
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
