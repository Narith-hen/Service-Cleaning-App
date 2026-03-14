import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import '../../../styles/cleaner/review.scss'; // Re-use styles for now

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

const AvailableJobsPage = () => {
  const navigate = useNavigate();
  const [availableJobs, setAvailableJobs] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      console.log('[AvailableJobs] Socket connected');
      socket.emit('join:cleaners');
    };

    const onJobAvailable = (jobDetails) => {
      setAvailableJobs((prevJobs) => {
        if (prevJobs.some(job => job.bookingId === jobDetails.bookingId)) {
          return prevJobs;
        }
        return [jobDetails, ...prevJobs];
      });
    };

    const onJobRemoved = ({ bookingId }) => {
      setAvailableJobs((prevJobs) => prevJobs.filter(job => job.bookingId !== bookingId));
    };

    socket.on('connect', onConnect);
    socket.on('job:available', onJobAvailable);
    socket.on('job:removed', onJobRemoved);

    if (!socket.connected) {
      const token = localStorage.getItem('token') || 'demo-cleaner-token';
      const userId = 'narith-hen'; // Hardcoded for demo
      socket.auth = { token, userId };
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('job:available', onJobAvailable);
      socket.off('job:removed', onJobRemoved);
    };
  }, []);

  const handleAcceptJob = (job) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      const cleanerDetails = {
        name: 'Narith Hen', // Hardcoded for demo
        id: 'narith-hen'
      };
      socket.emit('job:accepted', { bookingId: job.bookingId, cleaner: cleanerDetails });
      
      // Navigate to the chat page for this new job
      navigate(`/cleaner/my-jobs/message?booking=${job.bookingId}`);
    }
  };

  return (
    <div className="cleaner-review-page">
      <div className="review-headline">
        <h1>Available Jobs</h1>
        <p>New cleaning requests from customers will appear here in real-time.</p>
      </div>

      <div className="review-list">
        {availableJobs.length === 0 ? (
          <div className="review-card" style={{ textAlign: 'center' }}>
            <p>No new jobs available right now. We'll notify you when a new request comes in.</p>
          </div>
        ) : (
          availableJobs.map((job) => (
            <article key={job.bookingId} className="review-card">
              <div className="review-top">
                <div className="review-author">
                  <span className="avatar">C</span>
                  <div>
                    <h3>New Request: {job.serviceTitle}</h3>
                    <div className="meta-line">
                      <span>Time: {job.startTime}</span>
                    </div>
                  </div>
                </div>
                <span className="service-chip">NEW</span>
              </div>
              <p className="comment">A new customer is looking for a cleaner for the service above.</p>
              <div className="review-footer">
                <span className="verified">Waiting for acceptance</span>
                <div className="review-actions">
                  <button type="button" className="reply-btn" onClick={() => handleAcceptJob(job)}>
                    Accept Job
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default AvailableJobsPage;