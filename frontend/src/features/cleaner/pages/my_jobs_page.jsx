import React from 'react';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  ArrowRightOutlined,
  LockOutlined,
  SearchOutlined
} from '@ant-design/icons';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import windowImage from '../../../assets/window.png';
import '../../../styles/cleaner/my_jobs.scss';

const jobs = [
  {
    id: 1,
    tag: 'ONGOING',
    tagType: 'green',
    title: 'Full Apartment Deep Clean',
    client: 'Sarah Jenkins - Premium Member',
    price: '$180.00',
    image: homeImage,
    details: [
      { label: 'LOCATION', value: '742 Evergreen Terrace, Suite 402', icon: <EnvironmentOutlined /> },
      { label: 'TIME ELAPSED', value: '01:45:22', icon: <ClockCircleOutlined /> }
    ],
    actions: [
      { label: 'Pause Job', type: 'dark', icon: <PauseCircleOutlined /> },
      { label: 'Complete Cleaning', type: 'green', icon: <CheckCircleOutlined /> }
    ]
  },
  {
    id: 2,
    tag: 'STARTS IN 45M',
    tagType: 'amber',
    title: 'Standard Recurring Clean',
    client: 'Michael Chen - Regular',
    price: '$95.00',
    image: windowImage,
    details: [
      { label: 'SCHEDULED', value: 'Today, 4:00 PM', icon: <ClockCircleOutlined /> },
      { label: 'DISTANCE', value: '1.2 miles away', icon: <EnvironmentOutlined /> }
    ],
    actions: [
      { label: 'Navigate', type: 'light', icon: <ArrowRightOutlined /> },
      { label: 'Start Cleaning', type: 'soft-green', icon: <ArrowRightOutlined /> }
    ]
  },
  {
    id: 3,
    tag: 'SCHEDULED',
    tagType: 'gray',
    title: 'Move-out Sanitation',
    client: 'David Miller',
    price: '$240.00',
    image: officeImage,
    details: [
      { label: 'DATE', value: 'Tomorrow, 9:00 AM', icon: <CalendarOutlined /> },
      { label: 'JOB SIZE', value: '3 BR - 2.5 BA', icon: <EnvironmentOutlined /> }
    ],
    actions: [
      { label: 'Details', type: 'light', icon: <SearchOutlined /> },
      { label: 'Early Start Locked', type: 'locked', icon: <LockOutlined /> }
    ]
  }
];

const MyJobsPage = () => {
  return (
    <div className="cleaner-my-jobs-page">
      <div className="my-jobs-headline">
        <h1>Personal Job Management</h1>
        <p>Manage your active assignments and track your work history.</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card wide">
          <span className="summary-label">WEEKLY COMMITMENT</span>
          <div className="summary-main">
            <strong>32 / 40 hrs</strong>
            <em>80% Reached</em>
          </div>
          <div className="progress-line">
            <span />
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-label">TOTAL TRAVEL</span>
          <div className="summary-main">
            <strong>14.5 miles</strong>
            <em>Estimated for today</em>
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-label">INSURANCE STATUS</span>
          <div className="summary-main">
            <strong>Active</strong>
            <em>Expires in 12 days</em>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>JOB TYPE</label>
          <select defaultValue="all">
            <option value="all">All Types</option>
          </select>
        </div>
        <div className="filter-item">
          <label>STATUS</label>
          <select defaultValue="all">
            <option value="all">All Statuses</option>
          </select>
        </div>
        <div className="filter-item date-range">
          <label>DATE RANGE</label>
          <div className="date-inputs">
            <input type="text" placeholder="mm/dd/yyyy" />
            <span>to</span>
            <input type="text" placeholder="mm/dd/yyyy" />
          </div>
        </div>
      </div>

      <div className="jobs-list">
        {jobs.map((job) => (
          <article className={`job-item ${job.id === 1 ? 'highlight' : ''}`} key={job.id}>
            <div className="job-image-wrap">
              <span className={`job-tag ${job.tagType}`}>{job.tag}</span>
              <img src={job.image} alt={job.title} />
            </div>

            <div className="job-body">
              <div className="job-top">
                <div>
                  <span className="job-type">{job.id === 1 ? 'DEEP CLEAN' : job.id === 2 ? 'HOME' : 'OFFICE'}</span>
                  <h3>{job.title}</h3>
                  <p className="job-client">Client: {job.client}</p>
                </div>
                <div className="job-price">{job.price}</div>
              </div>

              <div className="job-details-grid">
                {job.details.map((detail, index) => (
                  <div className="job-detail" key={`${job.id}-${index}`}>
                    <span className="label">{detail.label}</span>
                    <p>
                      {detail.icon} {detail.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="job-actions">
                {job.actions.map((action, idx) => (
                  <button key={`${job.id}-action-${idx}`} type="button" className={`action-btn ${action.type}`}>
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
};

export default MyJobsPage;
