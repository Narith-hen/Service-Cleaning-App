import React, { useState } from 'react';
import { 
  CalendarOutlined, 
  DollarOutlined, 
  StarOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../../styles/cleaner/dashboard.scss';

const CleanerDashboardPage = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('week');

  // Mock data - replace with actual data from hooks/services
  const cleanerData = {
    name: 'Alex',
    todayAppointments: 4,
    totalEarnings: 128.50,
    earningsChange: '+1',
    earningsChangePeriod: 'today',
    rating: 4.9,
    ratingChange: '+15%',
    ratingChangePeriod: 'week',
    bookings: [
      {
        id: 1,
        title: 'Regular Bi-Weekly Maintenance',
        date: 'OCT 24',
        time: '02:00 PM - 04:00 PM',
        location: '1200 Lakeview Towers, #402',
        client: 'James Chen',
        amount: 45.00,
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
        amount: 160.00,
        rateType: 'Commercial',
        status: 'tomorrow',
        propertyManager: 'Modern Property Mgmt'
      }
    ]
  };

  const handleLogout = () => {
    // Add logout logic
    navigate('/login');
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'early': return 'status-early';
      case 'tomorrow': return 'status-tomorrow';
      default: return '';
    }
  };

  return (
    <div className="cleaner-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">
          Welcome back, <span className="cleaner-name">{cleanerData.name}</span>
        </h1>
        <p className="welcome-subtitle">
          You have <strong>{cleanerData.todayAppointments} appointments</strong> scheduled for today. 
          You're on a roll!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {/* Total Earnings Card */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-change positive">+{cleanerData.earningsChange} today</span>
          </div>
          <div className="stat-content">
            <div className="stat-icon earnings-icon">
              <DollarOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Earnings</span>
              <span className="stat-value">${cleanerData.totalEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Rating Card */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-change positive">+{cleanerData.ratingChange} week</span>
          </div>
          <div className="stat-content">
            <div className="stat-icon rating-icon">
              <StarOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-label">Current Rating</span>
              <span className="stat-value">{cleanerData.rating} ★★★★★</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="bookings-section">
        <div className="section-header">
          <h2>Bookings</h2>
        </div>

        {/* Bookings Table - Desktop View */}
        <div className="bookings-table desktop-view">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {cleanerData.bookings.map(booking => (
                <tr key={booking.id}>
                  <td className="booking-date">{booking.date}</td>
                  <td className="booking-time">{booking.time}</td>
                  <td className="booking-location">{booking.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Booking Cards - Mobile View */}
        <div className="booking-cards mobile-view">
          {cleanerData.bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-datetime">
                <span className="date">{booking.date}</span>
                <span className="time">{booking.time}</span>
              </div>
              <div className="booking-location">{booking.location}</div>
            </div>
          ))}
        </div>

        {/* Booking Details Cards */}
        <div className="booking-details-grid">
          {cleanerData.bookings.map(booking => (
            <div key={booking.id} className="booking-detail-card">
              <div className="booking-header">
                <h3>{booking.title}</h3>
                <span className={`booking-status ${getStatusClass(booking.status)}`}>
                  {booking.status === 'early' ? 'Early' : 'Tomorrow'}
                </span>
              </div>
              
              <div className="booking-pricing">
                <span className="amount">${booking.amount.toFixed(2)}</span>
                <span className="rate-type">{booking.rateType}</span>
              </div>

              <button className="view-details-btn">
                View Details <RightOutlined />
              </button>

              {booking.propertyManager && (
                <div className="property-manager">
                  <em>{booking.propertyManager}</em>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show All Link */}
        <div className="show-all-link">
          <button className="show-all-btn">
            Show All Upcoming Jobs <RightOutlined />
          </button>
        </div>
      </div>

      {/* Support Section */}
      <div className="support-section">
        <h3>Need help with a job?</h3>
        <p>Our support team is available 24/7 for urgent issues.</p>
        <button className="support-btn">Contact Support</button>
      </div>

      {/* Logout Button - Mobile */}
      <div className="mobile-logout">
        <button className="logout-btn" onClick={handleLogout}>
          <LogoutOutlined /> Logout
        </button>
      </div>
    </div>
  );
};

export default CleanerDashboardPage;