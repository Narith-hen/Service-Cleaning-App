import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown,
  Clock3,
  Star,
  X
} from 'lucide-react';
import api from '../../../services/api';
import '../../../styles/customer/review_page.scss';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const formatShortDate = (value) => {
  if (!value) return 'Date unavailable';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).toUpperCase();
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

const normalizeBooking = (booking, bookingId) => ({
  id: String(bookingId || booking?.id || booking?.booking_id || ''),
  serviceName:
    booking?.serviceName ||
    booking?.service_name ||
    booking?.service?.name ||
    booking?.title ||
    'Cleaning Service',
  cleanerName:
    booking?.cleanerName ||
    booking?.cleaner_name ||
    booking?.cleaner_display_name ||
    booking?.cleaner?.username ||
    'Assigned cleaner',
  location:
    booking?.location ||
    booking?.address ||
    booking?.service_location ||
    booking?.service?.location ||
    'Location unavailable',
  bookingDate: booking?.bookingDate || booking?.booking_date || booking?.date || '',
  bookingTime: booking?.bookingTime || booking?.booking_time || booking?.time || '11:30 AM',
  cleanerId: booking?.cleanerId || booking?.cleaner_id || booking?.cleaner?.user_id || null,
  cleanerAvatar: toAbsoluteImageUrl(
    booking?.cleanerAvatar || booking?.cleaner_avatar || booking?.cleaner?.avatar || ''
  ),
  cleanerScore:
    Number(booking?.cleanerScore || booking?.cleaner_rating || booking?.average_rating || booking?.avg_rating) || 0,
  serviceImage: booking?.serviceImage || booking?.service_image || booking?.image || '',
  totalPrice: booking?.totalPrice ?? booking?.negotiated_price ?? booking?.total_price ?? booking?.price ?? null,
  bedrooms: booking?.bedrooms || booking?.bedroom_count || booking?.room_count || '3 Bedrooms',
  floors: booking?.floors || booking?.floor_count || '2 Floors',
  rawStatus:
    booking?.rawStatus ||
    booking?.service_tracking_status ||
    booking?.booking_status ||
    booking?.status ||
    'completed',
  paymentStatus: booking?.paymentStatus || booking?.payment_status || 'paid',
  reviewComment: booking?.reviewComment || booking?.review_comment || '',
  reviewRating: Number(booking?.reviewRating || booking?.rating) || 0
});

const WriteReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams();
  const stateBooking = location.state?.booking || null;
  const returnPath = location.state?.from || '/customer/history';

  const [bookingSummary, setBookingSummary] = useState(() => normalizeBooking(stateBooking, bookingId));
  const [rating, setRating] = useState(() => Number(stateBooking?.reviewRating) || 0);
  const [comment, setComment] = useState(() => stateBooking?.reviewComment || '');
  const [submitting, setSubmitting] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setBookingSummary(normalizeBooking(stateBooking, bookingId));
    setRating(Number(stateBooking?.reviewRating) || 0);
    setComment(stateBooking?.reviewComment || '');
  }, [stateBooking, bookingId]);

  useEffect(() => {
    if (stateBooking || !bookingId) return;

    let cancelled = false;
    setLoadingBooking(true);

    const loadBooking = async () => {
      try {
        const response = await api.get('/bookings/my-history', { params: { page: 1, limit: 50 } });
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        const match = rows.find((item) => String(item?.booking_id || item?.id) === String(bookingId));

        if (!cancelled && match) {
          setBookingSummary(normalizeBooking(match, bookingId));
          setRating(Number(match?.rating) || 0);
          setComment(match?.review_comment || '');
        }
      } catch {
        if (!cancelled) {
          setFeedback({
            type: 'muted',
            message: 'We could not load the full booking details, but you can still submit your rating.'
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingBooking(false);
        }
      }
    };

    loadBooking();

    return () => {
      cancelled = true;
    };
  }, [stateBooking, bookingId]);

  const displayScore = rating ? `${rating.toFixed(1)} / 5` : '0.0 / 5';
  const cleanerScoreText = bookingSummary.cleanerScore > 0 ? bookingSummary.cleanerScore.toFixed(1) : null;

  const handleStarSelect = (value) => {
    setRating((current) => (current === value ? Math.max(0, value - 1) : value));
  };

  const handleSubmit = async () => {
    if (!bookingSummary.id) {
      setFeedback({
        type: 'error',
        message: 'Missing booking reference. Please return to your history and try again.'
      });
      return;
    }

    if (!rating) {
      setFeedback({
        type: 'error',
        message: 'Please select a star rating before you submit.'
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      await api.post('/reviews', {
        booking_id: Number(bookingSummary.id),
        rating,
        comment: comment.trim() || undefined,
        command: comment.trim() || undefined,
        cleaner_id: bookingSummary.cleanerId ? Number(bookingSummary.cleanerId) : undefined
      });

      setFeedback({
        type: 'success',
        message: 'Your review was submitted successfully.'
      });

      window.setTimeout(() => {
        navigate(returnPath, { replace: true });
      }, 900);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.map((item) => item.msg).join(', ')
          : null) ||
        'We could not submit your review. Please try again.';

      setFeedback({
        type: 'error',
        message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-page-shell review-page-shell--form-only">
      <div className="review-page-backdrop" aria-hidden />

      <section className="review-sheet-card" data-customer-reveal data-customer-panel>
        <button
          type="button"
          className="review-sheet-close"
          onClick={() => navigate(returnPath)}
          aria-label="Close review page"
        >
          <X size={24} />
        </button>

        <div className="review-sheet-avatar">
          {bookingSummary.cleanerAvatar ? (
            <img src={bookingSummary.cleanerAvatar} alt={bookingSummary.cleanerName} />
          ) : (
            <span>{getInitials(bookingSummary.cleanerName)}</span>
          )}
          <i aria-hidden />
        </div>

        <h2>{bookingSummary.cleanerName}</h2>
        <p className="review-sheet-role">
          <span>PROFESSIONAL CLEANER</span>
          {cleanerScoreText && (
            <>
              <span className="review-sheet-dot">•</span>
              <Star size={14} fill="currentColor" />
              <strong>{cleanerScoreText}</strong>
            </>
          )}
        </p>
        <p className="review-sheet-date">{formatShortDate(bookingSummary.bookingDate)}</p>

        <div className="review-sheet-title">OVERALL EXPERIENCE</div>

        <div className="review-sheet-stars" role="radiogroup" aria-label="Overall experience rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`review-star-button${value <= rating ? ' is-active' : ''}`}
              onClick={() => handleStarSelect(value)}
              aria-checked={rating === value}
              role="radio"
              aria-label={`${value} star${value > 1 ? 's' : ''}`}
            >
              <Star size={34} fill={value <= rating ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>

        <div className="review-sheet-score">{displayScore}</div>

        {feedback && (
          <div className={`review-feedback review-feedback--${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        <label className="review-sheet-label" htmlFor="review-comment">
          Feedback
        </label>

        <div className="review-sheet-textarea-wrap">
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add a comment..."
            maxLength={1000}
          />
          <span className="review-sheet-textarea-icon" aria-hidden>
            <ChevronDown size={22} />
          </span>
        </div>

        <div className="review-sheet-footer">
          <button
            type="button"
            className="review-sheet-skip"
            onClick={() => navigate(returnPath)}
          >
            Skip
          </button>

          <button
            type="button"
            className="review-sheet-submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        <div className="review-sheet-meta">
          {loadingBooking ? (
            <span>
              <Clock3 size={14} />
              Loading booking details...
            </span>
          ) : (
            <span>{comment.length}/1000 characters</span>
          )}
        </div>
      </section>
    </div>
  );
};

export default WriteReviewPage;
