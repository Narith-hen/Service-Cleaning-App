import React from 'react';
import {
  CheckCircleFilled,
  StarFilled,
  MessageOutlined,
  SafetyCertificateFilled
} from '@ant-design/icons';
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
    reply: {
      title: 'Your Reply',
      date: 'Oct 22, 2024',
      text: "Thank you for the feedback, Michael! Apologies for the breakroom window - I'll make sure to give it extra attention during our next visit!"
    }
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
  }
];

const ReviewPage = () => {
  return (
    <div className="cleaner-review-page">
      <div className="review-headline">
        <h1>Customer Feedback</h1>
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
            You are among the highest-rated cleaners in your area. This status increases your
            visibility for premium job requests.
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
        {reviews.map((review) => (
          <article key={review.id} className="review-card">
            <div className="review-top">
              <div className="review-author">
                <span className="avatar">{review.name.charAt(0)}</span>
                <div>
                  <h3>{review.name}</h3>
                  <div className="meta-line">
                    <span className="stars-inline">{'★'.repeat(review.rating)}</span>
                    <span>{review.date}</span>
                  </div>
                </div>
              </div>
              <span className="service-chip">{review.service}</span>
            </div>

            <p className="comment">{review.comment}</p>

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
                <button type="button" className="text-btn">Report</button>
                <button type="button" className="reply-btn">
                  <MessageOutlined /> Reply
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="pagination-row">
        <button type="button" aria-label="previous page">
          <svg className="page-arrow left" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3.5L5.5 8L10 12.5" />
          </svg>
        </button>
        <button type="button" className="active">1</button>
        <button type="button">2</button>
        <button type="button">3</button>
        <button type="button" aria-label="next page">
          <svg className="page-arrow right" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3.5L10.5 8L6 12.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReviewPage;
