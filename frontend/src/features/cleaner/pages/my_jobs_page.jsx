import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  EnvironmentOutlined,
  UserOutlined,
  HomeOutlined,
  AppstoreOutlined,
  DollarOutlined,
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
import customerAvatar1 from '../../../assets/larryta.png';
import customerAvatar2 from '../../../assets/mey.JPG';
import customerAvatar3 from '../../../assets/narith.png';
import CleanerMessagePanel from '../components/cleaner_message_panel';
import { dispatchCleanerNotificationsUpdated } from '../utils/notificationSync';
import api from '../../../services/api';
import '../../../styles/cleaner/my_jobs.scss';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';
const CLEANER_CHAT_THREADS_KEY = 'cleaner_chat_threads_history';
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

// Helper to save chat threads to localStorage
const saveChatThreads = (threads) => {
  try {
    localStorage.setItem(CLEANER_CHAT_THREADS_KEY, JSON.stringify(threads));
  } catch (e) {
    // Ignore storage errors
  }
};

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const pickJobImage = (job) => {
  const apiImage = toAbsoluteImageUrl(job?.serviceImage || job?.imageUrl || '');
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
  const rawId = job?.sourceRequestId || job?.bookingId || job?.id || '';
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

const isPaymentReviewStatus = (value) => {
  const normalized = String(value || '').toLowerCase();
  return normalized === 'payment-required'
    || normalized === 'payment_required'
    || normalized === 'awaiting_receipt'
    || normalized === 'receipt_submitted';
};

const getPaymentBadge = (paymentStatus) => {
  const normalized = String(paymentStatus || '').toLowerCase();

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

  return null;
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
    customerAvatar: customerAvatar1,
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
    customerAvatar: customerAvatar2,
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
    customerAvatar: customerAvatar3,
    bedrooms: '4 Bedrooms',
    floors: '2 Floors',
    image: windowImage,
    serviceType: 'window'
  }
];

const tabs = [
  { key: 'all', label: 'All Jobs' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in-progress', label: 'In-Progress' },
  { key: 'payment', label: 'Payment Review' },
  { key: 'completed', label: 'Completed' }
];

const MyJobsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'all');
  const [jobs, setJobs] = useState(fallbackJobs);
  const [activeMessageJobId, setActiveMessageJobId] = useState(null);
  const [jobActionStateById, setJobActionStateById] = useState({});
  const [paymentWorkflowByBooking, setPaymentWorkflowByBooking] = useState({});
  const [paymentActionByBooking, setPaymentActionByBooking] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const normalized = parsed
        .filter(Boolean)
        .map((job) => ({
          id: job.id || `confirmed-${job.sourceRequestId || Date.now()}`,
          sourceRequestId: job.sourceRequestId || job.id,
          status: job.status || 'in-progress',
          title: job.title || 'Cleaning Job',
          jobId: job.jobId || '#SOMA-00000',
          price: job.price || '$0.00',
          day: job.day || '01',
          monthYear: job.monthYear || 'June 2026',
          timeRange: job.timeRange || '09:00 AM - 12:00 PM',
          location: job.location || 'Phnom Penh, Cambodia',
          customer: job.customer || 'Customer',
          customerId: job.customerId || job.customer_id || '3',
          customerPhone: job.customerPhone || job.customer_phone || '',
          customerEmail: job.customerEmail || job.customer_email || '',
          customerAvatar: job.customerAvatar || '',
          bedrooms: job.bedrooms || '3 Bedrooms',
          floors: job.floors || '2 Floors',
          serviceStatus: job.serviceStatus || 'booked',
          paymentStatus: String(job.paymentStatus || '').toLowerCase(),
          serviceType: job.serviceType || 'home',
          serviceImage: job.serviceImage || '',
          image: pickJobImage(job)
        }));

      setJobs(normalized);
    } catch {
      setJobs(fallbackJobs);
    }
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
                  <strong>Tomorrow, 9:00 AM</strong>
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
          const paymentBadge = getPaymentBadge(paymentStatus);
          const needsPaymentReview = isPaymentReviewStatus(job.status) || isPaymentReviewStatus(paymentStatus);
          const isPaymentConfirmed = paymentStatus === 'completed' || paymentStatus === 'paid';
          const actionState = jobActionStateById[job.id]
            || (job.status === 'completed' || isPaymentConfirmed
              ? 'completed'
              : needsPaymentReview
                ? 'payment-required'
                : job.status === 'in-progress'
                  ? 'in-progress'
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
              <span className={`status-pill ${actionState === 'payment-required' ? 'in-progress' : job.status}`}>
                {actionState === 'completed'
                  ? 'COMPLETED'
                  : actionState === 'payment-required'
                    ? 'PAYMENT REVIEW'
                    : job.status === 'in-progress'
                      ? 'IN PROGRESS'
                      : 'ACTIVE NOW'}
              </span>
              <div className="day-value">{job.day}</div>
              <div className="month-value">{job.monthYear}</div>

              <div className="schedule-label">Scheduled Time</div>
              <div className="schedule-value">{job.timeRange}</div>
            </aside>

            <section className="my-job-main-v2">
              <div className="job-main-header-v2">
                <div>
                  <h3>{job.title}</h3>
                  <p>Job ID: {job.jobId}</p>
                </div>

                <div className="job-price-v2">
                  <strong>{job.price}</strong>
                  <small>Fixed Rate</small>
                </div>
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

              <div className="job-actions-v2">
                {actionState === 'idle' && (
                  <>
                    <button
                      type="button"
                      className="start-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleStartJob(job.id);
                      }}
                    >
                      <PlayCircleOutlined /> Start Job
                    </button>

                    <button
                      type="button"
                      className="cancel-btn"
                      disabled
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <CloseOutlined /> Cancel Job
                    </button>
                  </>
                )}

                {actionState === 'in-progress' && (
                  <>
                    <button
                      type="button"
                      className="progress-btn"
                      disabled
                    >
                      <ClockCircleOutlined /> In progress
                    </button>

                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCancelJob(job.id);
                      }}
                    >
                      <CloseOutlined /> Cancel Job
                    </button>
                  </>
                )}

                {actionState === 'completed' && (
                  <button type="button" className="completed-btn" disabled>
                    <CheckCircleOutlined /> Completed
                  </button>
                )}

                {paymentBadge && (
                  <span className={`job-payment-badge ${paymentBadge.tone}`}>
                    {paymentBadge.icon}
                    {paymentBadge.label}
                  </span>
                )}

                {actionState === 'payment-required' && (
                  <>
                    {paymentStatus === 'receipt_submitted' && paymentFlow?.receipt_image_url ? (
                      <>
                        <button
                          type="button"
                          className="start-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleConfirmReceipt(job);
                          }}
                          disabled={paymentActionByBooking[String(bookingId)] === 'confirming'}
                        >
                          <CheckCircleOutlined /> {paymentActionByBooking[String(bookingId)] === 'confirming' ? 'Confirming...' : 'Confirm Receipt'}
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleViewReceipt(job);
                          }}
                        >
                          <EyeOutlined /> View Receipt
                        </button>
                      </>
                    ) : (
                      <button type="button" className="progress-btn" disabled>
                        <ClockCircleOutlined /> Waiting customer receipt
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  className="ghost-btn message-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    // Save job to chat threads for history
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
                      serviceType: job.serviceType,
                      paymentStatus
                    };
                    
                    try {
                      const raw = localStorage.getItem(CLEANER_CHAT_THREADS_KEY);
                      const existing = raw ? JSON.parse(raw) : [];
                      const threadId = job.sourceRequestId || job.id;
                      const filtered = existing.filter(t => (t.sourceRequestId || t.id) !== threadId);
                      saveChatThreads([threadData, ...filtered]);
                    } catch (e) {
                      // Ignore
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

        {visibleJobs.length === 0 && (
          <div className="my-jobs-empty-v2">No jobs in this tab yet.</div>
        )}
      </div>
    </div>
  );
};

export default MyJobsPage;


