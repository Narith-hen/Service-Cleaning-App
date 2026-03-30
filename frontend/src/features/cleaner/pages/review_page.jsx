import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleFilled, SafetyCertificateFilled } from '@ant-design/icons';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import '../../../styles/cleaner/review.scss';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const EMPTY_DISTRIBUTION = [
  { score: 5, count: 0 },
  { score: 4, count: 0 },
  { score: 3, count: 0 },
  { score: 2, count: 0 },
  { score: 1, count: 0 }
];

const normalizeAssetUrl = (value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (String(value).startsWith('/')) return `${API_BASE_URL}${value}`;
  return value;
};

const formatReviewDate = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const buildInitial = (name) => {
  const text = String(name || '').trim();
  return text ? text.charAt(0).toUpperCase() : 'C';
};

const roundToHalfStar = (ratingValue) => Math.round((Math.max(Number(ratingValue) || 0, 0)) * 2) / 2;

const getStarFillWidth = (ratingValue, index) => {
  const normalizedRating = roundToHalfStar(ratingValue);
  const fill = Math.min(Math.max(normalizedRating - index, 0), 1);
  return `${fill * 100}%`;
};

const normalizeReview = (review) => ({
  id: review.review_id,
  name: review.reviewer_name || `Customer #${review.user_id}`,
  date: formatReviewDate(review.created_at),
  service: review.service_name || 'Cleaning Service',
  rating: Number(review.rating || 0),
  comment: review.comment || '',
  avatar: normalizeAssetUrl(review.reviewer_avatar),
  reply: null
});

const normalizeStats = (payload = {}) => {
  const distributionMap = new Map(
    (payload.distribution || []).map((item) => [Number(item.score), Number(item.count || 0)])
  );

  return {
    averageRating: Number(payload.averageRating || 0),
    totalReviews: Number(payload.totalReviews || 0),
    distribution: EMPTY_DISTRIBUTION.map((item) => ({
      score: item.score,
      count: distributionMap.get(item.score) || 0
    }))
  };
};

const ReviewPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewStats, setReviewStats] = useState(() => normalizeStats());
  const [reviews, setReviews] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const reviewsPerPage = 4;
  const cleanerId = Number(user?.user_id || user?.id || 0) || null;

  useEffect(() => {
    setCurrentPage(1);
  }, [cleanerId]);

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      if (authLoading) return;

      if (!cleanerId) {
        if (!isMounted) return;
        setReviewStats(normalizeStats());
        setReviews([]);
        setTotalPages(1);
        setError('We could not find the cleaner account for this page.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const [statsResponse, reviewsResponse] = await Promise.all([
          api.get('/reviews/stats', {
            params: { cleanerId }
          }),
          api.get('/reviews', {
            params: {
              cleanerId,
              page: currentPage,
              limit: reviewsPerPage,
              sort: 'newest'
            }
          })
        ]);

        if (!isMounted) return;

        const nextStats = normalizeStats(statsResponse?.data?.data);
        const nextReviews = Array.isArray(reviewsResponse?.data?.data)
          ? reviewsResponse.data.data.map(normalizeReview)
          : [];
        const nextTotalPages = Math.max(Number(reviewsResponse?.data?.pagination?.pages || 1), 1);

        setReviewStats(nextStats);
        setReviews(nextReviews);
        setTotalPages(nextTotalPages);
      } catch (loadError) {
        if (!isMounted) return;
        console.error('Failed to load cleaner reviews:', loadError);
        setReviewStats(normalizeStats());
        setReviews([]);
        setTotalPages(1);
        setError(loadError?.response?.data?.message || 'Failed to load customer feedback.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [authLoading, cleanerId, currentPage]);

  const maxDistributionCount = useMemo(
    () => Math.max(...reviewStats.distribution.map((item) => item.count), 0),
    [reviewStats.distribution]
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="cleaner-review-page">
      <div className="review-headline">
        <h1>Customer Feedback</h1>
        <button type="button" className="headline-action" onClick={() => navigate('/cleaner/jobs/available')}>
          View Available Jobs
        </button>
        <p>Monitor your reputation and engage with your clients.</p>
      </div>

      <div className="feedback-overview">
        <section className="feedback-rating-card">
          <div className="rating-summary">
            <div className="rating-block">
              <div className="rating-value">{reviewStats.averageRating.toFixed(1)}</div>
              <div className="stars" aria-label={`${reviewStats.averageRating.toFixed(1)} out of 5 stars`}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="average-star">
                    <span className="average-star-base">{'\u2605'}</span>
                    <span
                      className="average-star-fill"
                      style={{ width: getStarFillWidth(reviewStats.averageRating, i) }}
                    >
                      {'\u2605'}
                    </span>
                  </span>
                ))}
              </div>
              <p>Based on {reviewStats.totalReviews} total reviews</p>
            </div>

            <div className="rating-breakdown">
              {reviewStats.distribution.map(({ score, count }) => (
                <div key={score} className="breakdown-row">
                  <span className="score-label">
                    {score} {score === 1 ? 'Star' : 'Stars'}
                  </span>
                  <div className="bar-track" aria-hidden="true">
                    <span
                      className={`bar-fill${count === 0 ? ' is-empty' : ''}`}
                      style={{ width: `${maxDistributionCount ? (count / maxDistributionCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="score-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="feedback-status-card">
          <div className="status-icon" aria-hidden="true">
            <SafetyCertificateFilled />
          </div>
          <h2>Top 5% Cleaner</h2>
          <p>You&apos;re in the elite tier this month!</p>
          <span className="status-badge">Platinum Badge</span>
        </aside>
      </div>

      <div className="review-list-header">
        <h2>Recent Reviews</h2>
      </div>

      {error ? <div className="review-feedback-message review-feedback-message--error">{error}</div> : null}
      {isLoading ? <div className="review-feedback-message">Loading reviews...</div> : null}

      {!isLoading && !error ? (
        <div className="review-list">
          {reviews.length ? (
            reviews.map((review) => (
              <article key={review.id} className="review-card">
                <div className="review-top">
                  <div className="review-author">
                    <span className="avatar">
                      {review.avatar ? (
                        <img src={review.avatar} alt={review.name} />
                      ) : (
                        buildInitial(review.name)
                      )}
                    </span>
                    <div>
                      <h3>{review.name}</h3>
                      <div className="meta-line">
                        <span className="stars-inline" aria-label={`${review.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }, (_, idx) => (
                            <span key={idx} className={`star ${idx < review.rating ? 'filled' : 'empty'}`}>
                              {'\u2605'}
                            </span>
                          ))}
                        </span>
                        <span>{`Rated us ${review.rating}/5`}</span>
                        <span>{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className="service-chip">{review.service}</span>
                </div>

                <p className="comment">{review.comment || 'No written feedback provided.'}</p>

                {review.reply ? (
                  <div className="reply-box">
                    <div className="reply-head">
                      <strong>{review.reply.title}</strong>
                      <span>{review.reply.date}</span>
                    </div>
                    <p>{review.reply.text}</p>
                  </div>
                ) : null}

                <div className="review-footer">
                  <span className="verified">
                    <CheckCircleFilled /> Verified Customer
                  </span>
                  <div className="review-actions">
                    <button type="button" className="text-btn">
                      Report
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="review-feedback-message">No reviews have been submitted yet.</div>
          )}
        </div>
      ) : null}

      {!isLoading && totalPages > 1 ? (
        <div className="pagination-row">
          <button
            type="button"
            aria-label="previous page"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={currentPage === 1 ? 'disabled' : ''}
          >
            <svg className="page-arrow left" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 3.5L5.5 8L10 12.5" />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, idx) => {
            const page = idx + 1;
            return (
              <button
                key={page}
                type="button"
                className={currentPage === page ? 'active' : ''}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            aria-label="next page"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={currentPage === totalPages ? 'disabled' : ''}
          >
            <svg className="page-arrow right" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 3.5L10.5 8L6 12.5" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ReviewPage;
