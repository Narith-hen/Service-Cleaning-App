import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  HistoryOutlined,
  SearchOutlined,
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
    bookingTime: booking?.booking_time || booking?.time || '09:00 AM',
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
    status,
    rawStatus: String(rawStatus).toLowerCase(),
    bookingStatus: String(booking?.booking_status || booking?.status || 'pending').toLowerCase()
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

  return {
    tone: status?.tone || 'pending',
    icon: status?.icon || <ClockCircleOutlined />,
    label: 'Service Booked'
  };
};

const fetchCustomerHistoryRows = async () => {
  const response = await api.get('/bookings/my-history', { params: { page: 1, limit: 5 } });
  const rows = response?.data?.data;
  return Array.isArray(rows) ? rows.slice(0, 5) : [];
};

const CustomerHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const hasLoadedRef = useRef(false);

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
            ? ['confirmed', 'accepted', 'pending', 'matching', 'started', 'in_progress', 'in-progress', 'booked'].includes(item.rawStatus)
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
            { key: 'active', label: 'Active' },
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
                        <p className="customer-history-card-id">Job ID: #{item.id}</p>
                      </div>
                      <div className="customer-history-price">
                        <strong>{formatMoney(item.totalPrice)}</strong>
                        <small>Fixed Rate</small>
                      </div>
                    </div>

                    <div className="customer-history-summary">
                      <p><EnvironmentOutlined /> {item.location}</p>
                      <p><UserOutlined /> Cleaner: {item.cleanerName}</p>
                      <p>
                        <HomeOutlined /> {item.bedrooms}
                        <span className="dot">•</span>
                        <AppstoreOutlined /> {item.floors}
                      </p>
                      <p><CalendarOutlined /> {dateLabel}</p>
                    </div>

                    <div className="customer-history-footer">
                      <span className={`customer-history-status customer-history-status-button ${statusButton.tone}`}>
                        {statusButton.icon}
                        {statusButton.label}
                      </span>
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
