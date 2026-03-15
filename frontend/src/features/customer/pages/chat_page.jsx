import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageOutlined, CalendarOutlined, EnvironmentOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import CustomerMessagePanel from '../components/customer_message_panel';
import api from '../../../services/api';
import '../../../styles/cleaner/my_jobs.scss';

const fallbackBookings = [];

const CustomerChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking');
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await api.get('/bookings', { params: { page: 1, limit: 50 } });
        const bookingsData = response?.data?.data || [];
        let normalizedBookings = bookingsData.length > 0 ? bookingsData : [];

        // If a bookingId is passed via URL and doesn't exist, create a placeholder.
        // This simulates a new booking being matched and ready for chat.
        if (bookingId && !normalizedBookings.some(b => b.booking_id === bookingId)) {
          const newBooking = {
            booking_id: bookingId,
            booking_date: new Date().toISOString(),
            booking_time: '10:00 AM', // Placeholder time
            address: '123 Harmony Lane, Bright City', // Placeholder address
            service: { name: 'Custom Cleaning' }, // Placeholder service
            cleaner: { id: '11', username: 'Cleaner 1' } // Assign the requested cleaner
          };
          normalizedBookings.unshift(newBooking);
        }
        setBookings(normalizedBookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        let currentBookings = [];
        if (bookingId && !currentBookings.some(b => b.booking_id === bookingId)) {
          const newBooking = {
            booking_id: bookingId,
            booking_date: new Date().toISOString(),
            booking_time: '10:00 AM',
            address: '123 Harmony Lane, Bright City',
            service: { name: 'Custom Cleaning' },
            cleaner: { id: '11', username: 'Cleaner 1' }
          };
          currentBookings.unshift(newBooking);
        }
        setBookings(currentBookings);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [bookingId]);

  const activeBooking = useMemo(() => {
    if (!bookings.length) return null;
    return bookings.find(b => b.booking_id === bookingId) || bookings[0];
  }, [bookings, bookingId]);

  if (loading) {
    return (
      <div className="customer-chat-page">
        <div className="customer-chat-empty">
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div className="customer-chat-page">
        <div className="customer-chat-empty">
          <MessageOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
          <h3>No Active Bookings</h3>
          <p>You don't have any confirmed bookings yet.</p>
          <button 
            type="button" 
            className="back-btn"
            onClick={() => navigate('/customer/bookings')}
          >
            Book a Service
          </button>
        </div>
      </div>
    );
  }

  // Get cleaner name from the booking
  const cleanerName = activeBooking.cleaner?.username || 'Cleaner';
  const cleanerId = activeBooking.cleaner?.id || '11';
  const serviceName = activeBooking.service?.name || 'Cleaning Service';
  const jobId = `#SOMA-${activeBooking.booking_id}`;
  const bookingDate = new Date(activeBooking.booking_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const bookingTime = activeBooking.booking_time || '09:00 AM';
  const bookingLocation =
    activeBooking.address
    || activeBooking.location
    || activeBooking.service_location
    || activeBooking.service?.location
    || 'Location not provided';

  return (
    <div className="cleaner-my-jobs-v2">
      <div className="my-jobs-message-breadcrumb">
        <button type="button" onClick={() => navigate('/customer/bookings')}>My Bookings</button>
        <span>&gt;</span>
        <strong>Chat</strong>
      </div>

      <div className="my-jobs-message-view">
        <CustomerMessagePanel
          threadId={String(activeBooking.booking_id)}
          cleanerName={cleanerName}
          cleanerId={cleanerId}
          subtitle={`${serviceName} Job - ${jobId}`}
        />

        <aside className="my-jobs-details-panel">
          <h5>JOB DETAILS</h5>

          <div className="my-jobs-details-card">
            <div className="my-jobs-detail-row">
              <span className="my-jobs-detail-icon"><CalendarOutlined /></span>
              <div>
                <small>Date &amp; Time</small>
                <strong>{bookingDate}, {bookingTime}</strong>
              </div>
            </div>

            <div className="my-jobs-detail-row">
              <span className="my-jobs-detail-icon"><EnvironmentOutlined /></span>
              <div>
                <small>Location</small>
                <strong>{bookingLocation}</strong>
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
};

export default CustomerChatPage;
