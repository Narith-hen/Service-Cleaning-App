import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../../../styles/cleaner/cancel_during.css';
import { dispatchCleanerNotificationsUpdated } from '../utils/notificationSync';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';

const CancelDuringWorkPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId: pathJobId } = useParams();
  const [reason, setReason] = useState('');

  const jobId = pathJobId || location.state?.jobId || '';

  const closeModal = () => {
    navigate('/cleaner/my-jobs');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    try {
      const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((job) =>
            String(job.id || job.sourceRequestId) === String(jobId)
              ? { ...job, status: 'cancelled', cancel_reason: reason.trim() || '' }
              : job
          );
          localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify(updated));
          dispatchCleanerNotificationsUpdated();
        }
      }
    } catch {
      // Keep navigation non-blocking if storage parsing fails.
    }

    navigate('/cleaner/my-jobs', { state: { tab: 'cancelled' } });
  };

  return (
    <>
      <div className="cancel-during-work-page">
        <div className="cancel-during-work-modal">
          <div className="cancel-during-work-header">
            <h2>Cancel Job</h2>
            <button type="button" className="cancel-during-work-close" onClick={closeModal} aria-label="Close">
              &times;
            </button>
          </div>

          <div className="cancel-during-work-label">Please provide a reason for cancelling</div>

          <form onSubmit={handleSubmit}>
            <textarea
              className="cancel-during-work-textarea"
              placeholder="Your reason..."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />

            <div className="cancel-during-work-warning">
              <div className="cancel-during-work-warning-icon">⚠</div>
              <div className="cancel-during-work-warning-text">
                <h4>Important Notice</h4>
                <p>
                  Cancelling a job within 24 hours of the start time may result in a standard
                  administrative fee.
                </p>
              </div>
            </div>

            <div className="cancel-during-work-footer">
              <button type="button" className="cancel-during-work-btn keep" onClick={closeModal}>
                Keep Job
              </button>

              <button type="submit" className="cancel-during-work-btn submit">
                Submit
              </button>
            </div>
          </form>

          <div className="cancel-during-work-support">
            Need help?{' '}
            <button type="button" onClick={() => navigate('/cleaner/help/contact')}>
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CancelDuringWorkPage;
