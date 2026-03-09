import React, { useEffect, useMemo, useState } from 'react';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  SendOutlined,
  CaretRightOutlined,
  LockOutlined,
  SearchOutlined,
  CloseOutlined
} from '@ant-design/icons';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import windowImage from '../../../assets/window.png';
import '../../../styles/cleaner/my_jobs.scss';

const jobs = [
  {
    id: 1,
    jobType: 'Deep Clean',
    status: 'Ongoing',
    scheduledDate: '2026-03-04',
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
    jobType: 'Home',
    status: 'Starting Soon',
    scheduledDate: '2026-03-04',
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
      { label: 'Navigate', type: 'light', icon: <SendOutlined /> },
      { label: 'Start Cleaning', type: 'soft-green', icon: <CaretRightOutlined /> }
    ]
  },
  {
    id: 3,
    jobType: 'Office',
    status: 'Scheduled',
    scheduledDate: '2026-03-05',
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
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? null);
  const [activeJob, setActiveJob] = useState(null);

  const jobTypeOptions = useMemo(() => ['all', ...new Set(jobs.map((job) => job.jobType))], []);
  const statusOptions = useMemo(() => ['all', ...new Set(jobs.map((job) => job.status))], []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (selectedType !== 'all' && job.jobType !== selectedType) return false;
      if (selectedStatus !== 'all' && job.status !== selectedStatus) return false;

      return true;
    });
  }, [selectedType, selectedStatus]);

  useEffect(() => {
    if (filteredJobs.length === 0) {
      setSelectedJobId(null);
      return;
    }

    const stillExists = filteredJobs.some((job) => job.id === selectedJobId);
    if (!stillExists) {
      setSelectedJobId(filteredJobs[0].id);
    }
  }, [filteredJobs, selectedJobId]);

  useEffect(() => {
    if (!activeJob) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activeJob]);

  const formatDisplayDate = (value) => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return '';
    return `${month}/${day}/${year}`;
  };

  const handleOpenJobDetails = (job) => {
    setSelectedJobId(job.id);
    setActiveJob(job);
  };

  const handleCloseJobDetails = () => {
    setActiveJob(null);
  };

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
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            {jobTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>STATUS</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="jobs-list">
        {filteredJobs.map((job) => (
          <article
            className={`job-item ${job.id === selectedJobId ? 'highlight' : ''}`}
            key={job.id}
            onClick={() => handleOpenJobDetails(job)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenJobDetails(job);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="job-image-wrap">
              <span className={`job-tag ${job.tagType}`}>{job.tag}</span>
              <img src={job.image} alt={job.title} />
            </div>

            <div className="job-body">
              <div className="job-top">
                <div>
                  <span className="job-type">{job.jobType.toUpperCase()}</span>
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
        {filteredJobs.length === 0 && <div className="summary-card">No jobs found for the selected filters.</div>}
      </div>
      {activeJob && (
        <div className="job-modal-overlay" onClick={handleCloseJobDetails}>
          <div className="job-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="job-modal-close" aria-label="Close details" onClick={handleCloseJobDetails}>
              <CloseOutlined />
            </button>

            <div className="job-modal-image-wrap">
              <span className={`job-tag ${activeJob.tagType}`}>{activeJob.tag}</span>
              <img src={activeJob.image} alt={activeJob.title} />
            </div>

            <div className="job-modal-body">
              <div className="job-top">
                <div>
                  <span className="job-type">{activeJob.jobType.toUpperCase()}</span>
                  <h3>{activeJob.title}</h3>
                  <p className="job-client">Client: {activeJob.client}</p>
                </div>
                <div className="job-price">{activeJob.price}</div>
              </div>

              <div className="job-details-grid">
                {activeJob.details.map((detail, index) => (
                  <div className="job-detail" key={`${activeJob.id}-modal-${index}`}>
                    <span className="label">{detail.label}</span>
                    <p>
                      {detail.icon} {detail.value}
                    </p>
                  </div>
                ))}
                <div className="job-detail">
                  <span className="label">STATUS</span>
                  <p>{activeJob.status}</p>
                </div>
                <div className="job-detail">
                  <span className="label">SCHEDULED DATE</span>
                  <p>{formatDisplayDate(activeJob.scheduledDate)}</p>
                </div>
              </div>

              <div className="job-actions">
                {activeJob.actions.map((action, idx) => (
                  <button key={`${activeJob.id}-modal-action-${idx}`} type="button" className={`action-btn ${action.type}`}>
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyJobsPage;
