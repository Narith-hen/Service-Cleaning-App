import React from 'react';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  StarFilled,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import '../../../styles/admin/dashboard_page.css';

const DashboardPage = () => {
  const kpiCards = [
    {
      title: 'Today Bookings',
      value: '42',
      delta: '+12% from yesterday',
      icon: <CalendarOutlined />,
      tone: 'blue',
    },
    {
      title: 'Active Cleaners',
      value: '18',
      delta: '3 on break right now',
      icon: <TeamOutlined />,
      tone: 'green',
    },
    {
      title: 'Monthly Revenue',
      value: '$12,840',
      delta: '+8.4% this month',
      icon: <DollarOutlined />,
      tone: 'amber',
    },
    {
      title: 'Open Complaints',
      value: '5',
      delta: '-2 since last week',
      icon: <ClockCircleOutlined />,
      tone: 'red',
    },
  ];

  const recentBookings = [
    { id: 'BK-1204', customer: 'Sophia Kim', cleaner: 'Dara V.', status: 'Completed', amount: '$45' },
    { id: 'BK-1205', customer: 'Michael Lee', cleaner: 'Nita P.', status: 'In Progress', amount: '$80' },
    { id: 'BK-1206', customer: 'Emma Carter', cleaner: 'Bopha S.', status: 'Pending', amount: '$60' },
    { id: 'BK-1207', customer: 'David Chen', cleaner: 'Sokha M.', status: 'Completed', amount: '$120' },
  ];

  const topCleaners = [
    { name: 'Dara V.', jobs: 64, rating: '4.9', completion: '98%' },
    { name: 'Bopha S.', jobs: 59, rating: '4.8', completion: '97%' },
    { name: 'Nita P.', jobs: 53, rating: '4.8', completion: '96%' },
  ];

  const bookingVolume = [
    { day: 'M', value: 28, base: 46 },
    { day: 'T', value: 62, base: 74 },
    { day: 'W', value: 30, base: 60 },
    { day: 'T', value: 76, base: 92 },
    { day: 'F', value: 66, base: 69 },
    { day: 'S', value: 14, base: 46 },
    { day: 'S', value: 36, base: 64 },
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
    <section className="admin-dashboard-page">
      <div className="dashboard-header-row">
        <div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-subtitle">View platform activity, bookings, and performance insights.</p>
        </div>
        <button type="button" className="dashboard-action-btn">Generate Report</button>
      </div>

      <div className="dashboard-kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.title} className={`dashboard-kpi-card tone-${card.tone}`}>
            <div className="kpi-card-icon">{card.icon}</div>
            <p className="kpi-card-title">{card.title}</p>
            <h2 className="kpi-card-value">{card.value}</h2>
            <span className="kpi-card-delta">{card.delta}</span>
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
            <a href="/admin/cleaners">Manage</a>
          </div>
          <div className="top-cleaners-list">
            {topCleaners.map((cleaner) => (
              <div key={cleaner.name} className="cleaner-row">
                <div className="cleaner-identity">
                  <div className="cleaner-avatar">
                    <UserOutlined />
                  </div>
                  <div>
                    <p className="cleaner-name">{cleaner.name}</p>
                    <span>{cleaner.jobs} jobs this month</span>
                  </div>
                </div>
                <div className="cleaner-stats">
                  <span>{cleaner.rating} rating</span>
                  <span>{cleaner.completion} completion</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-quick-actions">
        <button type="button" className="quick-card">
          <CheckCircleOutlined />
          <span>Approve New Cleaner</span>
        </button>
        <button type="button" className="quick-card">
          <CalendarOutlined />
          <span>Review Today Schedule</span>
        </button>
        <button type="button" className="quick-card">
          <ClockCircleOutlined />
          <span>Handle Pending Issues</span>
        </button>
      </div>

      <section className="dashboard-panel booking-volume-panel">
        <div className="panel-head">
          <h3>Booking Volume</h3>
          <button type="button" className="panel-filter-btn">Daily</button>
        </div>
        <div className="booking-volume-chart">
          {bookingVolume.map((item) => (
            <div className="volume-col" key={item.day + item.base}>
              <div className="volume-track" style={{ height: `${item.base}%` }}>
                <div className="volume-fill" style={{ height: `${Math.max(10, item.value)}%` }} />
              </div>
              <span>{item.day}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-insights-grid">
        <section className="dashboard-panel">
          <div className="panel-head">
            <h3>Service Performance</h3>
            <a href="/admin/services">See all services</a>
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
            <a href="/admin/reviews">View all reviews</a>
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
