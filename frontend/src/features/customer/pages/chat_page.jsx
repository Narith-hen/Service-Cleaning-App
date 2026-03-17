import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
  MessageOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import CustomerMessagePanel from '../components/customer_message_panel';
import api from '../../../services/api';
import '../../../styles/cleaner/my_jobs.scss';

const fallbackBookings = [];

const normalizeTrackedBooking = (booking, bookingIdFallback) => ({
  booking_id: String(booking?.booking_id ?? booking?.id ?? bookingIdFallback ?? 'unknown'),
  booking_date: booking?.booking_date || booking?.date || new Date().toISOString(),
  booking_time: booking?.booking_time || booking?.time || '',
  address:
    booking?.address
    || booking?.location
    || booking?.service_location
    || booking?.service?.location
    || booking?.service_address
    || 'Location not provided',
  service: booking?.service || { name: booking?.service_name || booking?.serviceTitle || booking?.title || 'Cleaning Service' },
  cleaner: booking?.cleaner || {
    username:
      booking?.cleaner_name
      || [booking?.cleaner_first_name, booking?.cleaner_last_name].filter(Boolean).join(' ').trim()
      || booking?.cleaner_username
      || 'Cleaner'
  }
});

const CustomerChatPage = () => {
  const [searchParams] = useSearchParams();
  const { bookingId: pathBookingId } = useParams();
  const navigate = useNavigate();
  const bookingId = pathBookingId || searchParams.get('booking');
  const ALERTED_BOOKING_PREFIX = 'alerted_booking_';
  const LAST_BOOKING_KEY = 'last_booking_id';

  const [dynamicBookings, setDynamicBookings] = useState(() => fallbackBookings);

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
        const resp = await api.get(`/bookings/track/${bookingId}`);
        const data = resp?.data?.data;
        if (!data) return;
        const entry = normalizeTrackedBooking(data, bookingId);
        setDynamicBookings((prev) => {
          const exists = prev.some((b) => String(b.booking_id) === String(entry.booking_id));
          if (exists) {
            return prev.map((b) => (String(b.booking_id) === String(entry.booking_id) ? entry : b));
          }
          return [entry, ...prev];
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
    bookingId || dynamicBookings[0]?.booking_id || null
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
    return dynamicBookings.find((b) => String(b.booking_id) === String(selectedBooking)) || dynamicBookings[0];
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

  // Get cleaner name from the booking
  const cleanerName = activeBooking.cleaner?.username || 'Cleaner';
  const cleanerId = activeBooking.cleaner?.id || '11';
  const serviceName = activeBooking.service?.name || 'Cleaning Service';
  const jobId = `#SOMA-${activeBooking.booking_id}`;
  const bookingDate = activeBooking.booking_date
    ? new Date(activeBooking.booking_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBD';
  const bookingTime = activeBooking.booking_time || '09:00 AM';
  const bookingLocation =
    activeBooking.address
    || activeBooking.location
    || activeBooking.service_location
    || activeBooking.service?.location
    || 'Location not provided';

  return (
    <div className="cleaner-my-jobs-v2">
      <div className="my-jobs-message-breadcrumb">
        <button type="button" onClick={() => navigate('/customer/bookings')}>My Bookings</button>
        <span>&gt;</span>
        <strong>Chat</strong>
      </div>

      <div className="my-jobs-message-view">
        <CustomerMessagePanel
          threadId={String(activeBooking.booking_id)}
          cleanerName={cleanerName}
          cleanerId={cleanerId}
          subtitle={`${serviceName} Job - ${jobId}`}
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
    </div>
  );
};

export default CustomerChatPage;
