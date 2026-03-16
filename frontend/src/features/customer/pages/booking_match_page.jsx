import { useEffect, useState } from 'react';
import { Clock3, Home, SearchCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/customer/booking_match.scss';
import api from '../../../services/api';

const statusUpdates = [
  {
    title: 'Searching for Pros',
    desc: 'Connecting with available cleaners in your area...'
  },
  {
    title: 'Reviewing Profiles',
    desc: 'Comparing your job details with cleaner ratings.'
  },
  {
    title: 'Almost Matched!',
    desc: 'Top-rated cleaner is reviewing your request now.'
  }
];

const BookingMatchPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(65);
  const [isFading, setIsFading] = useState(false);
  const [acceptedId, setAcceptedId] = useState(null);
  const [promptBookingId, setPromptBookingId] = useState(null);
  const ACCEPTED_BOOKING_KEY = 'accepted_booking_id';
  const CANCELLED_BOOKING_KEY = 'cancelled_booking_id';
  const [trackedBookingId, setTrackedBookingId] = useState(() => {
    try {
      return localStorage.getItem('last_booking_id');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFading(true);

      setTimeout(() => {
        setStep((prev) => (prev + 1) % statusUpdates.length);
        setIsFading(false);
      }, 500);

      setProgress((prev) => {
        if (prev >= 95) return prev;
        const next = prev + Math.floor(Math.random() * 8);
        return Math.min(next, 95);
      });
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  // Poll localStorage to detect when cleaner accepted and jump to chat
  useEffect(() => {
    const poll = setInterval(() => {
      try {
        const stored = localStorage.getItem(ACCEPTED_BOOKING_KEY);
        if (stored) {
          setAcceptedId(stored);
          setPromptBookingId(stored);
          localStorage.removeItem(ACCEPTED_BOOKING_KEY);
        }
        const cancelled = localStorage.getItem(CANCELLED_BOOKING_KEY);
        if (cancelled) {
          alert('Your booking was declined by the cleaner.');
          localStorage.removeItem(CANCELLED_BOOKING_KEY);
          localStorage.removeItem('last_booking_id');
          navigate('/customer/bookings');
        }
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => clearInterval(poll);
  }, []);

  // Poll backend for status of last booking and redirect when confirmed
  useEffect(() => {
    if (!trackedBookingId) return;
    const pollStatus = setInterval(async () => {
      try {
        const resp = await api.get(`/bookings/track/${trackedBookingId}`);
        const status = resp?.data?.data?.booking_status?.toLowerCase();
        if (status === 'confirmed') {
          setAcceptedId(trackedBookingId);
          setPromptBookingId(trackedBookingId);
          localStorage.removeItem('last_booking_id');
          clearInterval(pollStatus);
        } else if (status === 'cancelled') {
          alert('Your booking was declined by the cleaner.');
          localStorage.removeItem('last_booking_id');
          clearInterval(pollStatus);
          navigate('/customer/bookings');
        }
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(pollStatus);
  }, [trackedBookingId]);

  const handleOpenChat = () => {
    if (!promptBookingId) return;
    alert(`Your booking #${promptBookingId} has been accepted. Opening chat with your cleaner.`);
    navigate(`/customer/chat/${promptBookingId}`);
  };

  const handleLater = () => {
    setPromptBookingId(null);
  };

  return (
    <div className="booking-match-page">
      <div className="progress-steps" aria-hidden>
        <span className="active" />
        <span className="active" />
        <span className="pulsing" />
        <span />
      </div>

      <section className="match-card">
        <div className="match-glow" aria-hidden />

        <div className="icon-wrap" aria-hidden>
          <div className="loading-pulse">
            <SearchCheck size={30} />
          </div>
        </div>

        <h1 className={isFading ? 'fade' : ''}>{statusUpdates[step].title}</h1>
        <p className={`status-desc ${isFading ? 'fade' : ''}`}>{statusUpdates[step].desc}</p>

        <article className="progress-card">
          <div className="progress-top">
            <span>Match Strength</span>
            <strong>{progress}%</strong>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </article>

        <div className="service-meta">
          <p>
            <Home size={12} />
            Residential
          </p>
          <span>|</span>
          <p>
            <Clock3 size={12} />
            10:00 AM
          </p>
        </div>

        <div className="match-actions">
          <button type="button" onClick={() => navigate('/customer/dashboard')}>
            Cancel Matching
          </button>
          <button
            type="button"
            className="next-btn"
            disabled={progress < 95}
            aria-disabled={progress < 95}
            title={progress < 95 ? 'Matching in progress' : 'Continue to quotes'}
            onClick={() => navigate('/customer/bookings/quotes')}
          >
            Next
          </button>
        </div>
        {promptBookingId && (
          <div className="match-alert" role="status" aria-live="assertive">
            <strong>Cleaner accepted your booking.</strong>
            <div className="alert-actions">
              <button type="button" className="alert-primary" onClick={handleOpenChat}>
                Open Chat
              </button>
              <button type="button" className="alert-secondary" onClick={handleLater}>
                Later
              </button>
            </div>
          </div>
        )}
      </section>

      {promptBookingId && (
        <div className="match-toast" role="status" aria-live="assertive">
          <div className="toast-icon">✓</div>
          <div className="toast-body">
            <strong>Cleaner accepted your booking.</strong>
            <button type="button" className="toast-primary" onClick={handleOpenChat}>
              Open Chat
            </button>
            <button type="button" className="toast-link" onClick={handleLater}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingMatchPage;
