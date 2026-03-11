<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
=======
﻿import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
>>>>>>> develop
import {
  EnvironmentOutlined,
  UserOutlined,
  HomeOutlined,
  AppstoreOutlined,
  CompassOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import officeImage from '../../../assets/office.png';
import CleanerMessagePanel from '../components/cleaner_message_panel';
import '../../../styles/cleaner/my_jobs.scss';

<<<<<<< HEAD
const initialJobs = [
=======
const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';

const pickJobImage = (job) => {
  // Apply office preview image for booking cards by default.
  const imageHint = String(job?.image || '').toLowerCase();
  if (imageHint.includes('office')) return officeImage;
  return officeImage;
};

const fallbackJobs = [
>>>>>>> develop
  {
    id: 'default-1',
    sourceRequestId: 'default-1',
    status: 'upcoming',
    title: 'Deep House Cleaning',
    jobId: '#SOMA-48291',
    price: '$85.00',
    day: '24',
    monthYear: 'June 2026',
    timeRange: '09:00 AM - 12:00 PM',
    location: '123 Street 271, Sangkat Boeung Tumpun, Phnom Penh, Cambodia',
    customer: 'Sovan Reach',
    bedrooms: '3 Bedrooms',
    floors: '2 Floors',
    image: officeImage
  }
];

const tabs = [
  { key: 'all', label: 'All Jobs' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in-progress', label: 'In-Progress' },
  { key: 'completed', label: 'Completed' }
];

const MyJobsPage = () => {
<<<<<<< HEAD
  const [jobItems, setJobItems] = useState(initialJobs);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState(initialJobs[0]?.id ?? null);
  const [activeJob, setActiveJob] = useState(null);

  const jobTypeOptions = useMemo(() => ['all', ...new Set(jobItems.map((job) => job.jobType))], [jobItems]);
  const statusOptions = useMemo(() => ['all', ...new Set(jobItems.map((job) => job.status))], [jobItems]);

  const filteredJobs = useMemo(() => {
    return jobItems.filter((job) => {
      if (selectedType !== 'all' && job.jobType !== selectedType) return false;
      if (selectedStatus !== 'all' && job.status !== selectedStatus) return false;

      return true;
    });
  }, [jobItems, selectedType, selectedStatus]);
=======
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [jobs, setJobs] = useState(fallbackJobs);
  const [activeMessageJobId, setActiveMessageJobId] = useState(null);
  const [jobActionStateById, setJobActionStateById] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const normalized = parsed
        .filter(Boolean)
        .map((job) => ({
          id: job.id || `confirmed-${job.sourceRequestId || Date.now()}`,
          sourceRequestId: job.sourceRequestId || job.id,
          status: job.status || 'in-progress',
          title: job.title || 'Cleaning Job',
          jobId: job.jobId || '#SOMA-00000',
          price: job.price || '$0.00',
          day: job.day || '01',
          monthYear: job.monthYear || 'June 2026',
          timeRange: job.timeRange || '09:00 AM - 12:00 PM',
          location: job.location || 'Phnom Penh, Cambodia',
          customer: job.customer || 'Customer',
          bedrooms: job.bedrooms || '3 Bedrooms',
          floors: job.floors || '2 Floors',
          image: pickJobImage(job)
        }));

      setJobs([normalized[0]]);
    } catch {
      setJobs(fallbackJobs);
    }
  }, []);

  const visibleJobs = useMemo(() => {
    if (activeTab === 'all') return jobs;
    return jobs.filter((job) => job.status === activeTab);
  }, [jobs, activeTab]);

  const activeMessageJob = useMemo(
    () => jobs.find((job) => job.id === activeMessageJobId) || null,
    [jobs, activeMessageJobId]
  );

  const handlePrimaryJobAction = (jobId) => {
    setJobActionStateById((prev) => {
      const current = prev[jobId] || 'idle';
      const next = current === 'idle' ? 'in-progress' : current;

      setJobs((jobsPrev) =>
        jobsPrev.map((job) =>
          job.id === jobId
            ? { ...job, status: 'in-progress' }
            : job
        )
      );

      return { ...prev, [jobId]: next };
    });
  };
>>>>>>> develop

  const handleStartJob = (jobId) => {
    handlePrimaryJobAction(jobId);
    const selectedJob = jobs.find((job) => job.id === jobId) || null;

    if (selectedJob) {
      try {
        const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((job) =>
              (job.id === selectedJob.id || job.sourceRequestId === selectedJob.sourceRequestId)
                ? { ...job, status: 'in-progress' }
                : job
            );
            localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify(updated));
          }
        }
      } catch {
        // Non-blocking for navigation flow.
      }
    }

    navigate('/cleaner/job-execution', { state: { jobId } });
  };

<<<<<<< HEAD
  const handleOpenJobDetails = (job) => {
    setSelectedJobId(job.id);
    setActiveJob(job);
  };

  const handleCloseJobDetails = () => {
    setActiveJob(null);
  };

  const updateJob = (jobId, updater) => {
    setJobItems((prevJobs) => prevJobs.map((job) => (job.id === jobId ? updater(job) : job)));
    setActiveJob((prevJob) => (prevJob && prevJob.id === jobId ? updater(prevJob) : prevJob));
  };

  const handleJobAction = (job, actionLabel, event) => {
    event.stopPropagation();
    setSelectedJobId(job.id);

    if (actionLabel === 'Pause Job') {
      updateJob(job.id, (currentJob) => ({
        ...currentJob,
        status: 'Paused',
        tag: 'PAUSED',
        tagType: 'amber',
        actions: [
          { label: 'Resume Job', type: 'soft-green', icon: <CaretRightOutlined /> },
          { label: 'Complete Cleaning', type: 'green', icon: <CheckCircleOutlined /> }
        ]
      }));
      return;
    }

    if (actionLabel === 'Resume Job') {
      updateJob(job.id, (currentJob) => ({
        ...currentJob,
        status: 'Ongoing',
        tag: 'ONGOING',
        tagType: 'green',
        actions: [
          { label: 'Pause Job', type: 'dark', icon: <PauseCircleOutlined /> },
          { label: 'Complete Cleaning', type: 'green', icon: <CheckCircleOutlined /> }
        ]
      }));
      return;
    }

    if (actionLabel === 'Complete Cleaning') {
      updateJob(job.id, (currentJob) => ({
        ...currentJob,
        status: 'Completed',
        tag: 'COMPLETED',
        tagType: 'gray',
        actions: [{ label: 'Completed', type: 'locked', icon: <CheckCircleOutlined /> }]
      }));
    }
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
=======
  const handleCheckMyJob = (jobId) => {
    navigate('/cleaner/job-execution', { state: { jobId } });
  };

  if (activeMessageJob) {
    return (
      <div className="cleaner-my-jobs-v2">
        <div className="my-jobs-message-breadcrumb">
          <button type="button" onClick={() => setActiveMessageJobId(null)}>My Jobs</button>
          <span>&gt;</span>
          <strong>Message</strong>
>>>>>>> develop
        </div>

        <div className="my-jobs-message-view">
          <CleanerMessagePanel
            threadId={activeMessageJob.sourceRequestId || activeMessageJob.id}
            customerName={activeMessageJob.customer}
            subtitle={`${activeMessageJob.title} Job - ${activeMessageJob.jobId}`}
          />

          <aside className="my-jobs-details-panel">
            <h5>JOB DETAILS</h5>

<<<<<<< HEAD
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
=======
            <div className="my-jobs-details-card">
              <div className="my-jobs-detail-row">
                <span className="my-jobs-detail-icon"><CalendarOutlined /></span>
>>>>>>> develop
                <div>
                  <small>Date &amp; Time</small>
                  <strong>Tomorrow, 9:00 AM</strong>
                </div>
              </div>

<<<<<<< HEAD
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
                  <button
                    key={`${job.id}-action-${idx}`}
                    type="button"
                    className={`action-btn ${action.type}`}
                    onClick={(event) => handleJobAction(job, action.label, event)}
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
=======
              <div className="my-jobs-detail-row">
                <span className="my-jobs-detail-icon"><EnvironmentOutlined /></span>
                <div>
                  <small>Location</small>
                  <strong>{activeMessageJob.location}</strong>
                </div>
>>>>>>> develop
              </div>
            </div>

            <div className="my-jobs-checklist-card">
              <h6>Checklist Preview</h6>
              <ul>
                <li><CheckCircleOutlined /> Kitchen Deep Clean</li>
                <li><CheckCircleOutlined /> Bathroom Sanitization</li>
                <li><ClockCircleOutlined /> Window Cleaning (Pending)</li>
              </ul>
            </div>

            <button type="button" className="my-jobs-contract-btn">
              <FileTextOutlined /> View Full Job Contract
            </button>

<<<<<<< HEAD
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
                  <button
                    key={`${activeJob.id}-modal-action-${idx}`}
                    type="button"
                    className={`action-btn ${action.type}`}
                    onClick={(event) => handleJobAction(activeJob, action.label, event)}
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
=======
            <div className="my-jobs-map-preview" />
          </aside>
>>>>>>> develop
        </div>
      </div>
    );
  }

  return (
    <div className="cleaner-my-jobs-v2">
      <div className="my-jobs-tabs-v2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="my-jobs-list-v2">
        {visibleJobs.slice(0, 1).map((job) => {
          const actionState = jobActionStateById[job.id]
            || (job.status === 'completed'
              ? 'completed'
              : job.status === 'in-progress'
                ? 'in-progress'
                : 'idle');

          return (
            <article key={job.id} className="my-job-card-v2">
            <aside
              className="my-job-date-v2"
              style={{ '--job-date-bg': `url(${job.image || officeImage})` }}
            >
              <span className="status-pill">ACTIVE NOW</span>
              <div className="day-value">{job.day}</div>
              <div className="month-value">{job.monthYear}</div>

              <div className="schedule-label">Scheduled Time</div>
              <div className="schedule-value">{job.timeRange}</div>
            </aside>

            <section className="my-job-main-v2">
              <div className="job-main-header-v2">
                <div>
                  <h3>{job.title}</h3>
                  <p>Job ID: {job.jobId}</p>
                </div>

                <div className="job-price-v2">
                  <strong>{job.price}</strong>
                  <small>Fixed Rate</small>
                </div>
              </div>

              <p className="job-line-v2">
                <EnvironmentOutlined /> {job.location}
              </p>

              <p className="job-line-v2">
                <UserOutlined /> Customer: {job.customer}
              </p>

              <p className="job-line-v2">
                <HomeOutlined /> {job.bedrooms}
                <span className="dot">•</span>
                <AppstoreOutlined /> {job.floors}
              </p>

              <div className="job-actions-v2">
                {actionState === 'idle' && (
                  <button
                    type="button"
                    className="start-btn"
                    onClick={() => handleStartJob(job.id)}
                  >
                    <PlayCircleOutlined /> Start Job
                  </button>
                )}

                {actionState === 'in-progress' && (
                  <button
                    type="button"
                    className="progress-btn"
                    disabled
                  >
                    <ClockCircleOutlined /> In progress
                  </button>
                )}

                {actionState === 'completed' && (
                  <button type="button" className="completed-btn" disabled>
                    <CheckCircleOutlined /> Completed
                  </button>
                )}

                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => handleCheckMyJob(job.id)}
                >
                  <CheckCircleOutlined /> Check My Job
                </button>

                <button type="button" className="ghost-btn">
                  <CompassOutlined /> Navigate to Location
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setActiveMessageJobId(job.id)}
                >
                  <MessageOutlined /> Messages
                </button>
              </div>
            </section>
            </article>
          );
        })}

        {visibleJobs.length === 0 && (
          <div className="my-jobs-empty-v2">No jobs in this tab yet.</div>
        )}
      </div>
    </div>
  );
};

export default MyJobsPage;


