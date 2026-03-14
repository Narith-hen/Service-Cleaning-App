import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleFilled, StarFilled, SafetyCertificateFilled } from '@ant-design/icons';
import '../../../styles/cleaner/review.scss';

const reviews = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    date: 'Oct 24, 2024',
    service: 'Deep House Cleaning',
    rating: 5,
    comment:
      "Alex did an incredible job! The attention to detail in the kitchen and bathrooms was beyond my expectations. I've already scheduled my next bi-weekly maintenance.",
    reply: null
  },
  {
    id: 2,
    name: 'Michael Chen',
    date: 'Oct 20, 2024',
    service: 'Office Recurring Clean',
    rating: 4,
    comment:
      'Very punctual and efficient. The office looks great. One minor spot missed on the breakroom window but otherwise flawless. Will continue the contract.',
    reply: null
  },
  {
    id: 3,
    name: 'David Miller',
    date: 'Oct 18, 2024',
    service: 'Move-out Sanitation',
    rating: 5,
    comment:
      'I was worried about getting my deposit back but the place looked brand new when Alex was finished. Every corner was scrubbed. Absolute professional.',
    reply: null
  },
  {
    id: 4,
    name: 'Emily Carter',
    date: 'Oct 15, 2024',
    service: 'Apartment Cleaning',
    rating: 5,
    comment:
      'Very thorough cleaning and great communication before arrival. Kitchen and bathroom were spotless.',
    reply: null
  },
  {
    id: 5,
    name: 'Ryan Lopez',
    date: 'Oct 12, 2024',
    service: 'Weekly Home Cleaning',
    rating: 4,
    comment:
      'Arrived on time and finished quickly. Overall quality was very good and I am satisfied with the service.',
    reply: null
  },
  {
    id: 6,
    name: 'Nina Patel',
    date: 'Oct 10, 2024',
    service: 'Deep House Cleaning',
    rating: 5,
    comment:
      'Amazing work from start to finish. Floors, windows, and counters looked perfect after the service.',
    reply: null
  },
  {
    id: 7,
    name: 'Jacob Thompson',
    date: 'Oct 7, 2024',
    service: 'Move-out Cleaning',
    rating: 4,
    comment:
      'Strong attention to detail and professional behavior. I would definitely book again for future cleanings.',
    reply: null
  },
  {
    id: 8,
    name: 'Lisa Nguyen',
    date: 'Oct 4, 2024',
    service: 'Office Recurring Clean',
    rating: 5,
    comment:
      'Consistently excellent results. The workspace feels fresh and organized every time.',
    reply: null
  },
  {
    id: 9,
    name: 'Daniel Brooks',
    date: 'Oct 2, 2024',
    service: 'Deep Cleaning',
    rating: 4,
    comment: 'Professional and careful with fragile items. Very happy with the final outcome.',
    reply: null
  },
  {
    id: 10,
    name: 'Sophia Kim',
    date: 'Sep 29, 2024',
    service: 'Home Cleaning',
    rating: 5,
    comment: 'Best cleaning service I have booked this year. Everything looked fresh and spotless.',
    reply: null
  },
  {
    id: 11,
    name: 'Anthony Reed',
    date: 'Sep 26, 2024',
    service: 'Weekly Home Cleaning',
    rating: 4,
    comment: 'Reliable and easy to work with. Minor touch-ups needed but overall excellent service.',
    reply: null
  },
  {
    id: 12,
    name: 'Mia Rodriguez',
    date: 'Sep 24, 2024',
    service: 'Apartment Cleaning',
    rating: 5,
    comment: 'Great communication and very detailed cleaning. I will definitely schedule again.',
    reply: null
  },

];

const ReviewPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 4;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const pagedReviews = useMemo(() => {
    const start = (currentPage - 1) * reviewsPerPage;
    return reviews.slice(start, start + reviewsPerPage);
  }, [currentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="cleaner-review-page">
      <div className="review-headline">
        <h1>Customer Feedback</h1>
        <button type="button" className="reply-btn" onClick={() => navigate('/cleaner/jobs/available')}>
          View Available Jobs
        </button>
        <p>Monitor your reputation and engage with your clients.</p>
      </div>

      <div className="overview-card">
        <div className="rating-block">
          <span className="label">Average Rating</span>
          <div className="rating-value">4.9</div>
          <div className="stars" aria-label="5 stars">
            {[...Array(5)].map((_, i) => (
              <StarFilled key={i} />
            ))}
          </div>
          <p>Based on 124 reviews</p>
        </div>

        <div className="rating-breakdown">
          {[5, 4, 3, 2, 1].map((score) => (
            <div key={score} className="breakdown-row">
              <span>{score}</span>
              <span>{score === 5 ? 105 : score === 4 ? 15 : score === 3 ? 4 : score === 2 ? 0 : 0}</span>
            </div>
          ))}
        </div>

        <div className="status-box">
          <h3>
            <SafetyCertificateFilled /> Top 5% Cleaner
          </h3>
          <p>
            You are among the highest-rated cleaners in your area. This status increases your visibility for premium
            job requests.
          </p>
        </div>
      </div>

      <div className="review-list-header">
        <h2>Recent Reviews</h2>
        <div className="actions">
          <select defaultValue="most-recent">
            <option value="most-recent">Most Recent</option>
          </select>
          <button type="button" className="review-filter-btn">
            <svg className="review-filter-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 4h12M4 8h8M6 12h4" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className="review-list">
        {pagedReviews.map((review) => (
          <article key={review.id} className="review-card">
            <div className="review-top">
              <div className="review-author">
                <span className="avatar">{review.name.charAt(0)}</span>
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

            <p className="comment">{review.comment}</p>

            <div className="review-footer">
              <span className="verified">
                <CheckCircleFilled /> Verified Customer
              </span>
            </div>
          </article>
        ))}
      </div>

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
    </div>
  );
};

export default ReviewPage;

 
