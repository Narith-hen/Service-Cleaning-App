import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, MessageOutlined } from '@ant-design/icons';
import CustomerMessagePanel from '../components/customer_message_panel';
import '../../../styles/customer/chat.scss';
import '../../../styles/cleaner/my_jobs.scss';

// Demo data - in production, this would come from API
const DEMO_BOOKINGS = [
  {
    id: 'booking-1',
    jobId: '#SOMA-48291',
    title: 'Deep House Cleaning',
    cleanerName: 'Maria Garcia',
    date: 'March 24, 2026',
    time: '09:00 AM - 12:00 PM',
    status: 'confirmed'
  },
  {
    id: 'booking-2',
    jobId: '#SOMA-48285',
    title: 'Office Cleaning',
    cleanerName: 'John Smith',
    date: 'March 28, 2026',
    time: '02:00 PM - 05:00 PM',
    status: 'pending'
  }
];

const CustomerChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking');
  
  const [selectedBooking, setSelectedBooking] = useState(bookingId || DEMO_BOOKINGS[0]?.id || null);

  const activeBooking = useMemo(() => {
    return DEMO_BOOKINGS.find(b => b.id === selectedBooking) || DEMO_BOOKINGS[0];
  }, [selectedBooking]);

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

  return (
    <div className="customer-chat-page">
      <div className="customer-chat-container">
        {/* Booking List Sidebar */}
        <aside className="customer-chat-sidebar">
          <div className="chat-sidebar-header">
            <button 
              type="button" 
              className="back-btn-icon"
              onClick={() => navigate('/customer/dashboard')}
              aria-label="Back to dashboard"
            >
              <ArrowLeftOutlined />
            </button>
            <h3>My Chats</h3>
          </div>

          <div className="chat-booking-list">
            {DEMO_BOOKINGS.map((booking) => (
              <button
                key={booking.id}
                type="button"
                className={`chat-booking-item ${selectedBooking === booking.id ? 'active' : ''}`}
                onClick={() => setSelectedBooking(booking.id)}
              >
                <div className="booking-avatar">
                  {booking.cleanerName.charAt(0)}
                </div>
                <div className="booking-info">
                  <strong>{booking.cleanerName}</strong>
                  <small>{booking.title}</small>
                  <span className="booking-date">{booking.date}</span>
                </div>
                {booking.status === 'confirmed' && (
                  <span className="booking-status confirmed">✓</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="customer-chat-main">
          <div className="customer-chat-header">
            <div className="chat-header-info">
              <h2>{activeBooking.cleanerName}</h2>
              <p>{activeBooking.title} - {activeBooking.jobId}</p>
            </div>
            <div className="chat-header-meta">
              <span className="chat-date">{activeBooking.date}</span>
              <span className="chat-time">{activeBooking.time}</span>
            </div>
          </div>

          <CustomerMessagePanel
            threadId={activeBooking.id}
            cleanerName={activeBooking.cleanerName}
            subtitle={`${activeBooking.title} - ${activeBooking.jobId}`}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerChatPage;
