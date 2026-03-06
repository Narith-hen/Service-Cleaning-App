import React from 'react';
import {
  CalendarOutlined,
  StarOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../../styles/cleaner/dashboard.scss';

const CleanerDashboardPage = () => {
  const navigate = useNavigate();

  const cleanerData = {
    name: 'Narith',
    todayAppointments: 4,
    rating: 4.9,
    ratingTier: 'Top 5%',
    totalService: 124,
    oneMonthService: 18,
    cancelCount: 2,
    bookings: [
      {
        id: 1,
        title: 'Regular Bi-Weekly Maintenance',
        date: 'OCT 24',
        time: '02:00 PM - 04:00 PM',
        location: '1200 Lakeview Towers, #402',
        client: 'James Chen',
        amount: 45.0,
        rateType: 'Flat Rate',
        status: 'early',
        propertyManager: null
      },
      {
        id: 2,
        title: 'Move-Out End of Tenancy',
        date: 'OCT 25',
        time: '08:00 AM - 02:00 PM',
        location: '88 Pine St, Suite 10',
        client: null,
        amount: 160.0,
        rateType: 'Commercial',
        status: 'tomorrow',
        propertyManager: 'Modern Property Mgmt'
      }
    ]
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'early':
        return 'Early';
      case 'tomorrow':
        return 'Tomorrow';
      default:
        return '';
    }
  };

  const formatDate = (value) => {
    const [month, day] = value.split(' ');
    return { month, day };
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
        <div className="stat-card">
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
              <span className="star-text">★★★★★</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
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

        <div className="stat-card">
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

        <div className="stat-card">
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

      <div className="bookings-section">
        <div className="section-header">
          <h2>Bookings</h2>
        </div>

        <div className="booking-list">
          {cleanerData.bookings.map((booking) => {
            const date = formatDate(booking.date);

            return (
              <div key={booking.id} className="booking-row">
                <div className="booking-date-box" aria-label={booking.date}>
                  <span className="month">{date.month}</span>
                  <span className="day">{date.day}</span>
                </div>

                <div className="booking-main">
                  <h3 className="booking-title">{booking.title}</h3>
                  <div className="booking-meta">
                    <span>
                      <ClockCircleOutlined /> {booking.time}
                    </span>
                    <span>
                      <EnvironmentOutlined /> {booking.location}
                    </span>
                    {booking.client && (
                      <span>
                        <UserOutlined /> {booking.client}
                      </span>
                    )}
                  </div>
                  {booking.propertyManager && (
                    <p className="property-manager">
                      <UserOutlined /> {booking.propertyManager}
                    </p>
                  )}
                </div>

                <div className="booking-actions">
                  <div className="booking-price">
                    <span className="amount">${booking.amount.toFixed(2)}</span>
                    <span className="rate-type">{booking.rateType}</span>
                  </div>
                  <button type="button" className="details-btn">
                    View Details
                  </button>
                  <span className={`booking-status ${booking.status}`}>{getStatusLabel(booking.status)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="show-all-row">
          <button className="show-all-btn" type="button">
            Show All Upcoming Jobs
          </button>
        </div>
      </div>

      <div className="support-section">
        <div className="support-left">
          <div className="support-icon">
            <CustomerServiceOutlined />
          </div>
          <div>
            <h3>Need help with a job?</h3>
            <p>Our support team is available 24/7 for urgent issues.</p>
          </div>
        </div>
        <button className="support-btn" type="button">
          Contact Support
        </button>
      </div>

      <div className="mobile-logout">
        <button className="logout-btn" type="button" onClick={handleLogout}>
          <LogoutOutlined /> Logout
        </button>
      </div>
    </div>
  );
};

export default CleanerDashboardPage;
