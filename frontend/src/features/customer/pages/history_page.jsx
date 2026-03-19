import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import api from '../../../services/api';
import '../../../styles/customer/history.scss';

const STATUS_META = {
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

const normalizeStatus = (value) => {
  const key = String(value || 'pending').toLowerCase();
  return STATUS_META[key] || {
    label: key.charAt(0).toUpperCase() + key.slice(1),
    tone: 'pending',
    icon: <ClockCircleOutlined />
  };
};

const normalizeHistoryBooking = (booking, index = 0) => {
  const rawStatus = booking?.booking_status || booking?.status || 'pending';
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
    cleanerName:
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
    status,
    rawStatus: String(rawStatus).toLowerCase()
  };
};

const CustomerHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get('/bookings', { params: { page: 1, limit: 50 } });
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        if (!cancelled) {
          setHistory(rows.map((booking, index) => normalizeHistoryBooking(booking, index)));
        }
      } catch {
        if (!cancelled) {
          setHistory([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return history.filter((item) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'active'
            ? ['confirmed', 'accepted', 'pending', 'matching'].includes(item.rawStatus)
            : item.rawStatus === filter;

      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      return [item.serviceName, item.cleanerName, item.location, item.status.label]
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
            const dateLabel = new Date(item.bookingDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <article
                key={item.id}
                className="customer-history-card"
                data-customer-reveal
                data-customer-card
                style={{ '--customer-reveal-delay': Math.min(index % 4, 3) }}
              >
                <div className="customer-history-card-top">
                  <div>
                    <p className="customer-history-card-id">Booking #{item.id}</p>
                    <h2>{item.serviceName}</h2>
                  </div>
                  <span className={`customer-history-status ${item.status.tone}`}>
                    {item.status.icon}
                    {item.status.label}
                  </span>
                </div>

                <div className="customer-history-meta-grid">
                  <div className="customer-history-meta">
                    <span><CalendarOutlined /></span>
                    <div>
                      <small>Date & time</small>
                      <strong>{dateLabel}, {item.bookingTime}</strong>
                    </div>
                  </div>

                  <div className="customer-history-meta">
                    <span><UserOutlined /></span>
                    <div>
                      <small>Cleaner</small>
                      <strong>{item.cleanerName}</strong>
                    </div>
                  </div>

                  <div className="customer-history-meta">
                    <span><EnvironmentOutlined /></span>
                    <div>
                      <small>Location</small>
                      <strong>{item.location}</strong>
                    </div>
                  </div>

                  <div className="customer-history-meta">
                    <span><FileTextOutlined /></span>
                    <div>
                      <small>Payment</small>
                      <strong>{formatMoney(item.totalPrice)}</strong>
                    </div>
                  </div>
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
