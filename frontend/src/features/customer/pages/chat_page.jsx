import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
  MessageOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import CustomerMessagePanel from '../components/customer_message_panel';
import api from '../../../services/api';
import { formatSingleTimeLabel } from '../../../utils/timeFormat';
import '../../../styles/cleaner/my_jobs.scss';

const fallbackBookings = [];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const CUSTOMER_HIDDEN_CHAT_STORAGE_KEY = 'customer_hidden_message_threads_v1';

const getFullImageUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  if (fileUrl.startsWith('/uploads/')) {
    const cleanPath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    return `${API_BASE_URL}/${cleanPath}`;
  }
  return fileUrl;
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

const normalizeTrackedBooking = (booking, bookingIdFallback) => ({
  booking_id: String(booking?.booking_id ?? booking?.id ?? bookingIdFallback ?? 'unknown'),
  booking_date: booking?.booking_date || booking?.date || new Date().toISOString(),
  booking_time: booking?.booking_time || booking?.time || '',
  total_price: booking?.total_price ?? booking?.price ?? null,
  negotiated_price: booking?.negotiated_price ?? null,
  address:
    booking?.address
    || booking?.location
    || booking?.service_location
    || booking?.service?.location
    || booking?.service_address
    || 'Location not provided',
  service: booking?.service || { name: booking?.service_name || booking?.serviceTitle || booking?.title || 'Cleaning Service' },
  cleaner: buildCleanerPayload(booking)
});

const formatMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return `$${numeric.toFixed(2)}`;
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

const CustomerChatPage = () => {
  const [searchParams] = useSearchParams();
  const { bookingId: pathBookingId } = useParams();
  const navigate = useNavigate();
  const bookingId = pathBookingId || searchParams.get('booking');
  const ALERTED_BOOKING_PREFIX = 'alerted_booking_';
  const LAST_BOOKING_KEY = 'last_booking_id';
  const fallbackBookingId = (() => {
    try {
      return localStorage.getItem(LAST_BOOKING_KEY);
    } catch {
      return null;
    }
  })();

  const [dynamicBookings, setDynamicBookings] = useState(() => fallbackBookings);
  const [hiddenThreadIds] = useState(() => readHiddenThreadIds());

  // Poll for booking updates to get cleaner info when booking is confirmed
  useEffect(() => {
    let cancelled = false;
    const targetId = bookingId || fallbackBookingId;
    
    const hydrateBookings = async () => {
      if (targetId) {
        try {
          const resp = await api.get(`/bookings/track/${targetId}`);
          const data = resp?.data?.data;
          if (data && !cancelled) {
            setDynamicBookings([normalizeTrackedBooking(data, targetId)]);
            return;
          }
        } catch {
          // ignore and fall back to list
        }
      }

      if (!cancelled) {
        try {
          const listResp = await api.get('/bookings', { params: { page: 1, limit: 20 } });
          const bookings = Array.isArray(listResp?.data?.data) ? listResp.data.data : [];
          const normalized = bookings.map((b) => normalizeTrackedBooking(b, b?.booking_id));
          setDynamicBookings(normalized);
        } catch {
          setDynamicBookings([]);
        }
      }
    };

    // Initial fetch
    hydrateBookings();
    
    // Poll for updates every 3 seconds to get cleaner info when booking is confirmed
    const pollInterval = setInterval(() => {
      const targetId = bookingId || fallbackBookingId;
      if (targetId) {
        api.get(`/bookings/track/${targetId}`)
          .then((resp) => {
            const data = resp?.data?.data;
            if (data && !cancelled) {
              setDynamicBookings([normalizeTrackedBooking(data, targetId)]);
            }
          })
          .catch(() => {}); // Ignore polling errors
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [bookingId, fallbackBookingId]);

  const [selectedBooking, setSelectedBooking] = useState(
    bookingId || dynamicBookings[0]?.booking_id || null
  );

  useEffect(() => {
    if (!selectedBooking) {
      if (bookingId) {
        setSelectedBooking(bookingId);
      } else if (dynamicBookings[0]?.booking_id) {
        setSelectedBooking(dynamicBookings[0].booking_id);
      }
    }
  }, [dynamicBookings, selectedBooking, bookingId]);

  const visibleBookings = useMemo(() => {
    const hidden = new Set(hiddenThreadIds.map((id) => String(id)));
    return dynamicBookings.filter((booking) => !hidden.has(String(booking.booking_id)));
  }, [dynamicBookings, hiddenThreadIds]);

  const activeBooking = useMemo(() => {
    return visibleBookings.find((b) => String(b.booking_id) === String(selectedBooking)) || visibleBookings[0];
  }, [visibleBookings, selectedBooking]);

  // Alert the customer when a booking is confirmed (once per booking)
  useEffect(() => {
    if (!activeBooking?.booking_id) return;
    const key = `${ALERTED_BOOKING_PREFIX}${activeBooking.booking_id}`;
    try {
      if (
        String(activeBooking.booking_status || activeBooking.status || '').toLowerCase() === 'confirmed' &&
        !localStorage.getItem(key)
      ) {
        alert(`Your cleaner accepted booking #${activeBooking.booking_id}.`);
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
          <h3>No Active Chat</h3>
          <p>This conversation is no longer available in your customer chat.</p>
          <button 
            type="button" 
            className="back-btn"
            onClick={() => navigate('/customer/messages')}
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  // Get cleaner name from the booking
  const cleanerName = activeBooking.cleaner?.username || 'Cleaner';
  const cleanerAvatar = activeBooking.cleaner?.avatar || '';
  const cleanerId = activeBooking.cleaner?.id || activeBooking.cleaner_id || '';
  const serviceName = activeBooking.service?.name || 'Cleaning Service';
  const jobId = `#SOMA-${activeBooking.booking_id}`;
  const bookingDate = activeBooking.booking_date
    ? new Date(activeBooking.booking_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBD';
  const bookingTime = formatSingleTimeLabel(activeBooking.booking_time || '09:00 AM', '09:00 AM');
  const bookingLocation =
    activeBooking.address
    || activeBooking.location
    || activeBooking.service_location
    || activeBooking.service?.location
    || 'Location not provided';
  const negotiatedPrice = activeBooking?.negotiated_price != null
    ? formatMoney(activeBooking.negotiated_price)
    : '';

  return (
    <div className="cleaner-my-jobs-v2">
      <div className="my-jobs-message-breadcrumb" data-customer-reveal>
        <button type="button" onClick={() => navigate('/customer/bookings')} data-customer-button>My Bookings</button>
        <span>&gt;</span>
        <strong>Chat</strong>
      </div>

      <div className="my-jobs-message-view" data-customer-reveal style={{ '--customer-reveal-delay': 1 }}>
        <CustomerMessagePanel
          threadId={String(activeBooking.booking_id)}
          cleanerName={cleanerName}
          cleanerAvatar={cleanerAvatar}
          cleanerId={cleanerId}
          subtitle={`${serviceName} Job - ${jobId}`}
        />

        <aside className="my-jobs-details-panel" data-customer-panel>
          <h5>JOB DETAILS</h5>

          <div className="my-jobs-details-card" data-customer-card>
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

          <div className="my-jobs-details-card my-jobs-details-card--service" data-customer-card>
            <div className="my-jobs-detail-row">
              <span className="my-jobs-detail-icon"><FileTextOutlined /></span>
              <div>
                <small>Service</small>
                <strong>{serviceName}</strong>
              </div>
            </div>
          </div>

          <button type="button" className="my-jobs-contract-btn" data-customer-button>
            <FileTextOutlined /> View Full Job Contract
          </button>

          {negotiatedPrice && (
            <div className="my-jobs-price-card" data-customer-card>
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
    </div>
  );
};

export default CustomerChatPage;
