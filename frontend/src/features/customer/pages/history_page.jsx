import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  MessageOutlined,
  SearchOutlined,
  StarFilled,
  UserOutlined
} from '@ant-design/icons';
import api from '../../../services/api';
import '../../../styles/customer/history.scss';
import officeImage from '../../../assets/office.png';
import homeImage from '../../../assets/home.png';
import windowImage from '../../../assets/window.png';
import constructionImage from '../../../assets/Construction Cleaning.png';
import carpetImage from '../../../assets/Carpet.png';
import floorBuffingImage from '../../../assets/Floor Buffing.png';
import deepCleaningImage from '../../../assets/Deep.png';
import homesServiceImage from '../../../assets/Homes .png';
import airConditioningImage from '../../../assets/co.png';
import moveImage from '../../../assets/move.png';
import shopImage from '../../../assets/shop.png';
import proImage from '../../../assets/pro.png';

const STATUS_META = {
  booked: { label: 'Service Booked', tone: 'pending', icon: <ClockCircleOutlined /> },
  started: { label: 'Service Started', tone: 'confirmed', icon: <CheckCircleOutlined /> },
  in_progress: { label: 'Service In Progress', tone: 'progress', icon: <ClockCircleOutlined /> },
  'in-progress': { label: 'Service In Progress', tone: 'progress', icon: <ClockCircleOutlined /> },
  confirmed: { label: 'Confirmed', tone: 'confirmed', icon: <CheckCircleOutlined /> },
  accepted: { label: 'Accepted', tone: 'confirmed', icon: <CheckCircleOutlined /> },
  pending: { label: 'Pending', tone: 'pending', icon: <ClockCircleOutlined /> },
  payment_required: { label: 'Awaiting Payment', tone: 'pending', icon: <ClockCircleOutlined /> },
  matching: { label: 'Matching', tone: 'pending', icon: <ClockCircleOutlined /> },
  completed: { label: 'Completed', tone: 'completed', icon: <CheckCircleOutlined /> },
  cancelled: { label: 'Cancelled', tone: 'cancelled', icon: <HistoryOutlined /> },
  rejected: { label: 'Rejected', tone: 'cancelled', icon: <HistoryOutlined /> }
};

const formatMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Price pending';
  return `$${numeric.toFixed(2)}`;
};

const formatBookingTimeLabel = (value) => {
  const text = String(value || '').trim();
  if (!text) return 'Time pending';

  const normalized = text.toUpperCase();
  if (normalized.includes('AM') || normalized.includes('PM')) {
    return text;
  }

  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return text;

  const hours24 = Number(match[1]);
  const minutes = match[2];
  if (!Number.isFinite(hours24)) return text;

  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${meridiem}`;
};

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const pickHistoryImage = (booking) => {
  const apiImage = toAbsoluteImageUrl(booking?.service_image || booking?.image || '');
  if (apiImage) return apiImage;

  const title = String(
    booking?.service?.name ||
    booking?.service_name ||
    booking?.serviceTitle ||
    booking?.title ||
    ''
  ).toLowerCase();

  if (title.includes('carpet')) return carpetImage;
  if (title.includes('floor buff') || title.includes('pressure wash')) return floorBuffingImage;
  if (title.includes('air') || title.includes('conditioning')) return airConditioningImage;
  if (title.includes('deep')) return deepCleaningImage;
  if (title.includes('move')) return moveImage;
  if (title.includes('shop')) return shopImage;
  if (title.includes('pro')) return proImage;
  if (title.includes('home') || title.includes('house')) return homesServiceImage;
  if (title.includes('office')) return officeImage;
  if (title.includes('window')) return windowImage;
  if (title.includes('construction')) return constructionImage;

  return homeImage;
};

const normalizeStatus = (value) => {
  const key = String(value || 'pending').toLowerCase();
  return STATUS_META[key] || {
    label: key.charAt(0).toUpperCase() + key.slice(1),
    tone: 'pending',
    icon: <ClockCircleOutlined />
  };
};

const normalizeHistoryBooking = (booking, index = 0) => {
  const rawStatus =
    booking?.service_tracking_status ||
    booking?.booking_status ||
    booking?.status ||
    'pending';
  const status = normalizeStatus(rawStatus);

  return {
    id: String(booking?.booking_id || booking?.id || `history-${index + 1}`),
    serviceName:
      booking?.service?.name ||
      booking?.service_name ||
      booking?.serviceTitle ||
      booking?.title ||
      'Cleaning Service',
    bookingDate: booking?.booking_date || booking?.date || new Date().toISOString(),
    bookingTime: formatBookingTimeLabel(booking?.booking_time || booking?.time || '09:00 AM'),
    serviceImage: pickHistoryImage(booking),
    cleanerName:
      booking?.cleaner_display_name ||
      booking?.cleaner_company ||
      booking?.cleaner?.username ||
      booking?.cleaner_name ||
      booking?.cleaner_username ||
      [booking?.cleaner_first_name, booking?.cleaner_last_name].filter(Boolean).join(' ').trim() ||
      'Cleaner pending',
    location:
      booking?.address ||
      booking?.location ||
      booking?.service_location ||
      booking?.service?.location ||
      'Location not provided',
    totalPrice: booking?.negotiated_price ?? booking?.total_price ?? booking?.price ?? null,
    bedrooms: booking?.bedrooms || booking?.bedroom_count || booking?.room_count || '3 Bedrooms',
    floors: booking?.floors || booking?.floor_count || '2 Floors',
    cleanerId: booking?.cleaner_id || booking?.cleaner?.user_id || null,
    cleanerAvatar: toAbsoluteImageUrl(booking?.cleaner_avatar || booking?.cleaner?.avatar || ''),
    status,
    rawStatus: String(rawStatus).toLowerCase(),
    bookingStatus: String(booking?.booking_status || booking?.status || 'pending').toLowerCase(),
    serviceStatus: String(booking?.service_status || '').toLowerCase(),
    paymentStatus: String(booking?.payment_status || booking?.payment?.payment_status || '').toLowerCase(),
    reviewId: booking?.review_id ? Number(booking.review_id) : null,
    reviewRating: booking?.rating ? Number(booking.rating) : 0,
    reviewComment: booking?.review_comment || ''
  };
};

const getHistoryStatusButton = (rawStatus, status) => {
  const normalized = String(rawStatus || '').toLowerCase();

  if (normalized === 'in_progress' || normalized === 'in-progress' || normalized === 'started') {
    return {
      tone: 'progress',
      icon: <ClockCircleOutlined />,
      label: 'In Progress'
    };
  }

  if (normalized === 'completed') {
    return {
      tone: 'completed',
      icon: <CheckCircleOutlined />,
      label: 'Completed'
    };
  }

  if (normalized === 'cancelled' || normalized === 'rejected') {
    return {
      tone: 'cancelled',
      icon: <HistoryOutlined />,
      label: 'Cancelled'
    };
  }

  if (normalized === 'payment_required') {
    return {
      tone: 'pending',
      icon: <ClockCircleOutlined />,
      label: 'Awaiting Payment'
    };
  }

  return {
    tone: status?.tone || 'pending',
    icon: status?.icon || <ClockCircleOutlined />,
    label: 'Service Booked'
  };
};

const getPaymentStatusBadge = (paymentStatus, bookingStatus) => {
  const normalized = String(paymentStatus || '').toLowerCase();
  const normalizedBookingStatus = String(bookingStatus || '').toLowerCase();

  if (normalized === 'completed' || normalized === 'paid') {
    return {
      tone: 'paid',
      icon: <DollarOutlined />,
      label: 'Paid'
    };
  }

  if (normalized === 'receipt_submitted') {
    return {
      tone: 'payment-submitted',
      icon: <ClockCircleOutlined />,
      label: 'Payment Submitted'
    };
  }

  if (
    normalized === 'awaiting_receipt'
    || normalized === 'payment_required'
    || normalized === 'pending'
    || normalized === 'unpaid'
    || (!normalized && normalizedBookingStatus === 'payment_required')
  ) {
    return {
      tone: 'pending',
      icon: <DollarOutlined />,
      label: 'Awaiting Payment'
    };
  }

  return null;
};

const getReviewStatusBadge = (reviewId, reviewRating) => {
  if (!reviewId) return null;
  const normalizedRating = Number(reviewRating);
  return {
    tone: 'reviewed',
    icon: <StarFilled />,
    label: Number.isFinite(normalizedRating) && normalizedRating > 0
      ? `Rated ${normalizedRating.toFixed(1)}/5`
      : 'Reviewed'
  };
};

const fetchCustomerHistoryRows = async () => {
  const response = await api.get('/bookings/my-history', { params: { page: 1, limit: 5 } });
  const rows = response?.data?.data;
  return Array.isArray(rows) ? rows.slice(0, 5) : [];
};

const toReviewNavigationBooking = (booking) => ({
  id: booking?.id || '',
  booking_id: booking?.id || '',
  serviceName: booking?.serviceName || 'Cleaning Service',
  service_name: booking?.serviceName || 'Cleaning Service',
  bookingDate: booking?.bookingDate || '',
  booking_date: booking?.bookingDate || '',
  bookingTime: booking?.bookingTime || '',
  booking_time: booking?.bookingTime || '',
  serviceImage: booking?.serviceImage || '',
  service_image: booking?.serviceImage || '',
  cleanerName: booking?.cleanerName || 'Assigned cleaner',
  cleaner_name: booking?.cleanerName || 'Assigned cleaner',
  location: booking?.location || 'Location unavailable',
  address: booking?.location || 'Location unavailable',
  totalPrice: booking?.totalPrice ?? null,
  total_price: booking?.totalPrice ?? null,
  bedrooms: booking?.bedrooms || '3 Bedrooms',
  floors: booking?.floors || '2 Floors',
  cleanerId: booking?.cleanerId || null,
  cleaner_id: booking?.cleanerId || null,
  cleanerAvatar: booking?.cleanerAvatar || '',
  cleaner_avatar: booking?.cleanerAvatar || '',
  rawStatus: booking?.rawStatus || 'completed',
  paymentStatus: booking?.paymentStatus || '',
  payment_status: booking?.paymentStatus || '',
  reviewComment: booking?.reviewComment || '',
  review_comment: booking?.reviewComment || '',
  reviewRating: booking?.reviewRating || 0,
  rating: booking?.reviewRating || 0
});

const canCancelHistoryBooking = (item) => {
  const rawStatus = String(item?.rawStatus || '').toLowerCase();
  const bookingStatus = String(item?.bookingStatus || '').toLowerCase();

  if (['completed', 'cancelled', 'rejected'].includes(rawStatus)) {
    return false;
  }

  return ['pending', 'matching', 'booked', 'confirmed', 'accepted', 'started', 'in_progress', 'in-progress'].includes(rawStatus)
    || ['pending', 'confirmed', 'in_progress'].includes(bookingStatus);
};

const hasAssignedCleaner = (item) => {
  // Check if the cleaner name is not the default placeholder
  const cleanerName = String(item?.cleanerName || '').toLowerCase();
  return item?.cleanerId && cleanerName && cleanerName !== 'cleaner pending' && cleanerName !== 'assigned cleaner';
};

const canReviewHistoryBooking = (item) => {
  if (item?.reviewId) return false;

  const bookingStatus = String(item?.bookingStatus || '').toLowerCase();
  const serviceStatus = String(item?.serviceStatus || '').toLowerCase();
  const paymentStatus = String(item?.paymentStatus || '').toLowerCase();

  if (bookingStatus === 'completed') {
    return true;
  }

  return serviceStatus === 'completed'
    && ['receipt_submitted', 'completed', 'paid'].includes(paymentStatus);
};

const CustomerHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const hasLoadedRef = useRef(false);

  const openRatingPage = (booking) => {
    navigate(`/customer/write-review/${booking.id}`, {
      state: {
        booking: toReviewNavigationBooking(booking),
        from: '/customer/history'
      }
    });
  };

  const openChatPage = (booking) => {
    navigate(`/customer/chat?booking=${encodeURIComponent(String(booking.id))}`);
  };

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      if (!cancelled && !hasLoadedRef.current) {
        setLoading(true);
      }
      try {
        const rows = await fetchCustomerHistoryRows();
        if (!cancelled) {
          setHistory(rows.map((booking, index) => normalizeHistoryBooking(booking, index)));
          hasLoadedRef.current = true;
        }
      } catch {
        if (!cancelled) {
          setHistory([]);
          hasLoadedRef.current = true;
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHistory();
    const intervalId = window.setInterval(loadHistory, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return history.filter((item) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'active'
            ? ['confirmed', 'accepted', 'pending', 'matching', 'started', 'in_progress', 'in-progress', 'booked', 'payment_required'].includes(item.rawStatus)
            : filter === 'completed'
              ? ['completed'].includes(item.rawStatus)
              : ['cancelled', 'rejected'].includes(item.rawStatus);

      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      return [item.serviceName, item.cleanerName, item.location, item.status.label, item.bookingStatus]
        .some((field) => String(field || '').toLowerCase().includes(normalizedQuery));
    });
  }, [history, filter, query]);

  return (
    <div className="customer-history-page">
      <section className="customer-history-hero" data-customer-reveal>
        <div>
          <h1>Booking History</h1>
          <p className="customer-history-subtitle">
            Track every service you booked with cleaners, from pending requests to completed visits.
          </p>
        </div>
      </section>

      <section className="customer-history-toolbar" data-customer-reveal style={{ '--customer-reveal-delay': 1 }}>
        <div className="customer-history-search">
          <SearchOutlined />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search service, cleaner, or address"
          />
        </div>

        <div className="customer-history-filters">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Booked' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={filter === item.key ? 'active' : ''}
              onClick={() => setFilter(item.key)}
              data-customer-button
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="customer-history-empty">
          <ClockCircleOutlined />
          <h3>Loading your bookings...</h3>
          <p>We're pulling together your cleaning history.</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="customer-history-empty">
          <HistoryOutlined />
          <h3>No booking history found</h3>
          <p>Your completed and upcoming cleaner bookings will appear here.</p>
        </div>
      ) : (
        <div className="customer-history-grid">
          {filteredHistory.map((item, index) => {
            const bookingDate = new Date(item.bookingDate);
            const dateLabel = bookingDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
            const dayNumber = bookingDate.getDate().toString().padStart(2, '0');
            const monthLabel = bookingDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            });
            const statusButton = getHistoryStatusButton(item.rawStatus, item.status);
            const paymentBadge = getPaymentStatusBadge(item.paymentStatus, item.bookingStatus);
            const reviewBadge = getReviewStatusBadge(item.reviewId, item.reviewRating);
            const needsPayment =
              item.bookingStatus === 'payment_required'
              || item.paymentStatus === 'awaiting_receipt'
              || item.paymentStatus === 'receipt_submitted';
            const paymentConfirmed =
              item.paymentStatus === 'completed'
              || item.paymentStatus === 'paid';
            const canRateService = canReviewHistoryBooking(item);

            return (
              <article
                key={item.id}
                className="customer-history-card"
                data-customer-reveal
                data-customer-card
                style={{ '--customer-reveal-delay': Math.min(index % 4, 3) }}
              >
                <div className="customer-history-row">
                  <aside
                    className="customer-history-media"
                    style={{ '--history-card-bg': `url(${item.serviceImage})` }}
                  >
                    <span className={`customer-history-media-status ${item.status.tone}`}>
                      {item.rawStatus === 'in_progress' || item.rawStatus === 'started'
                        ? 'IN PROGRESS'
                        : item.rawStatus === 'completed'
                          ? 'COMPLETED'
                          : item.rawStatus === 'cancelled'
                            ? 'CANCELLED'
                            : 'BOOKED'}
                    </span>
                    <div className="customer-history-media-date">
                      <strong>{dayNumber}</strong>
                      <span>{monthLabel}</span>
                    </div>
                    <div className="customer-history-media-time">
                      <small>Scheduled Time</small>
                      <strong>{item.bookingTime}</strong>
                    </div>
                  </aside>

                  <section className="customer-history-body">
                    <div className="customer-history-card-top">
                      <div>
                        <h2>{item.serviceName}</h2>
                      </div>
                      <div className="customer-history-price">
                        <strong>{formatMoney(item.totalPrice)}</strong>
                        <small>Fixed Rate</small>
                      </div>
                    </div>

                    <div className="customer-history-summary">
                      <p><EnvironmentOutlined /> {item.location}</p>
                      <p><UserOutlined /> Cleaner: {item.cleanerName}</p>
                      <p><CalendarOutlined /> {dateLabel}</p>
                    </div>

                    <div className="customer-history-footer">
                      <span className={`customer-history-status customer-history-status-button ${statusButton.tone}`}>
                        {statusButton.icon}
                        {statusButton.label}
                      </span>
                      {paymentBadge && (
                        <span className={`customer-history-status ${paymentBadge.tone}`}>
                          {paymentBadge.icon}
                          {paymentBadge.label}
                        </span>
                      )}
                      {reviewBadge && (
                        <span className={`customer-history-status ${reviewBadge.tone}`}>
                          {reviewBadge.icon}
                          {reviewBadge.label}
                        </span>
                      )}
                      {hasAssignedCleaner(item) && (
                        <button
                          type="button"
                          className="customer-history-chat-btn"
                          onClick={() => openChatPage(item)}
                          data-customer-button
                        >
                          <MessageOutlined />
                          Chat
                        </button>
                      )}
                      {canCancelHistoryBooking(item) && (
                        <button
                          type="button"
                          className="customer-history-cancel-btn"
                          onClick={() => navigate(`/customer/cancel-work/${encodeURIComponent(String(item.id))}`, {
                            state: {
                              bookingId: item.id,
                              serviceName: item.serviceName
                            }
                          })}
                          data-customer-button
                        >
                          <CloseOutlined />
                          Cancel Booking
                        </button>
                      )}
                      {needsPayment && !paymentConfirmed && (
                        <button
                          type="button"
                          className="customer-secondary-button customer-history-action-button customer-history-payment-button"
                          onClick={() => navigate(`/customer/payment-methods?bookingId=${item.id}`)}
                          data-customer-button
                        >
                          Pay Now
                        </button>
                      )}
                      {canRateService && (
                        <button
                          type="button"
                          className="customer-history-action-btn customer-history-review-btn"
                          onClick={() => openRatingPage(item)}
                          data-customer-button
                        >
                          <StarFilled />
                          Review Service
                        </button>
                      )}
                    </div>
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerHistoryPage;

