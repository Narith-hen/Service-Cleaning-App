import React, { useState } from 'react';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import '../../../styles/customer/booking.scss';

const BookingPage = () => {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    service: null,
    date: null,
    time: null,
    address: '',
    notes: ''
  });

  // Mock service data - replace with actual data from API
  const service = {
    id: 1,
    name: 'Regular Cleaning',
    price: 45,
    duration: '2 hours',
    description: 'Perfect for weekly or bi-weekly maintenance cleaning'
  };

  const availableDates = [
    '2024-10-25',
    '2024-10-26',
    '2024-10-27',
    '2024-10-28',
    '2024-10-29'
  ];

  const availableTimes = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM'
  ];

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleBooking = () => {
    // Submit booking
    console.log('Booking submitted:', bookingData);
    // Show success message and redirect
  };

  return (
    <div className="booking-page">
      <div className="booking-container">
        <h1>Book Your Service</h1>
        
        {/* Progress Steps */}
        <div className="booking-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Select Service</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Choose Date & Time</span>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Confirm Details</span>
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="step-content">
            <h2>Selected Service</h2>
            <div className="service-card">
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-meta">
                <span className="price">${service.price}</span>
                <span className="duration">
                  <ClockCircleOutlined /> {service.duration}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Additional Notes (Optional)</label>
              <textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                placeholder="Any special instructions for the cleaner?"
                rows="4"
              />
            </div>

            <div className="step-actions">
              <button className="btn-primary" onClick={handleNext}>
                Continue to Date & Time
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 2 && (
          <div className="step-content">
            <h2>Select Date & Time</h2>
            
            <div className="date-section">
              <h3><CalendarOutlined /> Available Dates</h3>
              <div className="date-grid">
                {availableDates.map(date => (
                  <button
                    key={date}
                    className={`date-btn ${bookingData.date === date ? 'selected' : ''}`}
                    onClick={() => setBookingData({...bookingData, date})}
                  >
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </button>
                ))}
              </div>
            </div>

            {bookingData.date && (
              <div className="time-section">
                <h3><ClockCircleOutlined /> Available Times</h3>
                <div className="time-grid">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      className={`time-btn ${bookingData.time === time ? 'selected' : ''}`}
                      onClick={() => setBookingData({...bookingData, time})}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="step-actions">
              <button className="btn-secondary" onClick={handleBack}>
                Back
              </button>
              <button 
                className="btn-primary" 
                onClick={handleNext}
                disabled={!bookingData.date || !bookingData.time}
              >
                Continue to Confirm
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="step-content">
            <h2>Confirm Your Booking</h2>
            
            <div className="confirmation-details">
              <div className="detail-row">
                <span className="detail-label">Service:</span>
                <span className="detail-value">{service.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date(bookingData.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{bookingData.time}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Price:</span>
                <span className="detail-value price">${service.price}</span>
              </div>
              {bookingData.notes && (
                <div className="detail-row">
                  <span className="detail-label">Notes:</span>
                  <span className="detail-value">{bookingData.notes}</span>
                </div>
              )}
            </div>

            <div className="terms">
              <input type="checkbox" id="terms" />
              <label htmlFor="terms">
                I agree to the <a href="/terms">Terms and Conditions</a> and <a href="/privacy">Privacy Policy</a>
              </label>
            </div>

            <div className="step-actions">
              <button className="btn-secondary" onClick={handleBack}>
                Back
              </button>
              <button className="btn-primary" onClick={handleBooking}>
                Confirm Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage; // <-- THIS IS CRITICAL!