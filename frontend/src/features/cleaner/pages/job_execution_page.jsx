import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CheckCircleFilled,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import '../../../styles/cleaner/job_execution.scss';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';

const fallbackJob = {
  id: 'default-1',
  sourceRequestId: 'default-1',
  status: 'in-progress',
  title: 'Deep Home Cleaning',
  jobId: '#SMT-78291',
  price: '$120.00',
  timeRange: '09:00 AM - 01:00 PM',
  location: '124 Maple Avenue, Suite 4B',
  customer: 'Sarah Jenkins'
};

const defaultChecklist = [
  { id: 'item-1', label: 'Dusting all ceiling fans and light fixtures', done: true, time: '9:15 AM' },
  { id: 'item-2', label: 'Wiping down all baseboards and crown molding', done: true, time: '9:45 AM' },
  { id: 'item-3', label: 'Cleaning interior windows and window sills', done: true, time: '10:10 AM' },
  { id: 'item-4', label: 'Deep cleaning kitchen appliances (oven, fridge)', done: true, time: '10:24 AM' },
  { id: 'item-5', label: 'Disinfecting all bathroom surfaces and grout', done: false, time: '' },
  { id: 'item-6', label: 'Vacuuming and steam cleaning carpets', done: false, time: '' },
  { id: 'item-7', label: 'Sanitizing high-touch points (doorknobs, switches)', done: false, time: '' }
];

const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const normalizeConfirmedJob = (job) => ({
  id: job.id || job.sourceRequestId || 'default-1',
  sourceRequestId: job.sourceRequestId || job.id || 'default-1',
  status: job.status || 'in-progress',
  title: job.title || fallbackJob.title,
  jobId: job.jobId || fallbackJob.jobId,
  price: job.price || fallbackJob.price,
  timeRange: job.timeRange || fallbackJob.timeRange,
  location: job.location || fallbackJob.location,
  customer: job.customer || fallbackJob.customer
});

const JobExecutionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedJobId = location.state?.jobId || null;

  const currentJob = useMemo(() => {
    try {
      const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
      if (!raw) return fallbackJob;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return fallbackJob;

      const found = selectedJobId
        ? parsed.find((job) => job.id === selectedJobId || job.sourceRequestId === selectedJobId)
        : parsed[0];

      return normalizeConfirmedJob(found || parsed[0]);
    } catch {
      return fallbackJob;
    }
  }, [selectedJobId]);

  const [checklist, setChecklist] = useState(defaultChecklist);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const completedCount = checklist.filter((item) => item.done).length;
  const priceValue = Number(String(currentJob.price || '$0').replace(/[^0-9.]/g, '')) || 0;
  const materialsFee = 15.5;
  const totalEarning = priceValue + materialsFee;

  const toggleChecklistItem = (id) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, done: !item.done, time: item.done ? '' : 'Now' }
          : item
      )
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    
    const newItem = {
      id: generateId(),
      label: newChecklistItem.trim(),
      done: false,
      time: ''
    };
    
    setChecklist((prev) => [...prev, newItem]);
    setNewChecklistItem('');
  };

  const handleDeleteChecklistItem = (id) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddChecklistItem();
    }
  };

  const handleFinishJob = () => {
    try {
      const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
      if (!raw) {
        navigate('/cleaner/my-jobs');
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        navigate('/cleaner/my-jobs');
        return;
      }

      const updated = parsed.map((job) =>
        (job.id === currentJob.id || job.sourceRequestId === currentJob.sourceRequestId)
          ? { ...job, status: 'completed' }
          : job
      );
      localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Non-blocking. We still navigate back.
    }

    navigate('/cleaner/my-jobs');
  };

  return (
    <div className="cleaner-job-execution-page">
      <div className="execution-breadcrumb">
        <button type="button" onClick={() => navigate('/cleaner/my-jobs')}>My Jobs</button>
        <span>&gt;</span>
        <strong>Job Execution</strong>
      </div>

      <section className="execution-top-card">
        <div className="execution-title-wrap">
          <h1>{currentJob.title}</h1>
          <p>
            Job ID: <span>{currentJob.jobId}</span>
          </p>
        </div>

        <div className="elapsed-box">
          <small>ELAPSED</small>
          <div className="elapsed-grid">
            <div><strong>01</strong><span>HR</span></div>
            <div><strong>24</strong><span>MIN</span></div>
            <div><strong>45</strong><span>SEC</span></div>
          </div>
        </div>

        <div className="execution-meta-grid">
          <div className="execution-meta-item">
            <span className="meta-icon"><UserOutlined /></span>
            <div>
              <small>CUSTOMER</small>
              <strong>{currentJob.customer}</strong>
            </div>
          </div>

          <div className="execution-meta-item">
            <span className="meta-icon"><EnvironmentOutlined /></span>
            <div>
              <small>ADDRESS</small>
              <strong>{currentJob.location}</strong>
            </div>
          </div>

          <div className="execution-meta-item">
            <span className="meta-icon"><ClockCircleOutlined /></span>
            <div>
              <small>TIME SLOT</small>
              <strong>{currentJob.timeRange}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="execution-main-grid">
        <section className="execution-checklist-panel">
          <div className="panel-head">
            <h2>Service Checklist</h2>
            <span>{completedCount} / {checklist.length} Completed</span>
          </div>

          <div className="checklist-items">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`checklist-row ${item.done ? 'done' : ''}`}
              >
                <button
                  type="button"
                  className="check-btn"
                  onClick={() => toggleChecklistItem(item.id)}
                >
                  <span className="check-icon">{item.done ? <CheckOutlined /> : null}</span>
                </button>
                <span className="check-label">{item.label}</span>
                <span className="check-time">{item.time}</span>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDeleteChecklistItem(item.id)}
                >
                  <DeleteOutlined />
                </button>
              </div>
            ))}
            
            <div className="add-checklist-row">
              <input
                type="text"
                placeholder="Add new checklist item..."
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={handleKeyPress}
                className="checklist-input"
              />
              <button
                type="button"
                className="add-btn"
                onClick={handleAddChecklistItem}
                disabled={!newChecklistItem.trim()}
              >
                <PlusOutlined /> Add
              </button>
            </div>
          </div>
        </section>

        <aside className="execution-side-column">
          <section className="job-summary-panel">
            <h3>Job Summary</h3>
            <div className="summary-row">
              <span>Service Fee</span>
              <strong>${priceValue.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Materials Used</span>
              <strong>${materialsFee.toFixed(2)}</strong>
            </div>
            <div className="summary-row total">
              <span>Total Earning</span>
              <strong>${totalEarning.toFixed(2)}</strong>
            </div>

            <button type="button" className="finish-job-btn" onClick={handleFinishJob}>
              <CheckCircleFilled /> Finish Job
            </button>
            <p>Complete all tasks to finish</p>
          </section>

          <section className="execution-map-panel">
            <div className="map-art" />
            <div className="location-foot">
              <CheckCircleFilled />
              <div>
                <strong>Client Location</strong>
                <p>1.2 miles from your last stop</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default JobExecutionPage;
