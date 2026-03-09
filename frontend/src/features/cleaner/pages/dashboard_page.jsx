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

const polarToCartesian = (cx, cy, radius, angleDeg) => {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(radians),
    y: cy - radius * Math.cos(radians)
  };
};

const describeSector = (cx, cy, radius, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
};

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
    cancelCount: 2,
    pageChart: [
      {
        key: 'jobRequests',
        page: 'Job Requests',
        color: '#22c55e',
        items: ['Deep House Cleaning', 'Move-Out Sanitation', 'Office Recurring Clean', 'Condo Routine Clean']
      },
      {
        key: 'myJobs',
        page: 'My Jobs',
        color: '#3b82f6',
        items: ['Full Apartment Deep Clean', 'Standard Recurring Clean', 'Move-out Sanitation']
      },
      {
        key: 'reviews',
        page: 'Reviews',
        color: '#f59e0b',
        items: ['5-star reviews', '4-star reviews', 'Recent comments', 'Verified customers', 'Cleaner replies']
      },
      {
        key: 'earnings',
        page: 'Earnings',
        color: '#ef4444',
        items: ['Today earnings', 'Weekly payout', 'Monthly summary', 'Pending transfers']
      }
    ]
  };

  const totalChartItems = cleanerData.pageChart.reduce((sum, segment) => sum + segment.items.length, 0);

  const pieSize = 360;
  const pieCenter = pieSize / 2;
  const pieRadius = 170;
  const labelRadius = 95;
  const chartStartAngle = 270;
  let runningAngle = chartStartAngle;

  const chartSegments = cleanerData.pageChart.map((segment) => {
    const count = segment.items.length;
    const value = totalChartItems > 0 ? (count / totalChartItems) * 100 : 0;
    const sweep = (value / 100) * 360;
    const startAngle = runningAngle;
    const endAngle = runningAngle + sweep;
    const midAngle = startAngle + sweep / 2;
    runningAngle = endAngle;

    return {
      ...segment,
      count,
      value,
      path: describeSector(pieCenter, pieCenter, pieRadius, startAngle, endAngle),
      labelPosition: polarToCartesian(pieCenter, pieCenter, labelRadius, midAngle)
    };
  });

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

      <section className="review-chart">
        <div className="chart-header">
          <h3>Page Activity Chart</h3>
          <p>Page distribution by total items.</p>
          <p className="chart-total">Total items in chart: {totalChartItems}</p>
        </div>

        <div className="chart-donut-wrap">
          <svg
            className="chart-pie"
            viewBox={`0 0 ${pieSize} ${pieSize}`}
            role="img"
            aria-label="Page activity chart"
          >
            {chartSegments.map((segment) => (
              <path
                key={segment.key}
                d={segment.path}
                className="chart-pie-segment"
                style={{ fill: segment.color }}
                aria-label={`${segment.page}: ${segment.count} items`}
              />
            ))}
            {chartSegments.map((segment) => (
              <text
                key={`${segment.key}-label`}
                x={segment.labelPosition.x}
                y={segment.labelPosition.y}
                className="chart-pie-label"
              >
                <tspan x={segment.labelPosition.x} className="chart-pie-count">
                  {segment.count}
                </tspan>
                <tspan x={segment.labelPosition.x} dy="1.1em" className="chart-pie-percent">
                  {segment.value.toFixed(1)}%
                </tspan>
              </text>
            ))}
          </svg>
        </div>
      </section>

      <div className="mobile-logout">
        <button className="logout-btn" type="button" onClick={handleLogout}>
          <LogoutOutlined /> Logout
        </button>
      </div>
    </div>
  );
};

export default CleanerDashboardPage;
