import React from 'react';
import {
  DollarCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import '../../../styles/cleaner/dashboard.scss';

const CleanerDashboardPage = () => {
  const stats = [
    {
      key: 'earnings',
      title: 'Total Earnings',
      value: '$2,450.00',
      note: '+12% vs last month',
      icon: <DollarCircleOutlined />,
      tone: 'success'
    },
    {
      key: 'completed',
      title: 'Jobs Completed',
      value: '128',
      note: '+5 new today',
      icon: <SyncOutlined />,
      tone: 'success'
    },
    {
      key: 'pending',
      title: 'Pending Requests',
      value: '14',
      note: 'Action required',
      icon: <ClockCircleOutlined />,
      tone: 'warning'
    },
    {
      key: 'rating',
      title: 'Average Rating',
      value: '4.9 / 5.0',
      note: '',
      icon: <StarOutlined />,
      tone: 'rating'
    }
  ];

  const todaySchedule = [
    {
      time: '09:00',
      meridiem: 'AM',
      title: 'Deep Home Cleaning',
      location: '#42 Market St, Central Phnom Penh',
      duration: '3.5 Hours',
      amount: '$85.00',
      status: 'IN PROGRESS'
    },
    {
      time: '01:30',
      meridiem: 'PM',
      title: 'Office Maintenance',
      location: 'Green Plaza Tower, Level 12',
      duration: '2.0 Hours',
      amount: '$120.00',
      status: 'UPCOMING'
    },
    {
      time: '04:00',
      meridiem: 'PM',
      title: 'Window Cleaning',
      location: 'Residential Villa #12, Riverside',
      duration: '1.5 Hours',
      amount: '$45.00',
      status: 'UPCOMING'
    }
  ];

  return (
    <div className="cleaner-dashboard">
      <div className="dashboard-stat-grid">
        {stats.map((item) => (
          <article key={item.key} className="dashboard-stat-card">
            <div className="stat-card-top">
              <span className={`stat-icon ${item.tone}`}>{item.icon}</span>
              {item.note ? (
                <span className={`stat-note ${item.tone}`}>{item.note}</span>
              ) : (
                <StarOutlined className="stat-star" />
              )}
            </div>
            <p className="stat-title">{item.title}</p>
            <p className="stat-value">{item.value}</p>
          </article>
        ))}
      </div>

      <section className="today-schedule-panel">
        <div className="schedule-head">
          <h2>Today&apos;s Schedule</h2>
          <button type="button" className="view-calendar-btn">View Calendar</button>
        </div>

        <div className="schedule-list">
          {todaySchedule.map((job) => (
            <article key={`${job.time}-${job.title}`} className="schedule-row">
              <div className="job-time">
                <span className="time-main">{job.time}</span>
                <span className="time-ampm">{job.meridiem}</span>
              </div>

              <div className="job-content">
                <h3>{job.title}</h3>
                <p>{job.location}</p>
                <div className="job-meta">
                  <span><ClockCircleOutlined /> {job.duration}</span>
                  <span><DollarOutlined /> {job.amount}</span>
                </div>
              </div>

              <span className={`job-status ${job.status === 'IN PROGRESS' ? 'in-progress' : 'upcoming'}`}>
                {job.status}
              </span>
            </article>
          ))}
        </div>

        <button type="button" className="break-time-btn">Add Break Time</button>
      </section>
    </div>
  );
};

export default CleanerDashboardPage;
