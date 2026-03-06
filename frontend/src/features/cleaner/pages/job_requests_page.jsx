import React, { useState } from 'react';
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
    ],
    extraDetails: [
      'Customer: Sarah Jenkins',
      'Special request: Focus on kitchen grease and bathroom tiles',
      'Parking available in basement lot B2',
      'Contact on arrival: +1 (555) 138-4421'
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
    ],
    extraDetails: [
      'Customer: Michael Reed',
      'Move-out checklist provided by landlord',
      'Bring strong degreaser for oven and range hood',
      'Gate code: #4128'
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
    ],
    extraDetails: [
      'Customer: NovaTech Office Admin',
      'Clean schedule: Every Monday and Thursday',
      'Conference room needs extra glass cleaning',
      'Access card pickup at front desk'
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
    ],
    extraDetails: [
      'Customer: Emily Carter',
      'Use wood-safe cleaning products only',
      'Primary focus: Living room windows and kitchen area',
      'Building requires check-in at reception'
    ]
  }
];

const JobRequestsPage = () => {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div className="cleaner-job-requests-page">
      <div className="page-headline">
        <h1>Available Job Requests</h1>
        <p>Review and accept high-priority cleaning opportunities in your area.</p>
      </div>

      <div className="job-request-grid">
        {jobRequests.map((job) => (
          <article
            className="job-request-card"
            key={job.id}
            onClick={() => setSelectedJob(job)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedJob(job);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="job-image-wrap">
              {job.badge ? <span className={`job-badge ${job.badgeType}`}>{job.badge}</span> : null}
              <img
                src={job.image}
                alt={job.title}
                onError={(e) => {
                  e.currentTarget.src = fallbackImage;
                }}
              />
              <div className="job-image-title">{job.title}</div>
            </div>

            <div className="job-content">
              <div className="job-top-row">
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
                <button type="button" className="accept-btn" onClick={(e) => e.stopPropagation()}>
                  <CheckCircleOutlined /> Accept
                </button>
                <button
                  type="button"
                  className="decline-btn"
                  aria-label="decline request"
                  onClick={(e) => e.stopPropagation()}
                >
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

      {selectedJob ? (
        <div className="job-modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div
            className="job-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedJob.title} details`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="job-modal-head">
              <button type="button" className="job-modal-close" aria-label="Close details" onClick={() => setSelectedJob(null)}>
                <CloseOutlined />
              </button>
            </div>

            <div className="job-modal-body">
              <div className="job-modal-image-wrap">
                <img
                  src={selectedJob.image}
                  alt={selectedJob.title}
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                />
                <div className="job-image-title">{selectedJob.title}</div>
              </div>

              <div className="job-modal-info">
                <div className="job-modal-price">{selectedJob.price}</div>
                <ul className="job-meta-list">
                  {selectedJob.details.map((detail, idx) => (
                    <li key={`${selectedJob.id}-modal-${idx}`}>
                      {detail.icon}
                      <span>{detail.text}</span>
                    </li>
                  ))}
                </ul>

                <h4>More Details</h4>
                <ul className="job-modal-extra-list">
                  {selectedJob.extraDetails.map((item, idx) => (
                    <li key={`${selectedJob.id}-extra-${idx}`}>{item}</li>
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
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default JobRequestsPage;
