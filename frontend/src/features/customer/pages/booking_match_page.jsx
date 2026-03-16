import { useEffect, useState, useRef } from 'react';
import { Clock3, Home, SearchCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../../../styles/customer/booking_match.scss';
import api from '../../../services/api';

const SOCKET_URL = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:4000';

// Create a shared socket instance
let socketInstance = null;
const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socketInstance;
};

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
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(65);
  const [isFading, setIsFading] = useState(false);
  const [acceptedId, setAcceptedId] = useState(null);
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
    const finalBookingId = bookingId || 'demo-1';
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      console.log('[BookingMatch] Socket connected');
      // Join a room for this specific booking to get match updates
      socket.emit('join:matching', finalBookingId);

      // Announce the new job to cleaners
      const jobDetails = {
        bookingId: finalBookingId,
        serviceTitle: serviceTitle || 'Residential Cleaning',
        startTime: startTime || '10:00 AM'
      };
      socket.emit('job:new', jobDetails);
    };

    const onJobMatched = ({ bookingId: matchedBookingId, cleaner }) => {
      if (matchedBookingId === finalBookingId) {
        console.log(`[BookingMatch] Matched with cleaner:`, cleaner);
        setIsMatched(true);
        setProgress(100);
        setStep(statusUpdates.length); // Go to a new "Matched!" step

        // Navigate to chat after a short delay
        setTimeout(() => {
          navigate(`/customer/chat?booking=${finalBookingId}`);
        }, 2000);
      }
    };

    socket.on('connect', onConnect);
    socket.on('job:matched', onJobMatched);

    let progressInterval, statusTimer;
    if (!isMatched) {
      progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const next = prev + Math.floor(Math.random() * 8);
        return Math.min(next, 95);
      });
    }, 1500);

      statusTimer = setInterval(() => {
      setIsFading(true);
        setTimeout(() => {
        setStep((prev) => {
          if (prev >= statusUpdates.length - 1) {
            clearInterval(statusTimer);
            return statusUpdates.length - 1;
          }
          return prev + 1;
        });
        setIsFading(false);
        }, 500);
      }, 3500);
    }

    if (!socket.connected) {
      const token = localStorage.getItem('token') || 'demo-customer-token';
      const userId = 'hen-narith'; // Hardcoded for demo
      socket.auth = { token, userId };
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusTimer);
      socket.off('connect', onConnect);
      socket.off('job:matched', onJobMatched);
      socket.emit('booking:leave', finalBookingId);
    };
  }, [navigate, bookingId, serviceTitle, startTime, isMatched]);

  // Poll localStorage to detect when cleaner accepted and jump to chat
  useEffect(() => {
    const poll = setInterval(() => {
      try {
        const stored = localStorage.getItem(ACCEPTED_BOOKING_KEY);
        if (stored) {
          setAcceptedId(stored);
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

  useEffect(() => {
    if (!acceptedId) return;
    // brief alert then navigate to chat
    alert(`Your booking #${acceptedId} has been accepted. Opening chat with your cleaner.`);
    navigate(`/customer/chat/${acceptedId}`);
  }, [acceptedId, navigate]);

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

        {isMatched ? (
          <>
            <h1 className="matched">Cleaner Found!</h1>
            <p className="status-desc">You've been matched. Redirecting to chat...</p>
          </>
        ) : (
          <>
            <h1 className={isFading ? 'fade' : ''}>{statusUpdates[step]?.title || 'Almost Matched!'}</h1>
            <p className={`status-desc ${isFading ? 'fade' : ''}`}>{statusUpdates[step]?.desc || 'Finalizing details...'}</p>
          </>
        )}

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
            {serviceTitle || 'Residential'}
          </p>
          <span>|</span>
          <p>
            <Clock3 size={12} />
            {startTime || '10:00 AM'}
          </p>
        </div>

        <div className="match-actions">
          <button type="button" onClick={() => navigate('/customer/dashboard')}>
            Cancel Matching
          </button>
          <button
            type="button"
            className="skip-btn"
            onClick={() => navigate('/customer/bookings/quotes')}
          >
            Skip Matching
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
      </section>
    </div>
  );
};

export default BookingMatchPage;
