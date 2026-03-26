import React, { useEffect, useMemo, useState } from 'react';
import {
  CommentOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  StarFilled,
  TrophyOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Modal, Select, notification } from 'antd';
import '../../../styles/admin/reviews_page.css';
import { reviewService } from '../services/reviewService';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const EMPTY_DISTRIBUTION = [5, 4, 3, 2, 1].map((score) => ({ score, count: 0 }));
const ratingOptions = ['All', '5', '4', '3', '2', '1'];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 'all'];
const ALL_REVIEWS_LIMIT = 10000;
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest Rating' },
  { value: 'lowest', label: 'Lowest Rating' }
];

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${apiHost}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const extractReviewRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const extractReviewStats = (response) => {
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return response.data;
  }
  if (response && typeof response === 'object' && !Array.isArray(response) && Array.isArray(response.distribution)) {
    return response;
  }
  return {};
};

const extractPagination = (response) => {
  if (response?.pagination && typeof response.pagination === 'object') return response.pagination;
  if (response?.data?.pagination && typeof response.data.pagination === 'object') return response.data.pagination;
  return {};
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDate = (value) => {
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getInitials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return initials || 'RV';
};

const formatStatusLabel = (value) => String(value || 'pending')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeReviewRow = (review) => ({
  id: String(review?.review_id || ''),
  bookingId: review?.booking_id ? `#${review.booking_id}` : 'N/A',
  customerName: review?.reviewer_name || 'Customer',
  customerEmail: review?.reviewer_email || 'No email provided',
  customerAvatar: toAbsoluteImageUrl(review?.reviewer_avatar || ''),
  cleanerName: review?.cleaner_name || 'Cleaner pending',
  cleanerEmail: review?.cleaner_email || 'No email provided',
  cleanerAvatar: toAbsoluteImageUrl(review?.cleaner_avatar || ''),
  serviceName: review?.service_name || 'Cleaning Service',
  rating: toSafeNumber(review?.rating),
  comment: review?.comment || 'No written feedback provided.',
  createdAt: review?.created_at || null,
  createdLabel: formatDate(review?.created_at),
  bookingStatus: formatStatusLabel(review?.booking_status || ''),
  serviceStatus: formatStatusLabel(review?.service_status || '')
});

const normalizeStats = (payload) => {
  const distributionMap = new Map(
    (payload?.distribution || []).map((item) => [Number(item.score), Number(item.count || 0)])
  );

  return {
    totalReviews: toSafeNumber(payload?.totalReviews),
    averageRating: toSafeNumber(payload?.averageRating),
    fiveStarReviews: toSafeNumber(payload?.fiveStarReviews),
    lowRatingReviews: toSafeNumber(payload?.lowRatingReviews),
    recentReviews: toSafeNumber(payload?.recentReviews),
    distribution: EMPTY_DISTRIBUTION.map((item) => ({
      score: item.score,
      count: distributionMap.get(item.score) || 0
    }))
  };
};

const RatingStars = ({ rating }) => (
  <span className="admin-review-stars" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <StarFilled key={index} className={index < Math.round(rating) ? 'filled' : ''} />
    ))}
  </span>
);

const ReviewsPage = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(() => normalizeStats());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [sortFilter, setSortFilter] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedReview, setSelectedReview] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchText]);

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const [statsResponse, reviewsResponse] = await Promise.all([
          reviewService.getReviewStats(),
          reviewService.getReviews({
            page: pageSize === 'all' ? 1 : page,
            limit: pageSize === 'all' ? ALL_REVIEWS_LIMIT : pageSize,
            rating: ratingFilter === 'All' ? undefined : Number(ratingFilter),
            search: debouncedSearch || undefined,
            sort: sortFilter
          })
        ]);

        if (cancelled) return;

        setStats(normalizeStats(extractReviewStats(statsResponse)));
        setReviews(extractReviewRows(reviewsResponse).map(normalizeReviewRow));
        setPagination(extractPagination(reviewsResponse));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load admin reviews:', error);
        setStats(normalizeStats());
        setReviews([]);
        setPagination({ total: 0, pages: 1 });
        setErrorMessage(error?.response?.data?.message || 'Unable to load review data right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, ratingFilter, sortFilter, debouncedSearch, refreshKey]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Number(pagination?.pages || 1));
  const totalResults = Math.max(0, Number(pagination?.total || 0));
  const pageStart = totalResults === 0 ? 0 : pageSize === 'all' ? 1 : (page - 1) * Number(pageSize) + 1;
  const pageEnd = totalResults === 0 ? 0 : pageSize === 'all' ? totalResults : Math.min(page * Number(pageSize), totalResults);
  const maxDistributionCount = useMemo(
    () => Math.max(...stats.distribution.map((item) => item.count), 0),
    [stats.distribution]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleDeleteReview = (review) => {
    Modal.confirm({
      title: `Delete review ${review.bookingId}?`,
      content: 'This review will be removed permanently.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reviewService.deleteReview(review.id);
          if (selectedReview?.id === review.id) {
            setSelectedReview(null);
          }
          if (reviews.length === 1 && page > 1) {
            setPage((prev) => Math.max(1, prev - 1));
          } else {
            setRefreshKey((prev) => prev + 1);
          }
          notificationApi.success({
            placement: 'bottomRight',
            message: 'Review deleted',
            description: 'The review was removed successfully.',
            duration: 2
          });
        } catch (error) {
          notificationApi.error({
            placement: 'bottomRight',
            message: 'Failed to delete review',
            description: error?.response?.data?.message || 'Could not delete review right now.',
            duration: 3
          });
          throw error;
        }
      }
    });
  };

  const kpiCards = [
    {
      title: 'TOTAL REVIEWS',
      value: String(stats.totalReviews),
      icon: <CommentOutlined />,
      tone: 'blue',
      note: `${stats.recentReviews} in the last 30 days`
    },
    {
      title: 'AVERAGE RATING',
      value: stats.averageRating.toFixed(1),
      icon: <StarFilled />,
      tone: 'gold',
      note: 'Across all customer feedback'
    },
    {
      title: 'FIVE STAR REVIEWS',
      value: String(stats.fiveStarReviews),
      icon: <TrophyOutlined />,
      tone: 'green',
      note: 'Best-in-class service moments'
    },
    {
      title: 'LOW RATINGS',
      value: String(stats.lowRatingReviews),
      icon: <WarningOutlined />,
      tone: 'rose',
      note: 'Ratings of 1 or 2 stars'
    }
  ];

  return (
    <section className="admin-reviews-page">
      {contextHolder}
      <header className="admin-reviews-header">
        <div>
          <h1 className="admin-page-title">Manage Reviews</h1>
          <p className="admin-page-subtitle">Monitor customer feedback and service quality trends.</p>
        </div>
      </header>

      <section className="admin-reviews-kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.title} className="admin-reviews-kpi-card">
            <div className={`reviews-kpi-icon tone-${card.tone}`}>{card.icon}</div>
            <span className="reviews-kpi-label">{card.title}</span>
            <h3>{card.value}</h3>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <section className="admin-reviews-insight-grid">
        <article className="reviews-panel reviews-distribution-panel">
          <div className="panel-head">
            <div>
              <h3>Rating Distribution</h3>
              <p>How customers are scoring completed services.</p>
            </div>
            <span className="distribution-average">
              <StarFilled />
              {stats.averageRating.toFixed(1)}
            </span>
          </div>
          <div className="distribution-list">
            {stats.distribution.map((item) => (
              <div key={item.score} className="distribution-row">
                <span>{item.score} Star</span>
                <div className="distribution-track">
                  <div
                    className="distribution-fill"
                    style={{ width: `${maxDistributionCount ? (item.count / maxDistributionCount) * 100 : 0}%` }}
                  />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="reviews-panel reviews-summary-panel">
          <div className="panel-head">
            <div>
              <h3>Feedback Snapshot</h3>
              <p>A quick read on sentiment across the platform.</p>
            </div>
          </div>
          <div className="summary-metrics">
            <div className="summary-metric">
              <small>Positive Ratio</small>
              <strong>
                {stats.totalReviews > 0
                  ? `${Math.round((stats.fiveStarReviews / stats.totalReviews) * 100)}%`
                  : '0%'}
              </strong>
            </div>
            <div className="summary-metric">
              <small>Needs Attention</small>
              <strong>{stats.lowRatingReviews}</strong>
            </div>
            <div className="summary-metric">
              <small>Recent Momentum</small>
              <strong>{stats.recentReviews}</strong>
            </div>
          </div>
          <div className="summary-note">
            <p>
              Reviews help admins spot standout cleaners, repeated complaints, and service types that may need follow-up.
            </p>
          </div>
        </article>
      </section>

      <section className="admin-reviews-filter-row">
        <div className="reviews-search-field">
          <SearchOutlined />
          <input
            type="text"
            placeholder="Search by customer, cleaner, booking, service or comment..."
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={ratingFilter}
          onChange={(value) => {
            setRatingFilter(value);
            setPage(1);
          }}
          options={ratingOptions.map((item) => ({
            value: item,
            label: item === 'All' ? 'Rating: All' : `${item} Stars`
          }))}
          className="reviews-filter-select reviews-filter-rating"
        />

        <Select
          value={sortFilter}
          onChange={(value) => {
            setSortFilter(value);
            setPage(1);
          }}
          options={sortOptions}
          className="reviews-filter-select reviews-filter-sort"
        />
      </section>

      <section className="reviews-panel reviews-table-panel">
        <div className="table-scroll">
          <table className="reviews-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>CLEANER</th>
                <th>SERVICE</th>
                <th className="rating-center">RATING</th>
                <th>REVIEW</th>
                <th>DATE</th>
                <th className="actions-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="empty-row" colSpan={7}>Loading reviews...</td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td className="empty-row" colSpan={7}>{errorMessage}</td>
                </tr>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <div className="review-user-cell">
                        <span className="review-avatar">
                          {review.customerAvatar ? (
                            <img src={review.customerAvatar} alt={review.customerName} className="review-avatar-image" />
                          ) : (
                            getInitials(review.customerName)
                          )}
                        </span>
                        <div>
                          <strong>{review.customerName}</strong>
                          <span>{review.customerEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="review-user-cell">
                        <span className="review-avatar">
                          {review.cleanerAvatar ? (
                            <img src={review.cleanerAvatar} alt={review.cleanerName} className="review-avatar-image" />
                          ) : (
                            getInitials(review.cleanerName)
                          )}
                        </span>
                        <div>
                          <strong>{review.cleanerName}</strong>
                          <span>{review.cleanerEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="review-service-meta">
                        <strong>{review.serviceName}</strong>
                        <span>{review.bookingId}</span>
                      </div>
                    </td>
                    <td className="rating-center">
                      <div className="review-rating-cell">
                        <RatingStars rating={review.rating} />
                        <strong>{review.rating.toFixed(1)}</strong>
                      </div>
                    </td>
                    <td>
                      <p className="review-comment-preview">{review.comment}</p>
                    </td>
                    <td>
                      <div className="review-date-meta">
                        <strong>{review.createdLabel}</strong>
                        <span>{review.serviceStatus || review.bookingStatus || 'Recorded'}</span>
                      </div>
                    </td>
                    <td className="actions-center">
                      <div className="action-group">
                        <button
                          className="plain-icon-btn action-view"
                          type="button"
                          title="View review"
                          onClick={() => setSelectedReview(review)}
                        >
                          <EyeOutlined />
                        </button>
                        <button
                          className="plain-icon-btn action-delete"
                          type="button"
                          title="Delete review"
                          onClick={() => handleDeleteReview(review)}
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-row" colSpan={7}>No reviews match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="reviews-pagination">
          <span>Showing {pageStart}-{pageEnd} of {totalResults} reviews</span>
          <div className="pager-actions">
            <label className="rows-label">
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => {
                  const nextValue = event.target.value === 'all' ? 'all' : Number(event.target.value);
                  setPageSize(nextValue);
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value === 'all' ? 'All' : value}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="next"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={pageSize === 'all' || page === totalPages}
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      <Modal
        title="Review Details"
        open={Boolean(selectedReview)}
        onCancel={() => setSelectedReview(null)}
        footer={null}
        width={760}
      >
        {selectedReview ? (
          <div className="review-detail-layout">
            <section className="review-detail-card">
              <div className="detail-user-row">
                <span className="review-avatar large">
                  {selectedReview.customerAvatar ? (
                    <img src={selectedReview.customerAvatar} alt={selectedReview.customerName} className="review-avatar-image" />
                  ) : (
                    getInitials(selectedReview.customerName)
                  )}
                </span>
                <div>
                  <h3>{selectedReview.customerName}</h3>
                  <p>{selectedReview.customerEmail}</p>
                  <span>{selectedReview.createdLabel}</span>
                </div>
              </div>
              <div className="detail-rating-row">
                <RatingStars rating={selectedReview.rating} />
                <strong>{selectedReview.rating.toFixed(1)} / 5</strong>
              </div>
              <p className="detail-comment">{selectedReview.comment}</p>
            </section>

            <section className="review-detail-meta">
              <div className="detail-meta-item">
                <small>Service</small>
                <strong>{selectedReview.serviceName}</strong>
              </div>
              <div className="detail-meta-item">
                <small>Booking</small>
                <strong>{selectedReview.bookingId}</strong>
              </div>
              <div className="detail-meta-item">
                <small>Cleaner</small>
                <strong>{selectedReview.cleanerName}</strong>
                <span>{selectedReview.cleanerEmail}</span>
              </div>
              <div className="detail-meta-item">
                <small>Status</small>
                <strong>{selectedReview.serviceStatus || selectedReview.bookingStatus || 'Recorded'}</strong>
              </div>
            </section>
          </div>
        ) : null}
      </Modal>
    </section>
  );
};

export default ReviewsPage;
