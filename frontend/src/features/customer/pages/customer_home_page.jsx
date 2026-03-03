import React, { useState } from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  RightOutlined,
  SearchOutlined,
  ShopOutlined,
  StarFilled,
  StarOutlined,
  ToolOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../../styles/customer/home.scss';

const services = [
  {
    id: 1,
    name: 'Regular Cleaning',
    description: 'Weekly or bi-weekly upkeep for your home.',
    price: 45,
    duration: '2 hours',
    icon: <HomeOutlined />,
    theme: 'mint'
  },
  {
    id: 2,
    name: 'Deep Cleaning',
    description: 'Top-to-bottom cleaning for hard-to-reach areas.',
    price: 120,
    duration: '4 hours',
    icon: <ToolOutlined />,
    theme: 'amber'
  },
  {
    id: 3,
    name: 'Move In/Out',
    description: 'Detailed cleaning before move-in or handover.',
    price: 160,
    duration: '6 hours',
    icon: <ShopOutlined />,
    theme: 'sky'
  },
  {
    id: 4,
    name: 'Window Cleaning',
    description: 'Interior and exterior window care and shine.',
    price: 80,
    duration: '2 hours',
    icon: <EnvironmentOutlined />,
    theme: 'rose'
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
    cleaner: 'David Lee',
    rating: null
  }
];

const CustomerHomePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const userData = {
    name: 'John',
    upcomingBookings: 2,
    completedJobs: 14,
    favoriteServices: 6
  };

  return (
    <div className="customer-home">
      <section className="home-hero">
        <div className="hero-text">
          <p className="eyebrow">Customer Dashboard</p>
          <h1>Hello, {userData.name}</h1>
          <p className="subtitle">Plan your next cleaning session in less than a minute.</p>

          <div className="search-wrap">
            <SearchOutlined className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services, cleaners, or locations"
            />
            <button type="button" onClick={() => navigate('/services')}>Search</button>
          </div>
        </div>

        <div className="hero-stats">
          <article>
            <span>Upcoming</span>
            <strong>{userData.upcomingBookings}</strong>
          </article>
          <article>
            <span>Completed</span>
            <strong>{userData.completedJobs}</strong>
          </article>
          <article>
            <span>Favorites</span>
            <strong>{userData.favoriteServices}</strong>
          </article>
        </div>
      </section>

      <section className="quick-actions">
        <button type="button" onClick={() => navigate('/customer/bookings')}>
          <CalendarOutlined />
          <span>My Bookings</span>
        </button>
        <button type="button" onClick={() => navigate('/customer/favorites')}>
          <StarOutlined />
          <span>Favorites</span>
        </button>
        <button type="button" onClick={() => navigate('/customer/profile')}>
          <UserOutlined />
          <span>Profile</span>
        </button>
      </section>

      <section className="services-section">
        <div className="section-head">
          <h2>Popular Services</h2>
          <button type="button" onClick={() => navigate('/services')}>
            View all <RightOutlined />
          </button>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <article key={service.id} className={`service-card ${service.theme}`}>
              <div className="service-top">
                <span className="service-icon">{service.icon}</span>
                <span className="service-duration">
                  <ClockCircleOutlined /> {service.duration}
                </span>
              </div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-bottom">
                <strong>${service.price}</strong>
                <button type="button" onClick={() => navigate('/customer/bookings')}>
                  Book now
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bookings-section">
        <div className="section-head">
          <h2>Recent Bookings</h2>
          <button type="button" onClick={() => navigate('/customer/bookings')}>
            View all <RightOutlined />
          </button>
        </div>

        <div className="bookings-grid">
          {recentBookings.map((booking) => (
            <article key={booking.id} className="booking-card">
              <div className="booking-main">
                <h3>{booking.service}</h3>
                <span className={`status ${booking.status}`}>{booking.status}</span>
              </div>
              <p className="booking-time">
                <CalendarOutlined /> {booking.date} at {booking.time}
              </p>
              <p className="booking-cleaner">Cleaner: {booking.cleaner}</p>

              <div className="booking-foot">
                {booking.rating ? (
                  <span className="rating">
                    <StarFilled /> {booking.rating.toFixed(1)}
                  </span>
                ) : (
                  <span className="rating pending">
                    <CheckCircleOutlined /> Waiting for review
                  </span>
                )}

                {booking.status === 'completed' && !booking.rating && (
                  <button type="button" onClick={() => navigate(`/customer/write-review/${booking.id}`)}>
                    Write review
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="support-banner">
        <div>
          <h3>Need help choosing a service?</h3>
          <p>Chat with support and get a recommendation based on your home and schedule.</p>
        </div>
        <button type="button" onClick={() => navigate('/customer/help/contact')}>
          Contact support
        </button>
      </section>
    </div>
  );
};

export default CustomerHomePage;
