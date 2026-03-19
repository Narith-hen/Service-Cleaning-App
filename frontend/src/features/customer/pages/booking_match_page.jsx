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

const getRealtimeAuth = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return {
      token: stored?.token || localStorage.getItem('token') || null,
      userId: stored?.id || stored?.user_id || null
    };
  } catch {
    return {
      token: localStorage.getItem('token') || null,
      userId: null
    };
  }
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
  const [isMatched, setIsMatched] = useState(false);
  const ACCEPTED_BOOKING_KEY = 'accepted_booking_id';
  const CANCELLED_BOOKING_KEY = 'cancelled_booking_id';
  const ALERTED_BOOKING_PREFIX = 'alerted_booking_';
  const socketRef = useRef(null);
  const [trackedBookingId, setTrackedBookingId] = useState(() => {
    try {
      return localStorage.getItem('last_booking_id');
    } catch {
      return null;
    }
  });

  const bookingId =
    location?.state?.bookingId ||
    location?.state?.booking_id ||
    trackedBookingId ||
    null;

  const serviceTitle = (() => {
    const fromState = location?.state?.serviceTitle || location?.state?.service?.title || location?.state?.service?.name;
    if (fromState) return fromState;
    try {
      const storedTitle = localStorage.getItem('last_booking_service_title');
      if (storedTitle) return storedTitle;
      const stored = JSON.parse(localStorage.getItem('selectedService') || 'null');
      return stored?.title || stored?.name || null;
    } catch {
      return null;
    }
  })();

  const startTime = (() => {
    const fromState = location?.state?.startTime || location?.state?.booking_time;
    if (fromState) return fromState;
    try {
      return localStorage.getItem('last_booking_start_time');
    } catch {
      return null;
    }
  })();

  const openAcceptedChat = (acceptedId) => {
    if (!acceptedId) return;
    navigate(`/customer/chat?booking=${encodeURIComponent(String(acceptedId))}`);
  };

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
          openAcceptedChat(finalBookingId);
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
      const { token, userId } = getRealtimeAuth();
      if (!token) {
        return () => {
          clearInterval(progressInterval);
          clearInterval(statusTimer);
          socket.off('connect', onConnect);
          socket.off('job:matched', onJobMatched);
          socket.emit('booking:leave', finalBookingId);
        };
      }
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
          try {
            const key = `${ALERTED_BOOKING_PREFIX}${stored}`;
            if (!localStorage.getItem(key)) {
              alert(`Your booking #${stored} was accepted. Open chat to talk with your cleaner.`);
              localStorage.setItem(key, '1');
            }
          } catch {
            /* ignore */
          }
          openAcceptedChat(stored);
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
  }, [navigate]);

  // Poll backend for status of last booking and redirect when confirmed
  useEffect(() => {
    const effectiveBookingId = bookingId || trackedBookingId;
    if (!effectiveBookingId) return;
    const pollStatus = setInterval(async () => {
      try {
        const resp = await api.get(`/bookings/track/${effectiveBookingId}`);
        const payload = resp?.data?.data || {};
        const status = String(
          payload?.booking_status ??
          payload?.status ??
          payload?.bookingStatus ??
          ''
        ).toLowerCase();
        const acceptedStatuses = new Set(['confirmed', 'accepted', 'claimed', 'assigned', 'in_progress']);
        const hasCleaner =
          payload?.cleaner_id != null ||
          payload?.cleaner != null ||
          payload?.cleaner_first_name ||
          payload?.cleaner_last_name;

        if (acceptedStatuses.has(status) || hasCleaner) {
          setIsMatched(true);
          const acceptedBookingId = String(payload?.booking_id ?? effectiveBookingId);
          try {
            const key = `${ALERTED_BOOKING_PREFIX}${acceptedBookingId}`;
            if (!localStorage.getItem(key)) {
              alert(`Your booking #${acceptedBookingId} was accepted. Open chat to talk with your cleaner.`);
              localStorage.setItem(key, '1');
            }
          } catch {
            /* ignore */
          }
          openAcceptedChat(acceptedBookingId);
          localStorage.removeItem('last_booking_id');
          clearInterval(pollStatus);
          setProgress(100);
          setStep(statusUpdates.length);
        } else if (status === 'cancelled' || status === 'rejected' || status === 'declined') {
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
  }, [trackedBookingId, bookingId, navigate]);

  return (
    <div className="booking-match-page">
      <div className="progress-steps" aria-hidden data-customer-reveal>
        <span className="active" />
        <span className="active" />
        <span className="pulsing" />
        <span />
      </div>

      <section className="match-card" data-customer-reveal data-customer-panel style={{ '--customer-reveal-delay': 1 }}>
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
          <button type="button" onClick={() => navigate('/customer/dashboard')} data-customer-button>
            Cancel Matching
          </button>
          <button
            type="button"
            className="skip-btn"
            onClick={() => navigate(`/customer/bookings/quotes${bookingId ? `?booking=${encodeURIComponent(String(bookingId))}` : ''}`)}
            data-customer-button
          >
            Skip Matching
          </button>
          <button
            type="button"
            className="next-btn"
            disabled={progress < 95}
            aria-disabled={progress < 95}
            title={progress < 95 ? 'Matching in progress' : 'Continue to quotes'}
            onClick={() => navigate(`/customer/bookings/quotes${bookingId ? `?booking=${encodeURIComponent(String(bookingId))}` : ''}`)}
            data-customer-button
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
};

export default BookingMatchPage;
