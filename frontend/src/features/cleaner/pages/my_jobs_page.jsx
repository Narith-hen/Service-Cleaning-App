import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import homeImage from '../../../assets/home.png';
import windowImage from '../../../assets/window.png';
import constructionImage from '../../../assets/Construction Cleaning.png';
import customerHomeImage from '../../../assets/customer_home.png';
import CleanerMessagePanel from '../components/cleaner_message_panel';
import '../../../styles/cleaner/my_jobs.scss';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';

const pickJobImage = (job) => {
  // Apply real service images based on job type/service
  const title = String(job?.title || '').toLowerCase();
  const serviceType = String(job?.serviceType || job?.image || '').toLowerCase();
  
  // Check title first, then service type
  if (title.includes('office') || serviceType.includes('office')) return officeImage;
  if (title.includes('window') || serviceType.includes('window')) return windowImage;
  if (title.includes('construction') || serviceType.includes('construction')) return constructionImage;
  if (title.includes('home') || title.includes('house') || title.includes('deep') || serviceType.includes('home')) return homeImage;
  if (title.includes('customer') || serviceType.includes('customer')) return customerHomeImage;
  
  // Default to home image for cleaning services
  return homeImage;
};

const fallbackJobs = [
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
    image: homeImage,
    serviceType: 'home'
  },
  {
    id: 'default-2',
    sourceRequestId: 'default-2',
    status: 'completed',
    title: 'Office Deep Cleaning',
    jobId: '#SOMA-48280',
    price: '$120.00',
    day: '20',
    monthYear: 'June 2026',
    timeRange: '08:00 AM - 11:00 AM',
    location: '456 Business Center, Phnom Penh, Cambodia',
    customer: 'Mey Sotharith',
    bedrooms: '5 Rooms',
    floors: '1 Floor',
    image: officeImage,
    serviceType: 'office'
  },
  {
    id: 'default-3',
    sourceRequestId: 'default-3',
    status: 'completed',
    title: 'Window Cleaning Service',
    jobId: '#SOMA-48275',
    price: '$65.00',
    day: '15',
    monthYear: 'June 2026',
    timeRange: '10:00 AM - 01:00 PM',
    location: '789 Riverside, Phnom Penh, Cambodia',
    customer: 'Larry Ta',
    bedrooms: '4 Bedrooms',
    floors: '2 Floors',
    image: windowImage,
    serviceType: 'window'
  }
];

const tabs = [
  { key: 'all', label: 'All Jobs' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in-progress', label: 'In-Progress' },
  { key: 'completed', label: 'Completed' }
];

const MyJobsPage = () => {
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
          serviceType: job.serviceType || 'home',
          image: pickJobImage(job)
        }));

      setJobs(normalized);
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
        </div>

        <div className="my-jobs-message-view">
          <CleanerMessagePanel
            threadId={activeMessageJob.sourceRequestId || activeMessageJob.id}
            customerName={activeMessageJob.customer}
            subtitle={`${activeMessageJob.title} Job - ${activeMessageJob.jobId}`}
          />

          <aside className="my-jobs-details-panel">
            <h5>JOB DETAILS</h5>

            <div className="my-jobs-details-card">
              <div className="my-jobs-detail-row">
                <span className="my-jobs-detail-icon"><CalendarOutlined /></span>
                <div>
                  <small>Date &amp; Time</small>
                  <strong>Tomorrow, 9:00 AM</strong>
                </div>
              </div>

              <div className="my-jobs-detail-row">
                <span className="my-jobs-detail-icon"><EnvironmentOutlined /></span>
                <div>
                  <small>Location</small>
                  <strong>{activeMessageJob.location}</strong>
                </div>
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

            <div className="my-jobs-map-preview" />
          </aside>
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
        {visibleJobs.map((job) => {
          const actionState = jobActionStateById[job.id]
            || (job.status === 'completed'
              ? 'completed'
              : job.status === 'in-progress'
                ? 'in-progress'
                : 'idle');

          return (
            <article key={job.id} className={`my-job-card-v2 ${job.status === 'completed' ? 'completed' : ''}`}>
            <aside
              className="my-job-date-v2"
              style={{ '--job-date-bg': `url(${job.image || officeImage})` }}
            >
              <span className={`status-pill ${job.status}`}>
                {job.status === 'completed' ? 'COMPLETED' : job.status === 'in-progress' ? 'IN PROGRESS' : 'ACTIVE NOW'}
              </span>
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

                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => handleCheckMyJob(job.id)}
                >
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


