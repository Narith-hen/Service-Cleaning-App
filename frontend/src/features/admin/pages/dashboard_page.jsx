import React from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
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

  return (
    <section className="admin-dashboard-page">
      <div className="dashboard-header-row">
        <h1>Admin Dashboard</h1>
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
    </section>
  );
};

export default DashboardPage;
