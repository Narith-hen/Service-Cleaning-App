import React, { useEffect, useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import api from '../../../services/api';
import '../../../styles/customer/payment_method.scss';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const toAbsoluteImageUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${apiHost}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getInitials = (name) => {
  const parts = String(name || '')
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return 'CL';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const normalizeReviewBooking = (booking, fallbackBookingId, fallbackServiceName) => ({
  bookingId: String(
    booking?.booking_id
    || booking?.bookingId
    || booking?.id
    || fallbackBookingId
    || ''
  ),
  cleanerId: booking?.cleaner_id || booking?.cleanerId || booking?.cleaner?.user_id || null,
  cleanerName:
    booking?.cleaner_full_name ||
    booking?.cleaner_display_name ||
    booking?.cleaner_name ||
    booking?.cleanerName ||
    booking?.cleaner_username ||
    booking?.cleaner?.username ||
    [booking?.cleaner_first_name, booking?.cleaner_last_name].filter(Boolean).join(' ').trim() ||
    'Assigned cleaner',
  cleanerAvatar: toAbsoluteImageUrl(
    booking?.cleaner_avatar || booking?.cleanerAvatar || booking?.cleaner?.avatar || ''
  ),
  serviceName:
    booking?.service_name ||
    booking?.serviceName ||
    booking?.service?.name ||
    fallbackServiceName ||
    'Cleaning Service',
  reviewId: booking?.review_id ? Number(booking.review_id) : booking?.reviewId ? Number(booking.reviewId) : null,
  reviewRating: Number(booking?.rating ?? booking?.reviewRating ?? 0),
  reviewComment: booking?.review_comment || booking?.reviewComment || ''
});

const CustomerRatingModal = ({
  open = false,
  bookingId = '',
  initialBooking = null,
  fallbackServiceName = '',
  onClose,
  onSubmitted = null
}) => {
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(null);

  useEffect(() => {
    if (!open) return undefined;

    const normalizedInitial = normalizeReviewBooking(initialBooking, bookingId, fallbackServiceName);
    setReviewBooking(normalizedInitial);
    setRating(normalizedInitial.reviewId ? normalizedInitial.reviewRating : 0);
    setComment(normalizedInitial.reviewId ? normalizedInitial.reviewComment : '');
    setReviewFeedback(null);

    if (!bookingId) return undefined;

    let cancelled = false;

    const loadBooking = async () => {
      try {
        const response = await api.get(`/bookings/${bookingId}`);
        if (cancelled) return;

        const normalized = normalizeReviewBooking(
          response?.data?.data || null,
          bookingId,
          fallbackServiceName
        );
        setReviewBooking(normalized);
        setRating(normalized.reviewId ? normalized.reviewRating : 0);
        setComment(normalized.reviewId ? normalized.reviewComment : '');
      } catch {
        if (!cancelled) {
          setReviewBooking(normalizedInitial);
        }
      }
    };

    void loadBooking();

    return () => {
      cancelled = true;
    };
  }, [open, bookingId, initialBooking, fallbackServiceName]);

  const handleStarSelect = (value) => {
    setRating((current) => (current === value ? Math.max(0, value - 1) : value));
    setReviewFeedback(null);
  };

  const handleSubmitReview = async () => {
    if (!bookingId) {
      setReviewFeedback({ type: 'error', message: 'Missing booking reference.' });
      return;
    }

    if (reviewBooking?.reviewId) {
      setReviewFeedback({ type: 'muted', message: 'You already rated this cleaner.' });
      return;
    }

    if (!rating) {
      setReviewFeedback({ type: 'error', message: 'Please select a star rating first.' });
      return;
    }

    setSubmittingReview(true);
    setReviewFeedback(null);

    try {
      await api.post('/reviews', {
        booking_id: Number(bookingId),
        rating,
        comment: comment.trim() || undefined,
        command: comment.trim() || undefined,
        cleaner_id: reviewBooking?.cleanerId ? Number(reviewBooking.cleanerId) : undefined
      });

      setReviewBooking((current) => (
        current
          ? {
              ...current,
              reviewId: -1,
              reviewRating: rating,
              reviewComment: comment.trim()
            }
          : current
      ));

      if (typeof onSubmitted === 'function') {
        onSubmitted({
          bookingId: String(bookingId),
          reviewId: -1,
          rating,
          comment: comment.trim()
        });
      }

      setReviewFeedback({ type: 'success', message: 'Thanks for rating your cleaner.' });
      window.setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 1200);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.map((item) => item.msg).join(', ')
          : null) ||
        'Could not submit your rating. Please try again.';

      setReviewFeedback({ type: 'error', message });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="payment-rating-overlay"
      role="presentation"
      onClick={() => typeof onClose === 'function' && onClose()}
    >
      <section
        className="payment-rating-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-success-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="payment-success-close"
          onClick={() => typeof onClose === 'function' && onClose()}
          aria-label="Close rating dialog"
        >
          <CloseOutlined />
        </button>

        <h2 id="payment-success-title">Share your experience</h2>
        <p className="payment-success-copy">
          {reviewBooking?.serviceName || fallbackServiceName || 'Cleaning service'} is complete.
          Your feedback helps us improve the service quality.
        </p>

        <div className="payment-success-cleaner">
          <div className="payment-success-avatar">
            {reviewBooking?.cleanerAvatar ? (
              <img src={reviewBooking.cleanerAvatar} alt={reviewBooking.cleanerName || 'Cleaner'} />
            ) : (
              <span>{getInitials(reviewBooking?.cleanerName)}</span>
            )}
          </div>

          <div>
            <strong>{reviewBooking?.cleanerName || 'Assigned cleaner'}</strong>
            <span>Professional cleaner</span>
          </div>
        </div>

        {!reviewBooking?.reviewId ? (
          <>
            <div className="payment-rating-stars" role="radiogroup" aria-label="Rate your cleaner">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`payment-rating-star${value <= rating ? ' is-active' : ''}`}
                  onClick={() => handleStarSelect(value)}
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                >
                  {value <= rating ? <AiFillStar size={30} /> : <AiOutlineStar size={30} />}
                </button>
              ))}
            </div>

            {reviewFeedback && (
              <p className={`payment-rating-feedback ${reviewFeedback.type}`}>
                {reviewFeedback.message}
              </p>
            )}

            <textarea
              className="payment-success-textarea"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell us about your cleaner..."
              maxLength={500}
            />

            <div className="payment-rating-actions">
              <button
                type="button"
                className="payment-rating-secondary"
                onClick={() => typeof onClose === 'function' && onClose()}
              >
                Maybe later
              </button>
              <button
                type="button"
                className="payment-rating-primary"
                onClick={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="payment-rating-feedback success">
              You already rated this cleaner. Thank you for your feedback.
            </p>
            <div className="payment-rating-actions">
              <button
                type="button"
                className="payment-rating-primary"
                onClick={() => typeof onClose === 'function' && onClose()}
              >
                Close
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default CustomerRatingModal;
