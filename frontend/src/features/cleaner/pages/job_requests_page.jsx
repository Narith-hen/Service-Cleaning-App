﻿import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import CleanerMessagePanel from '../components/cleaner_message_panel';
import '../../../styles/cleaner/job_requests.scss';
import '../../../styles/cleaner/my_jobs.scss';
import { deriveServiceTone, formatDateParts, toMoney } from '../../../utils/bookingSync';
import api from '../../../services/api';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';

const mapBookingToRequest = (booking) => {
  const date = booking?.booking_date ? new Date(booking.booking_date) : null;
  const { month, day } = formatDateParts(date?.toISOString());
  const startTime = booking?.booking_time || (date
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'TBD');
  return {
    id: booking.booking_id,
    service: booking.service_name || booking.service?.name || 'Cleaning',
    serviceTone: deriveServiceTone(booking.service_name || booking.service?.name || ''),
    customer:
      booking.customer_name ||
      [booking.first_name, booking.last_name].filter(Boolean).join(' ').trim() ||
      booking.user?.username ||
      'Customer',
    address: booking.address || 'Address shared after accept',
    timeRange: startTime,
    amount: toMoney(booking.total_price || 0),
    month,
    day,
    status: booking.booking_status || 'pending'
  };
};

const getRequestChecklist = (request) => {
  if (request?.serviceTone === 'deep') {
    return [
      'Kitchen deep clean',
      'Bathroom sanitization',
      'Interior window cleaning',
      'Floor scrubbing and mopping'
    ];
  }

  return [
    'General room cleaning',
    'Bathroom freshen-up',
    'Surface dusting',
    'Vacuum and mop'
  ];
};

const JobRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [activeMessageRequestId, setActiveMessageRequestId] = useState(null);
  const [adjustmentTotalById, setAdjustmentTotalById] = useState({});
  const [detailRequestId, setDetailRequestId] = useState(null);
  const [acceptLoadingRequestId, setAcceptLoadingRequestId] = useState(null);
  const acceptDelayTimerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const ACCEPTED_BOOKING_KEY = 'accepted_booking_id';
  const CANCELLED_BOOKING_KEY = 'cancelled_booking_id';

  const getDefaultAdjustmentTotal = (request) => {
    if (!request) return '185.00';
    if (request.serviceTone === 'deep') return '185.00';
    const numericAmount = Number(String(request.amount || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount.toFixed(2) : '0.00';
  };

  const normalizeMoneyInput = (value) => {
    const cleaned = String(value || '').replace(/[^0-9.]/g, '');
    const [head = '', ...tail] = cleaned.split('.');
    const decimal = tail.join('').slice(0, 2);
    return decimal.length > 0 ? `${head}.${decimal}` : head;
  };

  const handleAdjustmentTotalChange = (requestId, value) => {
    setAdjustmentTotalById((prev) => ({
      ...prev,
      [requestId]: normalizeMoneyInput(value)
    }));
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings/available', { params: { limit: 20 } });
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      setRequests(rows.map(mapBookingToRequest));
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => () => {
    if (acceptDelayTimerRef.current) clearTimeout(acceptDelayTimerRef.current);
  }, []);

  const totalCount = useMemo(() => requests.length, [requests.length]);
  const activeRequest = useMemo(
    () => requests.find((job) => job.id === activeMessageRequestId) || null,
    [requests, activeMessageRequestId]
  );
  const detailRequest = useMemo(
    () => requests.find((job) => job.id === detailRequestId) || null,
    [requests, detailRequestId]
  );

  useEffect(() => {
    if (!detailRequestId) return;
    if (!requests.some((job) => job.id === detailRequestId)) {
      setDetailRequestId(null);
    }
  }, [requests, detailRequestId]);

  const markRequestAccepted = (id) => {
    setRequests((prev) => prev.map((job) => (job.id === id ? { ...job, status: 'accepted' } : job)));
  };

  const markRequestCancelled = (id) => {
    setRequests((prev) => prev.map((job) => (job.id === id ? { ...job, status: 'cancelled' } : job)));
  };

  const onDecline = (id) => {
    if (acceptLoadingRequestId !== null) return;
    const declineBooking = async () => {
      const hasToken = (() => {
        try {
          const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
          return Boolean(savedUser?.token || localStorage.getItem('token'));
        } catch {
          return Boolean(localStorage.getItem('token'));
        }
      })();
      if (!hasToken) {
        setStatusMessage('Please sign in as a cleaner before declining.');
        setAcceptLoadingRequestId(null);
        navigate('/auth/login');
        return;
      }

      setAcceptLoadingRequestId(id);
      try {
        await api.patch(`/bookings/${id}/status`, { booking_status: 'cancelled' });
        markRequestCancelled(id);
        setStatusMessage('Booking declined and customer notified.');
        try {
          localStorage.setItem(CANCELLED_BOOKING_KEY, String(id));
        } catch {
          /* ignore */
        }
      } catch (error) {
        const status = error?.response?.status;
        const apiMessage = error?.response?.data?.message;
        if (status === 401) {
          setStatusMessage('Please sign in again to decline this booking.');
        } else {
          setStatusMessage(apiMessage || (status ? `Failed to decline (status ${status}).` : 'Failed to decline.'));
        }
      } finally {
        setAcceptLoadingRequestId(null);
        setDetailRequestId((prev) => (prev === id ? null : prev));
      }
    };
    declineBooking();
  };

  const openMessageView = (request) => {
    if (!request) return;
    if (acceptLoadingRequestId !== null && acceptLoadingRequestId !== request.id) return;
    setDetailRequestId(null);
    setStatusMessage('Opening chat...');

    setAcceptLoadingRequestId(request.id);
    if (acceptDelayTimerRef.current) clearTimeout(acceptDelayTimerRef.current);
    acceptDelayTimerRef.current = setTimeout(() => {
      setActiveMessageRequestId(request.id);
      setAcceptLoadingRequestId(null);
      acceptDelayTimerRef.current = null;
    }, 500);
  };

  const handleAcceptClick = (request) => {
    const acceptBooking = async () => {
      const hasToken = (() => {
        try {
          const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
          return Boolean(savedUser?.token || localStorage.getItem('token'));
        } catch {
          return Boolean(localStorage.getItem('token'));
        }
      })();
      if (!hasToken) {
        setStatusMessage('Please sign in as a cleaner before accepting.');
        setAcceptLoadingRequestId(null);
        navigate('/auth/login');
        return;
      }

      setAcceptLoadingRequestId(request.id);
      try {
        await api.patch(`/bookings/${request.id}/claim`);
        markRequestAccepted(request.id);
        openMessageView(request);
        // flag for customer side to pick up and jump to chat
        try {
          localStorage.setItem(ACCEPTED_BOOKING_KEY, String(request.id));
        } catch {
          /* ignore storage errors */
        }
      } catch (error) {
        const status = error?.response?.status;
        const apiMessage = error?.response?.data?.message;
        if (status === 401) {
          setStatusMessage('Please sign in again to accept this booking.');
        } else if (status === 400) {
          setStatusMessage(apiMessage || 'Unable to accept: booking may already be claimed.');
        } else {
          setStatusMessage(apiMessage || (status ? `Failed to accept (status ${status}).` : 'Failed to accept.'));
        }
        setAcceptLoadingRequestId(null);
      }
    };
    acceptBooking();
  };

  const handleConfirmAdjustment = (request, totalInputValue) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    const monthYear = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const normalizedRequest = request || activeRequest;
    if (!normalizedRequest) return;
    const parsedTotal = Number(totalInputValue);
    const numericTotal = Number.isFinite(parsedTotal) && parsedTotal > 0
      ? parsedTotal
      : Number(getDefaultAdjustmentTotal(normalizedRequest));
    const safeTotal = toMoney(numericTotal);

    // Ensure request is accepted when adjustment is confirmed.
    setRequests((prev) =>
      prev.map((job) =>
        job.id === normalizedRequest.id ? { ...job, status: 'accepted' } : job
      )
    );

    const confirmedJob = {
      id: `confirmed-${normalizedRequest.id}`,
      sourceRequestId: normalizedRequest.id,
      status: 'upcoming',
      title: normalizedRequest.serviceTone === 'deep' ? 'Deep House Cleaning' : normalizedRequest.service,
      jobId: `#SOMA-${normalizedRequest.id}`,
      price: safeTotal,
      day: normalizedRequest.day || String(now.getDate()),
      monthYear,
      timeRange: normalizedRequest.timeRange || '09:00 AM - 12:00 PM',
      location: normalizedRequest.address,
      customer: normalizedRequest.customer,
      customerId: normalizedRequest.customerId || '3',
      bedrooms: '3 Bedrooms',
      floors: '2 Floors'
    };

    try {
      // Keep only one latest confirmed job for My Jobs page.
      localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify([confirmedJob]));
    } catch {
      localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify([confirmedJob]));
    }

    navigate('/cleaner/my-jobs');
  };

  if (activeRequest) {
    return (
      <div className="cleaner-job-requests-page">
        <div className="my-jobs-message-breadcrumb">
          <button type="button" onClick={() => setActiveMessageRequestId(null)}>Job Requests</button>
          <span>&gt;</span>
          <strong>Message</strong>
        </div>

        <div className="my-jobs-message-view">
          <CleanerMessagePanel
            threadId={activeRequest.id}
            customerName={activeRequest.customer}
            customerId={activeRequest.customerId || '3'}
            subtitle={`${activeRequest.service} Job - #JOB-${activeRequest.id}`}
          />

          <aside className="my-jobs-details-panel">
            <h5>JOB DETAILS</h5>

            <div className="my-jobs-details-card">
              <div className="my-jobs-detail-row">
                <span className="my-jobs-detail-icon"><CalendarOutlined /></span>
                <div>
                  <small>Date &amp; Time</small>
                  <strong>Tomorrow, 9:00 AM</strong>
                </div>
              </div>

              <div className="my-jobs-detail-row">
                <span className="my-jobs-detail-icon"><EnvironmentOutlined /></span>
                <div>
                  <small>Location</small>
                  <strong>{activeRequest.address}</strong>
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

            <div className="adjustment-card">
              <h4>
                <span className="adjustment-title-icon"><DollarCircleOutlined /></span>
                Cost of cleaning
              </h4>
              <p>You&apos;ve requested an additional $35.00 for Window Cleaning services.</p>
              <div className="adjustment-actions">
                <div className="adjustment-total">
                  <small>Total Job :</small>
                  <div className="total-input-wrap">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Enter your cost"
                      value={adjustmentTotalById[activeRequest.id] ?? ''}
                      onChange={(e) => handleAdjustmentTotalChange(activeRequest.id, e.target.value)}
                      aria-label="Total job amount"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleConfirmAdjustment(
                    activeRequest,
                    adjustmentTotalById[activeRequest.id] ?? ''
                  )}
                >
                  Submit
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="cleaner-job-requests-page">
      <div className="requests-header">
        <div>
          <p className="requests-kicker">Incoming Cleaning Services</p>
          <h1>New Requests <span>({totalCount})</span></h1>
        </div>
        <div className="requests-actions">
          <button type="button" className="header-btn">Filter</button>
          <button type="button" className="header-btn">Sort by Date</button>
        </div>
      </div>

      <div className="request-list">
        {statusMessage && (
          <div className="requests-banner" role="status">
            {statusMessage}
          </div>
        )}
        {loading && <p style={{ padding: '12px 16px' }}>Loading requests...</p>}
        {!loading && requests.map((request) => (
          <article
            key={request.id}
            className={`request-card ${detailRequestId === request.id ? 'active' : ''}`}
            onClick={() => setDetailRequestId((prev) => (prev === request.id ? null : request.id))}
          >
            <div className="request-main">
              <div className="date-badge">
                <span className="month">{request.month}</span>
                <span className="day">{request.day}</span>
              </div>

              <div className="request-content">
                <div className="request-topline">
                  <span className={`service-tag ${request.serviceTone}`}>{request.service}</span>
                  <span className="request-id">Req #{request.id}</span>
                </div>

                <h3>{request.customer}</h3>

                <div className="request-info-row">
                  <span><EnvironmentOutlined /> {request.address}</span>
                  <span><ClockCircleOutlined /> {request.timeRange}</span>
                </div>
              </div>
            </div>

            <div className="request-controls">
              <button
                type="button"
                className={`accept-btn ${request.status === 'accepted' ? 'accepted' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptClick(request);
                }}
                disabled={acceptLoadingRequestId !== null || request.status === 'cancelled'}
              >
                {acceptLoadingRequestId === request.id
                  ? 'Loading...'
                  : request.status === 'accepted'
                    ? 'Accepted'
                    : request.status === 'cancelled'
                      ? 'Cancelled'
                    : 'Accept'}
              </button>
              <button
                type="button"
                className="decline-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline(request.id);
                }}
                disabled={acceptLoadingRequestId !== null || request.status === 'cancelled'}
              >
                {request.status === 'cancelled' ? 'Cancelled' : 'Decline'}
              </button>
            </div>
          </article>
        ))}
        {!loading && requests.length === 0 && (
          <p style={{ padding: '12px 16px', color: '#6b7280' }}>No pending requests right now.</p>
        )}
      </div>

      {detailRequest && (
        <div className="request-detail-modal-backdrop" onClick={() => setDetailRequestId(null)}>
          <section className="request-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="request-detail-head">
              <div>
                <p>Cleaning Form</p>
                <h3>{detailRequest.service} - Req #{detailRequest.id}</h3>
              </div>
              <button type="button" onClick={() => setDetailRequestId(null)}>
                X
              </button>
            </div>

            <div className="request-detail-grid">
              <div className="request-detail-item">
                <small>Customer</small>
                <strong>{detailRequest.customer}</strong>
              </div>
              <div className="request-detail-item">
                <small>Status</small>
                <strong>
                  {detailRequest.status === 'accepted'
                    ? 'Accepted'
                    : detailRequest.status === 'cancelled'
                      ? 'Cancelled'
                      : 'Pending'}
                </strong>
              </div>
              <div className="request-detail-item">
                <small>Address</small>
                <strong>{detailRequest.address}</strong>
              </div>
              <div className="request-detail-item">
                <small>Schedule</small>
                <strong>{detailRequest.timeRange}</strong>
              </div>
            </div>

            <div className="request-detail-checklist">
              <h4>Cleaning Checklist</h4>
              <ul>
                {getRequestChecklist(detailRequest).map((item) => (
                  <li key={item}>
                    <CheckCircleOutlined /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="request-detail-actions">
              <button
                type="button"
                className="detail-secondary-btn"
                onClick={() => setDetailRequestId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="detail-primary-btn"
                onClick={() => handleAcceptClick(detailRequest)}
                disabled={acceptLoadingRequestId !== null}
              >
                {acceptLoadingRequestId === detailRequest.id ? 'Loading...' : 'Accept'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default JobRequestsPage;
