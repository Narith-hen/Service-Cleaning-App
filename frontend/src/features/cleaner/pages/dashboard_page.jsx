import React, { useState } from 'react';
import {
  CalendarOutlined,
  StarOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../../styles/cleaner/dashboard.scss';

const CleanerDashboardPage = () => {
  const navigate = useNavigate();
  const [selectedStatKey, setSelectedStatKey] = useState('rating');

  const cleanerData = {
    name: 'Narith',
    todayAppointments: 4,
    rating: 4.9,
    ratingTier: 'Top 5%',
    totalService: 124,
    oneMonthService: 18,
    cancelCount: 2
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const handleStatClick = (statKey) => {
    setSelectedStatKey(statKey);
  };

  return (
    <div className="cleaner-dashboard">
      <div className="welcome-section">
        <h1 className="welcome-title">
          Welcome back, <span className="cleaner-name">{cleanerData.name}</span>
        </h1>
        <p className="welcome-subtitle">
          You have {cleanerData.todayAppointments} appointments scheduled for today. You're on a roll!
        </p>
      </div>

      <div className="stats-grid">
        <div
          className={`stat-card ${selectedStatKey === 'rating' ? 'active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => handleStatClick('rating')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleStatClick('rating');
            }
          }}
        >
          <div className="stat-header">
            <div className="stat-icon rating-icon">
              <StarOutlined />
            </div>
            <span className="stat-change positive">{cleanerData.ratingTier}</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Rating</span>
            <div className="rating-wrap">
              <span className="stat-value">{cleanerData.rating}</span>
              <span className="star-text">*****</span>
            </div>
          </div>
        </div>

        <div
          className={`stat-card ${selectedStatKey === 'totalService' ? 'active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => handleStatClick('totalService')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleStatClick('totalService');
            }
          }}
        >
          <div className="stat-header">
            <div className="stat-icon jobs-icon">
              <CalendarOutlined />
            </div>
            <span className="stat-change positive">All time</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Service</span>
            <span className="stat-value">{cleanerData.totalService}</span>
          </div>
        </div>

        <div
          className={`stat-card ${selectedStatKey === 'oneMonthService' ? 'active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => handleStatClick('oneMonthService')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleStatClick('oneMonthService');
            }
          }}
        >
          <div className="stat-header">
            <div className="stat-icon earnings-icon">
              <ClockCircleOutlined />
            </div>
            <span className="stat-change positive">This month</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Service One Month</span>
            <span className="stat-value">{cleanerData.oneMonthService}</span>
          </div>
        </div>

        <div
          className={`stat-card ${selectedStatKey === 'cancel' ? 'active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => handleStatClick('cancel')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleStatClick('cancel');
            }
          }}
        >
          <div className="stat-header">
            <div className="stat-icon cancel-icon">
              <CloseCircleOutlined />
            </div>
            <span className="stat-change cancel">Low rate</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Cancel</span>
            <span className="stat-value">{cleanerData.cancelCount}</span>
          </div>
        </div>
      </div>

      {selectedStatKey === 'rating' && (
        <section className="review-chart">
          <div className="chart-header">
            <h3>Review Chart</h3>
            <p>Customer rating distribution</p>
          </div>

          <div className="chart-bars">
            <div className="chart-row">
              <span className="chart-label">5 Stars</span>
              <div className="chart-track">
                <span className="chart-fill level-5" />
              </div>
              <strong>72%</strong>
            </div>
            <div className="chart-row">
              <span className="chart-label">4 Stars</span>
              <div className="chart-track">
                <span className="chart-fill level-4" />
              </div>
              <strong>19%</strong>
            </div>
            <div className="chart-row">
              <span className="chart-label">3 Stars</span>
              <div className="chart-track">
                <span className="chart-fill level-3" />
              </div>
              <strong>6%</strong>
            </div>
            <div className="chart-row">
              <span className="chart-label">2 Stars</span>
              <div className="chart-track">
                <span className="chart-fill level-2" />
              </div>
              <strong>2%</strong>
            </div>
            <div className="chart-row">
              <span className="chart-label">1 Star</span>
              <div className="chart-track">
                <span className="chart-fill level-1" />
              </div>
              <strong>1%</strong>
            </div>
          </div>
        </section>
      )}

      <div className="mobile-logout">
        <button className="logout-btn" type="button" onClick={handleLogout}>
          <LogoutOutlined /> Logout
        </button>
      </div>
    </div>
  );
};

export default CleanerDashboardPage;
