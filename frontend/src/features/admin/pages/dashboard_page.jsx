import React from 'react';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  StarFilled,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import '../../../styles/admin/dashboard_page.css';
import { useTheme } from '../../../contexts/theme_context';
import { bookingRows } from '../data/bookings_data';
import { starterCleaners } from '../data/cleaners_data';

const DashboardPage = () => {
  const { darkMode } = useTheme();
  const totalBookings = bookingRows.length;
  const monthlyRevenue = bookingRows
    .filter((booking) => booking.status !== 'Cancelled')
    .reduce((sum, booking) => sum + booking.amount, 0);
  const activeCleanersCount = starterCleaners.filter((cleaner) => cleaner.status === 'Active').length;
  const topCleaners = starterCleaners
    .filter((cleaner) => cleaner.rating > 0)
    .sort((a, b) => b.totalJobs - a.totalJobs)
    .slice(0, 3);
  const recentBookings = [...bookingRows]
    .sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`))
    .slice(0, 4)
    .map((booking) => ({
      id: booking.bookingId,
      customer: booking.customerName,
      cleaner: booking.cleanerName,
      status: booking.status,
      amount: `$${booking.amount.toFixed(2)}`,
    }));

  const kpiCards = [
    {
      title: 'Total Bookings',
      value: String(totalBookings),
      icon: <CalendarOutlined />,
      tone: 'blue',
      subtitle: 'Current booking queue',
    },
    {
      title: 'Active Cleaners',
      value: String(activeCleanersCount),
      icon: <TeamOutlined />,
      tone: 'green',
      subtitle: '2 currently on-site',
    },
    {
      title: 'Monthly Revenue',
      value: `$${monthlyRevenue.toFixed(2)}`,
      icon: <DollarOutlined />,
      tone: 'amber',
      subtitle: `Revenue from ${totalBookings} jobs`,
    },
    {
      title: 'Customer Complaints',
      value: '5',
      icon: <ClockCircleOutlined />,
      tone: 'red',
      subtitle: '2 require urgent response',
    },
  ];

  const bookingVolume = [
    { day: 'Jan', value: 44, capacity: 62 },
    { day: 'Feb', value: 52, capacity: 68 },
    { day: 'Mar', value: 61, capacity: 76 },
    { day: 'Apr', value: 58, capacity: 74 },
    { day: 'May', value: 66, capacity: 82 },
    { day: 'Jun', value: 54, capacity: 72 },
    { day: 'Jul', value: 63, capacity: 80 },
    { day: 'Aug', value: 69, capacity: 86 },
    { day: 'Sep', value: 57, capacity: 73 },
    { day: 'Oct', value: 62, capacity: 79 },
    { day: 'Nov', value: 71, capacity: 88 },
    { day: 'Dec', value: 74, capacity: 92 },
  ];

  const servicePerformance = [
    { name: 'Deep Cleaning', bookings: 450, width: 84, tone: 'green', icon: <ToolOutlined /> },
    { name: 'Office Maintenance', bookings: 320, width: 64, tone: 'blue', icon: <ApartmentOutlined /> },
    { name: 'Window Washing', bookings: 280, width: 56, tone: 'amber', icon: <AppstoreOutlined /> },
  ];

  const latestReviews = [
    {
      name: 'Monica Geller',
      time: '2 hours ago',
      text: 'The team did an absolutely amazing job with our kitchen. It has never looked this clean. Highly recommended.',
      rating: 5,
      tone: 'teal',
    },
    {
      name: 'Chandler Bing',
      time: '5 hours ago',
      text: 'Professional service and very punctual. Only minor issue was a missed spot behind the sofa, but otherwise great.',
      rating: 4,
      tone: 'gold',
    },
  ];

  return (
    <section className={`admin-dashboard-page ${darkMode ? 'dark-mode' : ''}`}>
      <div>
        <h1 className="admin-page-title">Admin Dashboard</h1>
        <p className="admin-page-subtitle">View platform activity, bookings, and performance insights.</p>
      </div>

      <div className="dashboard-kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.title} className={`dashboard-kpi-card tone-${card.tone}`}>
            <div className="kpi-card-icon">{card.icon}</div>
            <p className="kpi-card-title">{card.title}</p>
            <h2 className="kpi-card-value">{card.value}</h2>
            <p className="kpi-card-subtitle">{card.subtitle}</p>
            {card.delta ? (
              <span className={`kpi-card-delta ${card.delta.startsWith('+') ? 'positive' : 'negative'}`}>
                <RiseOutlined />
                {card.delta}
              </span>
            ) : null}
          </article>
        ))}
      </div>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel">
          <div className="panel-head">
            <h3>Recent Bookings</h3>
            <a href="/admin/bookings">View all</a>
          </div>
          <div className="table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Cleaner</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{booking.customer}</td>
                    <td>{booking.cleaner}</td>
                    <td>
                      <span className={`status-chip ${booking.status.toLowerCase().replace(' ', '-')}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>{booking.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h3>Top Cleaners</h3>
            <a href="/admin/cleaners">View all</a>
          </div>
          <div className="top-cleaners-list">
            {topCleaners.map((cleaner) => (
              <div key={cleaner.id} className="cleaner-row">
                <div className="cleaner-identity">
                  <div className="cleaner-avatar">
                    <UserOutlined />
                  </div>
                  <div>
                    <p className="cleaner-name">{cleaner.name}</p>
                    <span>{cleaner.totalJobs} jobs completed</span>
                  </div>
                </div>
                <div className="cleaner-stats">
                  <span>{cleaner.rating.toFixed(1)} rating</span>
                  <span>{cleaner.reviews} reviews</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <section className="dashboard-panel booking-volume-panel">
        <div className="panel-head booking-head">
          <div>
            <h3>Booking Volume</h3>
            <p>Last 12 months performance against monthly capacity</p>
          </div>
          <button type="button" className="panel-filter-btn">Monthly</button>
        </div>
        <div className="booking-volume-shell">
          <div className="booking-grid-lines" aria-hidden="true">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
          </div>
          <div className="booking-volume-chart" style={{ '--booking-points': bookingVolume.length }}>
          {bookingVolume.map((item) => (
            <div
              className="volume-col"
              key={item.day}
              style={{
                '--volume-capacity': `${Math.max(18, item.capacity)}%`,
                '--volume-fill': `${Math.max(15, Math.round((item.value / item.capacity) * 100))}%`,
              }}
            >
              <strong className="volume-value">{item.value}</strong>
              <div className="volume-track">
                <div className="volume-fill" />
              </div>
              <span>{item.day}</span>
              <small>{Math.round((item.value / item.capacity) * 100)}%</small>
            </div>
          ))}
          </div>
          <div className="booking-volume-legend">
            <span><i className="legend-capacity" /> Capacity</span>
            <span><i className="legend-booked" /> Booked</span>
          </div>
        </div>
      </section>

      <div className="dashboard-insights-grid">
        <section className="dashboard-panel">
          <div className="panel-head">
            <h3>Top Services</h3>
            <a href="/admin/services">View all</a>
          </div>
          <div className="service-performance-list">
            {servicePerformance.map((item) => (
              <article key={item.name} className="service-performance-row">
                <div className={`service-icon tone-${item.tone}`}>{item.icon}</div>
                <div className="service-metrics">
                  <div className="service-meta">
                    <strong>{item.name}</strong>
                    <span>{item.bookings} Bookings</span>
                  </div>
                  <div className="service-bar">
                    <div className={`service-bar-fill tone-${item.tone}`} style={{ width: `${item.width}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h3>Latest Reviews</h3>
            <a href="/admin/reviews">View all</a>
          </div>
          <div className="latest-review-list">
            {latestReviews.map((review) => (
              <article key={review.name} className="review-row">
                <header>
                  <div className="review-user">
                    <span className={`review-avatar tone-${review.tone}`}>{review.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
                    <div>
                      <strong>{review.name}</strong>
                      <span>{review.time}</span>
                    </div>
                  </div>
                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <StarFilled key={index} className={index < review.rating ? 'active' : ''} />
                    ))}
                  </div>
                </header>
                <p>"{review.text}"</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};

export default DashboardPage;
