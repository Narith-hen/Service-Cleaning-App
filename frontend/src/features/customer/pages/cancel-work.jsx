import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../../../styles/cleaner/cancel_during.css';
import api from '../../../services/api';

const CancelWorkPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId: pathBookingId } = useParams();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bookingId = pathBookingId || location.state?.bookingId || '';
  const serviceName = location.state?.serviceName || 'Cleaning Service';

  const closeModal = () => {
    navigate('/customer/history');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!bookingId || submitting) return;

    setSubmitting(true);
    try {
      await api.patch(`/bookings/${encodeURIComponent(String(bookingId))}/cancel`, {
        ...(reason.trim() ? { reason: reason.trim() } : {})
      });
      navigate('/customer/history', { state: { refresh: true, filter: 'cancelled' } });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to cancel booking.';
      window.alert(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="cancel-during-work-page">
      <div className="cancel-during-work-modal">
        <div className="cancel-during-work-header">
          <h2>Cancel Booking</h2>
          <button type="button" className="cancel-during-work-close" onClick={closeModal} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="cancel-during-work-label">
          Please provide a reason for cancelling {serviceName}
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            className="cancel-during-work-textarea"
            placeholder="Your reason..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />

          <div className="cancel-during-work-warning">
            <div className="cancel-during-work-warning-icon">!</div>
            <div className="cancel-during-work-warning-text">
              <h4>Important Notice</h4>
              <p>
                Cancelling a booking close to the scheduled time may affect cleaner availability and service planning.
              </p>
            </div>
          </div>

          <div className="cancel-during-work-footer">
            <button type="button" className="cancel-during-work-btn keep" onClick={closeModal}>
              Keep Booking
            </button>

            <button type="submit" className="cancel-during-work-btn submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>

        <div className="cancel-during-work-support">
          Need help?{' '}
          <button type="button" onClick={() => navigate('/customer/contact')}>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelWorkPage;
