import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  PictureOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined
} from '@ant-design/icons';
import '../../../styles/cleaner/job_execution.scss';
import { dispatchCleanerNotificationsUpdated } from '../utils/notificationSync';
import api from '../../../services/api';
import { getCleanerScopedStorageKey } from '../utils/storageKeys';

const getConfirmedMyJobsStorageKey = () => getCleanerScopedStorageKey('cleaner_confirmed_my_jobs');

const fallbackJob = {
  id: 'default-1',
  sourceRequestId: 'default-1',
  status: 'in-progress',
  title: 'Deep Home Cleaning',
  jobId: '#SMT-78291',
  price: '$120.00',
  timeRange: '09:00 AM - 01:00 PM',
  location: '124 Maple Avenue, Suite 4B',
  customer: 'Sarah Jenkins'
};

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const toAbsoluteImageUrl = (imageUrl) => {
  const raw = String(imageUrl || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  return `${API_BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
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

const requestFinalPaymentOnServer = async (job) => {
  const bookingId = getBookingIdFromJob(job);
  if (!bookingId) return false;
  try {
    await api.post(`/payments/booking/${bookingId}/request-finalization`);
    return true;
  } catch (error) {
    console.error('Failed to request final payment', error);
    return false;
  }
};

const normalizeConfirmedJob = (job) => ({
  id: job.id || job.sourceRequestId || 'default-1',
  sourceRequestId: job.sourceRequestId || job.id || 'default-1',
  status: job.status || 'in-progress',
  title: job.title || fallbackJob.title,
  jobId: job.jobId || fallbackJob.jobId,
  price: job.price || fallbackJob.price,
  timeRange: job.timeRange || fallbackJob.timeRange,
  location: job.location || fallbackJob.location,
  customer: job.customer || fallbackJob.customer,
  serviceStatus: job.serviceStatus || 'started'
});

const JobExecutionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedJobId = location.state?.jobId || null;

  const currentJob = useMemo(() => {
    try {
      const raw = localStorage.getItem(getConfirmedMyJobsStorageKey());
      if (!raw) return fallbackJob;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return fallbackJob;

      const found = selectedJobId
        ? parsed.find((job) => job.id === selectedJobId || job.sourceRequestId === selectedJobId)
        : parsed[0];

      return normalizeConfirmedJob(found || parsed[0]);
    } catch {
      return fallbackJob;
    }
  }, [selectedJobId]);

  const [finishStatus, setFinishStatus] = useState('');
  const [customerImages, setCustomerImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const priceValue = Number(String(currentJob.price || '$0').replace(/[^0-9.]/g, '')) || 0;
  const totalEarning = priceValue;
  const bookingId = getBookingIdFromJob(currentJob);
  const activeImage = activeImageIndex != null ? customerImages[activeImageIndex] || null : null;

  useEffect(() => {
    let cancelled = false;

    const loadBookingImages = async () => {
      if (!bookingId) {
        setCustomerImages([]);
        return;
      }

      setImagesLoading(true);
      try {
        const response = await api.get(`/bookings/${bookingId}`);
        if (cancelled) return;

        const images = Array.isArray(response?.data?.data?.images) ? response.data.data.images : [];
        setCustomerImages(
          images
            .map((image, index) => ({
              id: String(image?.id || `booking-image-${index + 1}`),
              url: toAbsoluteImageUrl(image?.url),
              createdAt: image?.created_at || null
            }))
            .filter((image) => image.url)
        );
      } catch {
        if (!cancelled) {
          setCustomerImages([]);
        }
      } finally {
        if (!cancelled) {
          setImagesLoading(false);
        }
      }
    };

    loadBookingImages();
    const refreshInterval = setInterval(loadBookingImages, 3000);

    return () => {
      cancelled = true;
      clearInterval(refreshInterval);
    };
  }, [bookingId]);

  const handleFinishJob = async () => {
    setFinishStatus('Sending final payment request...');
    try {
      const ok = await requestFinalPaymentOnServer(currentJob);
      if (!ok) {
        setFinishStatus('Could not send final payment request. Please try again.');
        return;
      }

      const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
      if (!raw) {
        setFinishStatus('Final payment requested. Waiting for customer receipt.');
        navigate('/cleaner/my-jobs');
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        navigate('/cleaner/my-jobs');
        return;
      }

      const updated = parsed.map((job) =>
        (job.id === currentJob.id || job.sourceRequestId === currentJob.sourceRequestId)
          ? { ...job, status: 'payment-required', serviceStatus: 'completed', paymentStatus: 'awaiting_receipt' }
          : job
      );
      localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify(updated));
      dispatchCleanerNotificationsUpdated();
      setFinishStatus('Final payment requested. Waiting for customer receipt.');
    } catch {
      setFinishStatus('Could not send final payment request. Please try again.');
      return;
    }

    navigate('/cleaner/my-jobs');
  };

  const openImageModal = (index) => {
    setActiveImageIndex(index);
  };

  const closeImageModal = () => {
    setActiveImageIndex(null);
  };

  const showPreviousImage = () => {
    setActiveImageIndex((prev) => {
      if (prev == null || customerImages.length === 0) return prev;
      return prev === 0 ? customerImages.length - 1 : prev - 1;
    });
  };

  const showNextImage = () => {
    setActiveImageIndex((prev) => {
      if (prev == null || customerImages.length === 0) return prev;
      return prev === customerImages.length - 1 ? 0 : prev + 1;
    });
  };

  useEffect(() => {
    if (activeImageIndex == null) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeImageModal();
      if (event.key === 'ArrowLeft') showPreviousImage();
      if (event.key === 'ArrowRight') showNextImage();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeImageIndex, customerImages.length]);

  return (
    <div className="cleaner-job-execution-page">
      <div className="execution-breadcrumb">
        <button type="button" onClick={() => navigate('/cleaner/my-jobs')}>My Jobs</button>
        <span>&gt;</span>
        <strong>Job Execution</strong>
      </div>

      <section className="execution-top-card">
        <div className="execution-title-wrap">
          <h1>{currentJob.title}</h1>
          <p>
            Job ID: <span>{currentJob.jobId}</span>
          </p>
        </div>

        <div className="elapsed-box">
          <small>ELAPSED</small>
          <div className="elapsed-grid">
            <div><strong>01</strong><span>HR</span></div>
            <div><strong>24</strong><span>MIN</span></div>
            <div><strong>45</strong><span>SEC</span></div>
          </div>
        </div>

        <div className="execution-meta-grid">
          <div className="execution-meta-item">
            <span className="meta-icon"><UserOutlined /></span>
            <div>
              <small>CUSTOMER</small>
              <strong>{currentJob.customer}</strong>
            </div>
          </div>

          <div className="execution-meta-item">
            <span className="meta-icon"><EnvironmentOutlined /></span>
            <div>
              <small>ADDRESS</small>
              <strong>{currentJob.location}</strong>
            </div>
          </div>

          <div className="execution-meta-item">
            <span className="meta-icon"><ClockCircleOutlined /></span>
            <div>
              <small>TIME SLOT</small>
              <strong>{currentJob.timeRange}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="execution-main-grid">
        <section className="execution-checklist-panel">
          <div className="panel-head">
            <h2>Customer Uploaded Images</h2>
            <span>{customerImages.length} Photo{customerImages.length === 1 ? '' : 's'}</span>
          </div>

          {imagesLoading ? (
            <div className="booking-images-empty">
              <PictureOutlined />
              <p>Loading customer photos...</p>
            </div>
          ) : customerImages.length ? (
            <div className="booking-images-grid">
              {customerImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className="booking-image-card"
                  onClick={() => openImageModal(index)}
                >
                  <img
                    src={image.url}
                    alt={`Customer upload ${index + 1}`}
                    className="booking-image-preview"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="booking-images-empty">
              <PictureOutlined />
              <p>No customer images were uploaded for this booking.</p>
            </div>
          )}
        </section>

        <aside className="execution-side-column">
          <section className="job-summary-panel">
            <h3>Job Summary</h3>
            <div className="summary-row">
              <span>Service Fee</span>
              <strong>${priceValue.toFixed(2)}</strong>
            </div>
            <div className="summary-row total">
              <span>Total Earning</span>
              <strong>${totalEarning.toFixed(2)}</strong>
            </div>

            <button type="button" className="finish-job-btn" onClick={handleFinishJob}>
              <CheckCircleFilled /> Finish Job
            </button>
            <p>Complete all tasks to finish</p>
            {finishStatus && <p>{finishStatus}</p>}
          </section>

          <section className="execution-map-panel">
            <div className="map-art" />
            <div className="location-foot">
              <CheckCircleFilled />
              <div>
                <strong>Client Location</strong>
                <p>1.2 miles from your last stop</p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {activeImage && (
        <div className="booking-image-lightbox" onClick={closeImageModal}>
          <div className="booking-image-lightbox-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="lightbox-close-btn" onClick={closeImageModal} aria-label="Close image preview">
              <CloseOutlined />
            </button>

            {customerImages.length > 1 && (
              <button type="button" className="lightbox-nav-btn prev" onClick={showPreviousImage} aria-label="Previous image">
                <LeftOutlined />
              </button>
            )}

            <img
              src={activeImage.url}
              alt={`Customer upload ${activeImageIndex + 1}`}
              className="lightbox-image"
            />

            {customerImages.length > 1 && (
              <button type="button" className="lightbox-nav-btn next" onClick={showNextImage} aria-label="Next image">
                <RightOutlined />
              </button>
            )}

            <div className="lightbox-footer">
              <span>{activeImageIndex + 1} / {customerImages.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobExecutionPage;
