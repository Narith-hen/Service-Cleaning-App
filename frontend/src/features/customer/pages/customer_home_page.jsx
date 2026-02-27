import React, { useState } from 'react';
import { 
  SearchOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  StarOutlined,
  RightOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ToolOutlined,
  HomeOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../../styles/customer/home.scss';

const CustomerHomePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual data from hooks/services
  const userData = {
    name: 'John',
    upcomingBookings: 2
  };

  const services = [
    {
      id: 1,
      name: 'Regular Cleaning',
      description: 'Bi-weekly or weekly maintenance cleaning',
      price: 45,
      duration: '2 hours',
      icon: <HomeOutlined />,
      color: 'blue'
    },
    {
      id: 2,
      name: 'Deep Cleaning',
      description: 'Thorough cleaning of entire space',
      price: 120,
      duration: '4 hours',
      icon: <ToolOutlined />,
      color: 'purple'
    },
    {
      id: 3,
      name: 'Move Out/In',
      description: 'End of lease or move-in cleaning',
      price: 160,
      duration: '6 hours',
      icon: <ShopOutlined />,
      color: 'green'
    },
    {
      id: 4,
      name: 'Window Cleaning',
      description: 'Interior and exterior windows',
      price: 80,
      duration: '2 hours',
      icon: <EnvironmentOutlined />,
      color: 'orange'
    }
  ];

  const recentBookings = [
    {
      id: 'BK001',
      service: 'Regular Cleaning',
      date: 'Oct 24, 2024',
      time: '02:00 PM',
      status: 'completed',
      cleaner: 'Maria Garcia',
      rating: 5
    },
    {
      id: 'BK002',
      service: 'Deep Cleaning',
      date: 'Oct 26, 2024',
      time: '10:00 AM',
      status: 'upcoming',
      cleaner: 'David Lee'
    }
  ];

  const featuredCleaners = [
    {
      id: 1,
      name: 'Maria Garcia',
      rating: 4.9,
      jobs: 156,
      specialty: 'Deep Cleaning',
      avatar: null
    },
    {
      id: 2,
      name: 'David Lee',
      rating: 5.0,
      jobs: 98,
      specialty: 'Window Cleaning',
      avatar: null
    },
    {
      id: 3,
      name: 'James Wilson',
      rating: 4.8,
      jobs: 142,
      specialty: 'Move Out/In',
      avatar: null
    }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="status-badge completed">Completed</span>;
      case 'upcoming':
        return <span className="status-badge upcoming">Upcoming</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="customer-home">
      {/* Hero Section with Search */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Hi {userData.name}! 👋
          </h1>
          <p className="hero-subtitle">
            What would you like to clean today?
          </p>
          
          <div className="search-box">
            <SearchOutlined className="search-icon" />
            <input
              type="text"
              placeholder="Search for cleaning services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn">Search</button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="quick-action-btn" onClick={() => navigate('/customer/bookings')}>
          <CalendarOutlined />
          <span>My Bookings</span>
          {userData.upcomingBookings > 0 && (
            <span className="badge">{userData.upcomingBookings}</span>
          )}
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/customer/favorites')}>
          <StarOutlined />
          <span>Favorites</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/customer/profile')}>
          <UserOutlined />
          <span>Profile</span>
        </button>
      </div>

      {/* Popular Services */}
      <div className="services-section">
        <div className="section-header">
          <h2>Popular Services</h2>
          <button className="view-all" onClick={() => navigate('/services')}>
            View All <RightOutlined />
          </button>
        </div>

        <div className="services-grid">
          {services.map(service => (
            <div key={service.id} className={`service-card service-${service.color}`}>
              <div className="service-icon">{service.icon}</div>
              <div className="service-info">
                <h3>{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-meta">
                  <span className="service-price">${service.price}</span>
                  <span className="service-duration">
                    <ClockCircleOutlined /> {service.duration}
                  </span>
                </div>
              </div>
              <button className="book-now-btn">Book Now</button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="recent-bookings-section">
        <div className="section-header">
          <h2>Recent Bookings</h2>
          <button className="view-all" onClick={() => navigate('/customer/bookings')}>
            View All <RightOutlined />
          </button>
        </div>

        <div className="bookings-list">
          {recentBookings.map(booking => (
            <div key={booking.id} className="booking-item">
              <div className="booking-main">
                <div className="booking-service">
                  <h3>{booking.service}</h3>
                  <div className="booking-datetime">
                    <CalendarOutlined /> {booking.date} at {booking.time}
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>
              
              {booking.cleaner && (
                <div className="booking-cleaner">
                  <span>Cleaner: {booking.cleaner}</span>
                  {booking.rating && (
                    <span className="cleaner-rating">
                      <StarOutlined /> {booking.rating}
                    </span>
                  )}
                </div>
              )}

              {booking.status === 'completed' && !booking.rating && (
                <button className="rate-btn" onClick={() => navigate(`/customer/write-review/${booking.id}`)}>
                  Rate Your Experience
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Featured Cleaners */}
      <div className="cleaners-section">
        <div className="section-header">
          <h2>Top Rated Cleaners</h2>
          <button className="view-all" onClick={() => navigate('/cleaners')}>
            View All <RightOutlined />
          </button>
        </div>

        <div className="cleaners-grid">
          {featuredCleaners.map(cleaner => (
            <div key={cleaner.id} className="cleaner-card">
              <div className="cleaner-avatar">
                {cleaner.avatar ? (
                  <img src={cleaner.avatar} alt={cleaner.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {cleaner.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="cleaner-info">
                <h4>{cleaner.name}</h4>
                <div className="cleaner-rating">
                  <StarOutlined /> {cleaner.rating} ({cleaner.jobs} jobs)
                </div>
                <p className="cleaner-specialty">{cleaner.specialty}</p>
              </div>
              <button className="view-profile-btn">View Profile</button>
            </div>
          ))}
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="promo-banner">
        <div className="promo-content">
          <h3>First Time Customer?</h3>
          <p>Get 20% off your first booking with code: NEWCLEAN20</p>
          <button className="promo-btn">Book Now</button>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="help-section">
        <h3>Need assistance?</h3>
        <p>Our support team is here to help you 24/7</p>
        <div className="help-actions">
          <button className="help-btn" onClick={() => navigate('/customer/help/faq')}>
            FAQ
          </button>
          <button className="help-btn primary" onClick={() => navigate('/customer/help/contact')}>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerHomePage;