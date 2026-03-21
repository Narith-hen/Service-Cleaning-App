import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
  HomeOutlined,
  AppstoreOutlined,
  MessageOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import officeImage from '../../../assets/office.png';
import homeImage from '../../../assets/home.png';
import windowImage from '../../../assets/window.png';
import constructionImage from '../../../assets/Construction Cleaning.png';
import customerHomeImage from '../../../assets/customer_home.png';
import carpetImage from '../../../assets/Carpet.png';
import floorBuffingImage from '../../../assets/Floor Buffing.png';
import deepCleaningImage from '../../../assets/Deep.png';
import homesServiceImage from '../../../assets/Homes .png';
import airConditioningImage from '../../../assets/co.png';
import moveImage from '../../../assets/move.png';
import shopImage from '../../../assets/shop.png';
import proImage from '../../../assets/pro.png';
import CleanerMessagePanel from '../components/cleaner_message_panel';
import { dispatchCleanerNotificationsUpdated } from '../utils/notificationSync';
import api from '../../../services/api';
import '../../../styles/cleaner/my_jobs.scss';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';
const CLEANER_CHAT_THREADS_KEY = 'cleaner_chat_threads_history';
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const tabs = [
  { key: 'all', label: 'All Jobs' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in-progress', label: 'In-Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' }
];

const saveChatThreads = (threads) => {
  try {
    localStorage.setItem(CLEANER_CHAT_THREADS_KEY, JSON.stringify(threads));
  } catch {
    // Ignore storage errors.
  }
};

const toDisplayImageUrl = (imageUrl) => {
  const value = String(imageUrl || '').trim();
  if (!value) return '';
  if (
    /^https?:\/\//i.test(value)
    || value.startsWith('data:')
    || value.startsWith('blob:')
    || value.startsWith('/assets/')
  ) {
    return value;
  }
  return `${API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

const pickJobImage = (job) => {
  const apiImage = toDisplayImageUrl(job?.serviceImage || job?.imageUrl || '');
  if (apiImage) return apiImage;

  const title = String(job?.title || job?.serviceName || '').toLowerCase();
  const serviceType = String(job?.serviceType || '').toLowerCase();

  if (title.includes('carpet') || serviceType.includes('carpet')) return carpetImage;
  if (title.includes('floor buff') || title.includes('pressure wash') || serviceType.includes('floor')) return floorBuffingImage;
  if (title.includes('air') || title.includes('conditioning') || serviceType.includes('air')) return airConditioningImage;
  if (title.includes('deep')) return deepCleaningImage;
  if (title.includes('move')) return moveImage;
  if (title.includes('shop')) return shopImage;
  if (title.includes('pro')) return proImage;
  if (title.includes('homes & offices') || title.includes('home') || title.includes('house') || serviceType.includes('home')) return homesServiceImage;
  if (title.includes('office') || serviceType.includes('office')) return officeImage;
  if (title.includes('window') || serviceType.includes('window')) return windowImage;
  if (title.includes('construction') || serviceType.includes('construction')) return constructionImage;
  if (title.includes('customer') || serviceType.includes('customer')) return customerHomeImage;

  return homeImage;
};

const getBookingIdFromJob = (job) => {
  const rawId = job?.sourceRequestId || job?.bookingId || job?.booking_id || job?.id || '';
  const normalized = String(rawId);
  if (!normalized) return null;
  if (normalized.startsWith('confirmed-')) {
    return normalized.replace('confirmed-', '');
  }
  return normalized;
};

const updateJobStatusOnServer = async (job, { bookingStatus, serviceStatus }) => {
  const bookingId = getBookingIdFromJob(job);
  if (!bookingId) return false;
  try {
    await api.patch(`/bookings/${bookingId}/status`, {
      ...(bookingStatus ? { booking_status: bookingStatus } : {}),
      ...(serviceStatus ? { service_status: serviceStatus } : {})
    });
    return true;
  } catch (error) {
    console.error('Failed to update booking status', error);
    return false;
  }
};

const getCurrentCleanerId = () => {
  try {
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const rawId = savedUser?.id || savedUser?.user_id || '';
    return rawId ? String(rawId) : '';
  } catch {
    return '';
  }
};

const toMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toFixed(2)}`;
};

const parseBookingDate = (value) => {
  if (!value) return null;
  const nextDate = new Date(value);
  if (Number.isNaN(nextDate.getTime())) return null;
  return nextDate;
};

const getMonthYear = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'Date TBD';
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

const getDay = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--';
  return String(date.getDate()).padStart(2, '0');
};

const formatTimeRange = (rawValue, bookingDate) => {
  const value = String(rawValue || '').trim();
  if (value) return value;
  if (!(bookingDate instanceof Date) || Number.isNaN(bookingDate.getTime())) return 'Time TBD';
  return bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDateTimeLabel = (job) => {
  const day = String(job?.day || '').trim();
  const monthYear = String(job?.monthYear || '').trim();
  const timeRange = String(job?.timeRange || '').trim();
  return [day, monthYear, timeRange].filter(Boolean).join(', ');
};

const normalizeJobStatus = (...values) => {
  const normalized = values
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  if (normalized.some((value) => value === 'completed')) return 'completed';
  if (normalized.some((value) => value === 'cancelled' || value === 'rejected')) return 'cancelled';
  if (normalized.some((value) => value === 'in_progress' || value === 'in-progress' || value === 'started')) {
    return 'in-progress';
  }
  return 'upcoming';
};

const isPaymentReviewStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'payment_review' || normalized === 'pending_payment' || normalized === 'awaiting_payment';
};

const getPaymentBadge = (paymentStatus) => {
  const normalized = String(paymentStatus || '').toLowerCase();
  if (normalized === 'completed' || normalized === 'paid') return { color: 'green', label: 'Paid' };
  if (normalized === 'payment_review' || normalized === 'pending_payment' || normalized === 'awaiting_payment') {
    return { color: 'orange', label: 'Payment Review' };
  }
  if (normalized === 'failed' || normalized === 'error') return { color: 'red', label: 'Payment Failed' };
  return { color: 'default', label: 'Unknown' };
};

const formatSingleTimeLabel = (value) => {
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

const formatJobDateLabel = (job) => {
  const day = String(job?.day || '').trim();
  const monthYear = String(job?.monthYear || '').trim();

  if (!day && !monthYear) {
    return 'Date pending';
  }

  const monthYearParts = monthYear.split(/\s+/).filter(Boolean);
  const year = monthYearParts.length ? monthYearParts[monthYearParts.length - 1] : '';
  const month = monthYearParts.slice(0, -1).join(' ') || monthYear;
  return month && year ? `${month} ${day}, ${year}` : [day, monthYear].filter(Boolean).join(' ');
};

const getJobImageDateParts = (job) => {
  const day = String(job?.day || '').trim();
  const monthYear = String(job?.monthYear || '').trim();

  return {
    dayNumber: day ? day.padStart(2, '0') : '--',
    monthLabel: monthYear || 'Date pending'
  };
};

const formatJobImageTimeLabel = (job) => {
  const timeRange = String(job?.timeRange || '').trim();
  if (!timeRange) return 'Time pending';

  const [startTime] = timeRange.split('-').map((part) => part.trim()).filter(Boolean);
  return formatSingleTimeLabel(startTime || timeRange);
};

const buildJobRecord = (job = {}) => {
  const nextJob = {
    ...job,
    status: normalizeJobStatus(job?.status, job?.serviceStatus, job?.service_status),
    serviceStatus: job?.serviceStatus || job?.service_status || '',
    customerAvatar: toDisplayImageUrl(job?.customerAvatar || job?.customer_avatar || ''),
    serviceImage: job?.serviceImage || job?.service_image || ''
  };

  return {
    ...nextJob,
    image: nextJob.image || pickJobImage(nextJob)
  };
};

const fallbackJobs = [
  {
    id: 'default-1',
    sourceRequestId: 'default-1',
    status: 'upcoming',
    title: 'Deep House Cleaning',
    jobId: '#SOMA-48291',
    price: '$85.00',
    day: '24',
    monthYear: 'June 2026',
    timeRange: '09:00 AM - 12:00 PM',
    location: '123 Street 271, Sangkat Boeung Tumpun, Phnom Penh, Cambodia',
    customer: 'Sovan Reach',
    customerId: '3',
    customerPhone: '+855 12 345 678',
    customerEmail: 'sovanreach@email.com',
    customerAvatar: '',
    bedrooms: '3 Bedrooms',
    floors: '2 Floors',
    image: homeImage,
    serviceType: 'home'
  },
  {
    id: 'default-2',
    sourceRequestId: 'default-2',
    status: 'completed',
    title: 'Office Deep Cleaning',
    jobId: '#SOMA-48280',
    price: '$120.00',
    day: '20',
    monthYear: 'June 2026',
    timeRange: '08:00 AM - 11:00 AM',
    location: '456 Business Center, Phnom Penh, Cambodia',
    customer: 'Mey Sotharith',
    customerId: '4',
    customerPhone: '+855 10 987 654',
    customerEmail: 'meysotharith@company.com',
    customerAvatar: '',
    bedrooms: '5 Rooms',
    floors: '1 Floor',
    image: officeImage,
    serviceType: 'office'
  },
  {
    id: 'default-3',
    sourceRequestId: 'default-3',
    status: 'completed',
    title: 'Window Cleaning Service',
    jobId: '#SOMA-48275',
    price: '$65.00',
    day: '15',
    monthYear: 'June 2026',
    timeRange: '10:00 AM - 01:00 PM',
    location: '789 Riverside, Phnom Penh, Cambodia',
    customer: 'Larry Ta',
    customerId: '5',
    customerPhone: '+855 98 765 432',
    customerEmail: 'larryta@email.com',
    customerAvatar: '',
    bedrooms: '4 Bedrooms',
    floors: '2 Floors',
    image: windowImage,
    serviceType: 'window'
  }
];


const normalizeStoredJob = (job) => {
  const bookingId = getBookingIdFromJob(job);
  const bookingDate = parseBookingDate(job?.bookingDate || job?.booking_date);

  return buildJobRecord({
    id: job?.id || (bookingId ? `confirmed-${bookingId}` : `confirmed-${Date.now()}`),
    sourceRequestId: job?.sourceRequestId || bookingId || job?.id || '',
    status: normalizeJobStatus(job?.status, job?.serviceStatus, job?.service_status),
    title: job?.title || job?.serviceName || job?.service_name || 'Cleaning Job',
    jobId: job?.jobId || (bookingId ? `#SOMA-${bookingId}` : '#SOMA-00000'),
    price: job?.price || toMoney(job?.negotiatedPrice ?? job?.negotiated_price ?? job?.total_price ?? 0),
    day: job?.day || getDay(bookingDate),
    monthYear: job?.monthYear || getMonthYear(bookingDate),
    timeRange: job?.timeRange || formatTimeRange(job?.booking_time, bookingDate),
    location: job?.location || job?.address || 'Address pending',
    customer: job?.customer || job?.customer_name || job?.customer_username || 'Customer',
    customerId: String(job?.customerId || job?.customer_id || ''),
    customerPhone: job?.customerPhone || job?.customer_phone || '',
    customerEmail: job?.customerEmail || job?.customer_email || '',
    customerAvatar: job?.customerAvatar || job?.customer_avatar || '',
    bedrooms: job?.bedrooms || '3 Bedrooms',
    floors: job?.floors || '2 Floors',
    serviceStatus: job?.serviceStatus || job?.service_status || 'booked',
    serviceType: job?.serviceType || job?.service_name || '',
    serviceImage: job?.serviceImage || job?.service_image || '',
    bookingDate: job?.bookingDate || job?.booking_date || ''
  });
};

const readStoredJobs = () => {
  try {
    const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(Boolean).map(normalizeStoredJob);
  } catch {
    return [];
  }
};

const mapApiBookingToJob = (booking, storedJob) => {
  const bookingId = String(booking?.booking_id || booking?.id || storedJob?.sourceRequestId || '');
  const bookingDate = parseBookingDate(booking?.booking_date || storedJob?.bookingDate);
  const customerName = String(booking?.customer_username || booking?.customer_name || storedJob?.customer || '').trim();

  return buildJobRecord({
    id: storedJob?.id || (bookingId ? `confirmed-${bookingId}` : `confirmed-${Date.now()}`),
    sourceRequestId: bookingId || storedJob?.sourceRequestId || '',
    status: normalizeJobStatus(
      booking?.service_tracking_status,
      booking?.service_status,
      booking?.booking_status,
      storedJob?.status
    ),
    title: booking?.service_name || booking?.service?.name || storedJob?.title || 'Cleaning Job',
    jobId: storedJob?.jobId || (bookingId ? `#SOMA-${bookingId}` : '#SOMA-00000'),
    price: storedJob?.price || toMoney(booking?.negotiated_price ?? booking?.total_price ?? 0),
    day: storedJob?.day || getDay(bookingDate),
    monthYear: storedJob?.monthYear || getMonthYear(bookingDate),
    timeRange: storedJob?.timeRange || formatTimeRange(booking?.booking_time, bookingDate),
    location: booking?.address || storedJob?.location || 'Address pending',
    customer: customerName || 'Customer',
    customerId: String(booking?.customer_id || storedJob?.customerId || ''),
    customerPhone: booking?.customer_phone || storedJob?.customerPhone || '',
    customerEmail: booking?.customer_email || storedJob?.customerEmail || '',
    customerAvatar: toDisplayImageUrl(booking?.customer_avatar || storedJob?.customerAvatar || ''),
    bedrooms: storedJob?.bedrooms || '3 Bedrooms',
    floors: storedJob?.floors || '2 Floors',
    serviceStatus: booking?.service_status || storedJob?.serviceStatus || 'booked',
    serviceType: booking?.service_name || storedJob?.serviceType || '',
    serviceImage: booking?.service_image || storedJob?.serviceImage || '',
    bookingDate: booking?.booking_date || storedJob?.bookingDate || ''
  });
};

const persistJobs = (jobs) => {
  try {
    localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // Ignore storage errors.
  }
};

const MyJobsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'all');
  const [jobs, setJobs] = useState([]);
  const [activeMessageJobId, setActiveMessageJobId] = useState(null);
  const [jobActionStateById, setJobActionStateById] = useState({});
  const [loading, setLoading] = useState(true);
  const [paymentWorkflowByBooking, setPaymentWorkflowByBooking] = useState({});
  const [, setPaymentActionByBooking] = useState({});

  useEffect(() => {
    let cancelled = false;

    const syncJobs = async () => {
      setLoading(true);
      const storedJobs = readStoredJobs();
      const storedByBookingId = new Map(
        storedJobs.map((job) => [String(getBookingIdFromJob(job) || ''), job])
      );
      const cleanerId = getCurrentCleanerId();

      if (!cleanerId) {
        if (!cancelled) {
          setJobs(storedJobs);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get(`/bookings/cleaner/${cleanerId}`, {
          params: { limit: 50 }
        });
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        const apiJobs = rows.map((booking) =>
          mapApiBookingToJob(
            booking,
            storedByBookingId.get(String(booking?.booking_id || booking?.id || ''))
          )
        );
        const knownBookingIds = new Set(
          apiJobs.map((job) => String(getBookingIdFromJob(job) || ''))
        );
        const mergedJobs = [
          ...apiJobs,
          ...storedJobs.filter((job) => {
            const bookingId = String(getBookingIdFromJob(job) || '');
            return bookingId && !knownBookingIds.has(bookingId);
          })
        ];

        persistJobs(mergedJobs);
        if (!cancelled) {
          setJobs(mergedJobs);
        }
      } catch (error) {
        console.error('Failed to load cleaner jobs', error);
        if (!cancelled) {
          setJobs(storedJobs);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    syncJobs();
    window.addEventListener('focus', syncJobs);
    window.addEventListener('storage', syncJobs);
    window.addEventListener('cleaner-notifications-updated', syncJobs);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', syncJobs);
      window.removeEventListener('storage', syncJobs);
      window.removeEventListener('cleaner-notifications-updated', syncJobs);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPaymentWorkflows = async () => {
      const entries = await Promise.all(
        jobs.map(async (job) => {
          const bookingId = getBookingIdFromJob(job);
          if (!bookingId || !/^\d+$/.test(String(bookingId))) return null;
          try {
            const response = await api.get(`/payments/booking/${bookingId}/finalization`);
            const payload = response?.data?.data;
            if (!payload) return null;
            return [String(bookingId), payload];
          } catch {
            return null;
          }
        })
      );

      if (!cancelled) {
        const next = Object.fromEntries(entries.filter(Boolean));
        setPaymentWorkflowByBooking(next);
      }
    };

    loadPaymentWorkflows();
    const intervalId = window.setInterval(loadPaymentWorkflows, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    if (activeTab === 'all') return jobs;
    if (activeTab === 'payment') {
      return jobs.filter((job) => {
        const bookingId = getBookingIdFromJob(job);
        const paymentFlow = bookingId ? paymentWorkflowByBooking[String(bookingId)] : null;
        const paymentStatus = String(paymentFlow?.payment_status || job.paymentStatus || '').toLowerCase();
        return isPaymentReviewStatus(job.status) || isPaymentReviewStatus(paymentStatus);
      });
    }
    return jobs.filter((job) => job.status === activeTab);
  }, [jobs, activeTab, paymentWorkflowByBooking]);

  const activeMessageJob = useMemo(
    () => jobs.find((job) => job.id === activeMessageJobId) || null,
    [jobs, activeMessageJobId]
  );

  const handlePrimaryJobAction = (jobId) => {
    setJobActionStateById((prev) => {
      const current = prev[jobId] || 'idle';
      const next = current === 'idle' ? 'in-progress' : current;

      setJobs((jobsPrev) =>
        jobsPrev.map((job) =>
          job.id === jobId
            ? { ...job, status: 'in-progress' }
            : job
        )
      );

      return { ...prev, [jobId]: next };
    });
  };

  const handleStartJob = async (jobId) => {
    handlePrimaryJobAction(jobId);
    const selectedJob = jobs.find((job) => job.id === jobId) || null;

    if (selectedJob) {
      try {
        await updateJobStatusOnServer(selectedJob, {
          bookingStatus: 'in_progress',
          serviceStatus: 'in_progress'
        });
        const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((job) =>
              (job.id === selectedJob.id || job.sourceRequestId === selectedJob.sourceRequestId)
                ? { ...job, status: 'in-progress', serviceStatus: 'in_progress' }
                : job
            );
            localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify(updated));
            dispatchCleanerNotificationsUpdated();
          }
        }
      } catch {
        // Non-blocking for navigation flow.
      }
    }

    navigate('/cleaner/job-execution', { state: { jobId } });
  };

  const handleOpenJobDetails = (jobId) => {
    navigate('/cleaner/job-execution', { state: { jobId } });
  };

  const handleViewReceipt = (job) => {
    const bookingId = getBookingIdFromJob(job);
    if (!bookingId) return;
    const paymentFlow = paymentWorkflowByBooking[String(bookingId)];
    const receiptPath = paymentFlow?.receipt_image_url;
    if (!receiptPath) return;
    const receiptUrl = toAbsoluteImageUrl(receiptPath);
    if (!receiptUrl) return;
    window.open(receiptUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmReceipt = async (job) => {
    const bookingId = getBookingIdFromJob(job);
    if (!bookingId) return;

    const bookingKey = String(bookingId);
    setPaymentActionByBooking((prev) => ({ ...prev, [bookingKey]: 'confirming' }));
    try {
      await api.post(`/payments/booking/${bookingKey}/confirm-receipt`);

      setJobs((prev) =>
        prev.map((item) =>
          (item.id === job.id || item.sourceRequestId === job.sourceRequestId)
            ? { ...item, status: 'completed', serviceStatus: 'completed', paymentStatus: 'completed' }
            : item
        )
      );

      setPaymentWorkflowByBooking((prev) => ({
        ...prev,
        [bookingKey]: {
          ...(prev[bookingKey] || {}),
          payment_status: 'completed',
          booking_status: 'completed',
          service_status: 'completed',
          cleaner_confirmed_at: new Date().toISOString(),
        },
      }));

      try {
        const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          const updated = parsed.map((item) =>
            (item.id === job.id || item.sourceRequestId === job.sourceRequestId)
              ? { ...item, status: 'completed', serviceStatus: 'completed', paymentStatus: 'completed' }
              : item
          );
          localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify(updated));
          dispatchCleanerNotificationsUpdated();
        }
      } catch {
        // Ignore local storage errors.
      }
    } catch (error) {
      console.error('Failed to confirm receipt', error);
    } finally {
      setPaymentActionByBooking((prev) => ({ ...prev, [bookingKey]: '' }));
    }
  };

  if (activeMessageJob) {
    return (
      <div className="cleaner-my-jobs-v2">
        <div className="my-jobs-message-breadcrumb">
          <button type="button" onClick={() => setActiveMessageJobId(null)}>My Jobs</button>
          <span>&gt;</span>
          <strong>Message</strong>
        </div>

        <div className="my-jobs-message-view">
          <CleanerMessagePanel
            threadId={activeMessageJob.sourceRequestId || activeMessageJob.id}
            customerName={activeMessageJob.customer}
            customerId={activeMessageJob.customerId || '3'}
            customerAvatar={activeMessageJob.customerAvatar}
            customerPhone={activeMessageJob.customerPhone}
            customerEmail={activeMessageJob.customerEmail}
            customerAddress={activeMessageJob.location}
            subtitle={`${activeMessageJob.title} Job - ${activeMessageJob.jobId}`}
          />

          <aside className="my-jobs-details-panel">
            <h5>JOB DETAILS</h5>

            <div className="my-jobs-details-card">
              <div className="my-jobs-detail-row">
                <span className="my-jobs-detail-icon"><CalendarOutlined /></span>
                <div>
                  <small>Date &amp; Time</small>
                  <strong>{getDateTimeLabel(activeMessageJob) || 'Schedule pending'}</strong>
                </div>
              </div>

              <div className="my-jobs-detail-row">
                <span className="my-jobs-detail-icon"><EnvironmentOutlined /></span>
                <div>
                  <small>Location</small>
                  <strong>{activeMessageJob.location}</strong>
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
  }

  return (
    <div className="cleaner-my-jobs-v2">
      <div className="my-jobs-tabs-v2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="my-jobs-list-v2">
        {visibleJobs.map((job) => {
          const bookingId = getBookingIdFromJob(job);
          const paymentFlow = bookingId ? paymentWorkflowByBooking[String(bookingId)] : null;
          const paymentStatus = String(paymentFlow?.payment_status || job.paymentStatus || '').toLowerCase();
          const { dayNumber, monthLabel } = getJobImageDateParts(job);
          const paymentBadge = getPaymentBadge(paymentStatus);
          const needsPaymentReview = isPaymentReviewStatus(job.status) || isPaymentReviewStatus(paymentStatus);
          const isPaymentConfirmed = paymentStatus === 'completed' || paymentStatus === 'paid';
          const actionState = jobActionStateById[job.id]
            || (job.status === 'completed' || isPaymentConfirmed
              ? 'completed'
              : job.status === 'in-progress'
                ? 'in-progress'
                : job.status === 'cancelled'
                  ? 'cancelled'
                  : 'idle');

          return (
            <article
              key={job.id}
              className={`my-job-card-v2 ${actionState === 'completed' ? 'completed' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => handleOpenJobDetails(job.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleOpenJobDetails(job.id);
                }
              }}
            >
              <aside
                className="my-job-date-v2"
                style={{ '--job-date-bg': `url(${job.image || officeImage})` }}
              >
                <span className={`status-pill ${job.status}`}>
                  {job.status === 'completed'
                    ? 'COMPLETED'
                    : job.status === 'in-progress'
                    ? 'IN PROGRESS'
                    : 'ACTIVE NOW'}
              </span>

              <div className="my-job-image-meta-v2">
                <div className="my-job-image-date-v2">
                  <strong>{dayNumber}</strong>
                  <span>{monthLabel}</span>
                </div>

                <div className="my-job-image-time-v2">
                  <small>Scheduled Time</small>
                  <strong>{formatJobImageTimeLabel(job)}</strong>
                </div>
              </div>
            </aside>

            <section className="my-job-main-v2">
              <div className="job-main-header-v2">
                <div>
                  <h3>{job.title}</h3>
                </div>

                <p className="job-line-v2">
                  <EnvironmentOutlined /> {job.location}
                </p>

                <p className="job-line-v2">
                  <UserOutlined /> Customer: {job.customer}
                </p>

                <p className="job-line-v2">
                  <HomeOutlined /> {job.bedrooms}
                  <span className="dot">•</span>
                  <AppstoreOutlined /> {job.floors}
                </p>

              <p className="job-line-v2">
                <CalendarOutlined /> {formatJobDateLabel(job)}
              </p>

                  <button
                    type="button"
                    className="ghost-btn message-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      const threadData = {
                        id: job.id,
                        sourceRequestId: job.sourceRequestId,
                        status: job.status,
                        title: job.title,
                        jobId: job.jobId,
                        price: job.price,
                        day: job.day,
                        monthYear: job.monthYear,
                        timeRange: job.timeRange,
                        location: job.location,
                        customer: job.customer,
                        customerId: job.customerId || '3',
                        customerPhone: job.customerPhone || '',
                        customerEmail: job.customerEmail || '',
                        customerAvatar: job.customerAvatar || '',
                        bedrooms: job.bedrooms,
                        floors: job.floors,
                        image: job.image,
                        serviceImage: job.serviceImage || '',
                        serviceType: job.serviceType
                      };

                      try {
                        const raw = localStorage.getItem(CLEANER_CHAT_THREADS_KEY);
                        const parsed = raw ? JSON.parse(raw) : [];
                        const existing = Array.isArray(parsed) ? parsed : [];
                        const threadId = job.sourceRequestId || job.id;
                        const filtered = existing.filter(
                          (thread) => (thread.sourceRequestId || thread.id) !== threadId
                        );
                        saveChatThreads([threadData, ...filtered]);
                      } catch {
                        // Ignore storage errors.
                      }

                      setActiveMessageJobId(job.id);
                    }}
                  >
                    <MessageOutlined /> Messages
                  </button>
                </div>
              </section>
            </article>
          );
        })}

        {loading && visibleJobs.length === 0 && (
          <div className="my-jobs-empty-v2">Loading jobs...</div>
        )}

        {!loading && visibleJobs.length === 0 && (
          <div className="my-jobs-empty-v2">No jobs in this tab yet.</div>
        )}
      </div>
    </div>
  );
};

export default MyJobsPage;
