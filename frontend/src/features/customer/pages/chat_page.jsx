import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, MessageOutlined } from '@ant-design/icons';
import CustomerMessagePanel from '../components/customer_message_panel';
import api from '../../../services/api';
import '../../../styles/cleaner/my_jobs.scss';
import api from '../../../services/api';

const fallbackBookings = [
  {
    booking_id: 'demo-1',
    booking_date: '2026-03-14T09:00:00',
    booking_time: '09:00 AM',
    address: '123 Street 271, Sangkat Boeung Tumpun, Phnom Penh, Cambodia',
    service: { name: 'Deep House Cleaning' },
    cleaner: { username: 'Narith Hen' }
  }
];

const CustomerChatPage = () => {
  const [searchParams] = useSearchParams();
  const { bookingId: pathBookingId } = useParams();
  const navigate = useNavigate();
  const bookingId = pathBookingId || searchParams.get('booking');

  const [dynamicBookings, setDynamicBookings] = useState(DEMO_BOOKINGS);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      try {
        const resp = await api.get(`/bookings/track/${bookingId}`);
        const data = resp?.data?.data;
        if (!data) return;
        const cleanerName = [data.cleaner_first_name, data.cleaner_last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Assigned Cleaner';
        const timeRange = data.booking_time || '';
        const dateStr = data.booking_date ? new Date(data.booking_date).toDateString() : '';
        const entry = {
          id: String(data.booking_id),
          jobId: `#JOB-${data.booking_id}`,
          title: data.service_name || 'Cleaning',
          cleanerName,
          date: dateStr,
          time: timeRange,
          status: data.booking_status || 'confirmed'
        };
        setDynamicBookings((prev) => {
          const exists = prev.some((b) => String(b.id) === String(entry.id));
          if (exists) {
            return prev.map((b) => (String(b.id) === String(entry.id) ? entry : b));
          }
          return [entry, ...prev];
        });
      } catch {
        // ignore; fallback to demo data
      }
    };
    fetchBooking();
  }, [bookingId]);

  const [selectedBooking, setSelectedBooking] = useState(
    bookingId || dynamicBookings[0]?.id || null
  );

  const activeBooking = useMemo(() => {
    return dynamicBookings.find((b) => String(b.id) === String(selectedBooking)) || dynamicBookings[0];
  }, [dynamicBookings, selectedBooking]);

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
