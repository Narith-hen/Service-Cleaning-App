import React from 'react';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import '../../../styles/cleaner/job_requests.scss';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import windowImage from '../../../assets/window.png';
import shopImage from '../../../assets/shop.png';
import fallbackImage from '../../../assets/image.png';

const jobRequests = [
  {
    id: 1,
    badge: 'URGENT',
    badgeType: 'urgent',
    title: 'Deep House Cleaning',
    price: '$145.00',
    image: homeImage,
    details: [
      { icon: <EnvironmentOutlined />, text: 'Downtown District, Central Heights' },
      { icon: <ClockCircleOutlined />, text: 'Est. 4.5 Hours - Starts Today, 2:00 PM' },
      { icon: <InfoCircleOutlined />, text: '3 BR, 2 BA - Supplies provided' }
    ]
  },
  {
    id: 2,
    badge: '',
    badgeType: '',
    title: 'Move-Out Sanitation',
    price: '$210.00',
    image: shopImage,
    details: [
      { icon: <EnvironmentOutlined />, text: 'Oak Ridge Estates, North Side' },
      { icon: <ClockCircleOutlined />, text: 'Est. 6 Hours - Tomorrow, 9:00 AM' },
      { icon: <InfoCircleOutlined />, text: 'Empty Apartment - Focus on Kitchen' }
    ]
  },
  {
    id: 3,
    badge: '',
    badgeType: '',
    title: 'Office Recurring Clean',
    price: '$85.00',
    image: officeImage,
    details: [
      { icon: <EnvironmentOutlined />, text: 'Tech Park, Building 4B' },
      { icon: <ClockCircleOutlined />, text: 'Est. 2 Hours - Weekly Contract' },
      { icon: <InfoCircleOutlined />, text: 'General dusting and waste removal' }
    ]
  },
  {
    id: 4,
    badge: 'NEW CLIENT',
    badgeType: 'new',
    title: 'Condo Routine Clean',
    price: '$110.00',
    image: windowImage,
    details: [
      { icon: <EnvironmentOutlined />, text: 'The View Condos, Floor 12' },
      { icon: <ClockCircleOutlined />, text: 'Est. 3 Hours - Saturday, 10:00 AM' },
      { icon: <InfoCircleOutlined />, text: 'No pets - Hardwood floors' }
    ]
  }
];

const JobRequestsPage = () => {
  return (
    <div className="cleaner-job-requests-page">
      <div className="page-headline">
        <h1>Available Job Requests</h1>
        <p>Review and accept high-priority cleaning opportunities in your area.</p>
      </div>

      <div className="job-request-grid">
        {jobRequests.map((job) => (
          <article className="job-request-card" key={job.id}>
            <div className="job-image-wrap">
              {job.badge ? <span className={`job-badge ${job.badgeType}`}>{job.badge}</span> : null}
              <img
                src={job.image}
                alt={job.title}
                onError={(e) => {
                  e.currentTarget.src = fallbackImage;
                }}
              />
            </div>

            <div className="job-content">
              <div className="job-top-row">
                <h3>{job.title}</h3>
                <div className="job-price">{job.price}</div>
              </div>

              <ul className="job-meta-list">
                {job.details.map((detail, idx) => (
                  <li key={`${job.id}-${idx}`}>
                    {detail.icon}
                    <span>{detail.text}</span>
                  </li>
                ))}
              </ul>

              <div className="job-actions">
                <button type="button" className="accept-btn">
                  <CheckCircleOutlined /> Accept
                </button>
                <button type="button" className="decline-btn" aria-label="decline request">
                  <CloseOutlined />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="job-support-strip">
        <div className="support-left">
          <div className="support-icon">
            <CustomerServiceOutlined />
          </div>
          <div>
            <h3>Need help with a job?</h3>
            <p>Our support team is available 24/7 for urgent issues.</p>
          </div>
        </div>
        <button type="button" className="support-btn">
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default JobRequestsPage;
