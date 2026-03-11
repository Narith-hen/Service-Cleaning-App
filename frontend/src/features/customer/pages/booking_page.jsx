import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Image as ImageIcon,
  MapPin,
  Minus,
  Plus,
  Search,
  UploadCloud
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import summaryImage from '../../../assets/image.png';
import '../../../styles/customer/booking.scss';

const hourOptions = ['08 AM', '09 AM', '10 AM', '11 AM', '12 PM', '01 PM', '02 PM', '03 PM'];
const minuteOptions = ['00', '15', '30', '45'];
const durationOptions = ['2 Hours', '2.5 Hours', '3 Hours', '3.5 Hours', '4 Hours'];

const BookingPage = () => {
  const navigate = useNavigate();
  const locationHook = useLocation();
  const inputRef = useRef(null);
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState([]);
  const [preferredDate, setPreferredDate] = useState('');
  const [startHour, setStartHour] = useState(hourOptions[2]);
  const [startMinute, setStartMinute] = useState(minuteOptions[0]);
  const [duration, setDuration] = useState(durationOptions[3]);

  const onFileChange = (fileList) => {
    const nextFiles = Array.from(fileList || []).slice(0, 10);
    setFiles(nextFiles);
  };

  const handleDropzoneKey = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const stateService = locationHook.state?.service || locationHook.state || null;
  const storedService = (() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('selectedService') || 'null');
    } catch (error) {
      return null;
    }
  })();
  const selectedService = stateService || storedService;
  const serviceTitle = selectedService?.title || 'School Cleaning';
  const serviceDescription =
    selectedService?.description ||
    'A comprehensive scrub for your entire home, focusing on often-neglected areas. Ideal for refreshing your space or preparing for special occasions.';
  const serviceImage = selectedService?.image || summaryImage;

  useEffect(() => {
    if (!stateService) return;
    if (!(stateService?.title || stateService?.description || stateService?.image)) return;
    try {
      localStorage.setItem('selectedService', JSON.stringify(stateService));
    } catch (error) {
      // Ignore storage failures (private mode, quotas).
    }
  }, [stateService]);

  return (
    <div className="booking-page-v2">
      <div className="booking-request-card">
        <header className="booking-request-header">
          <h1>Request a Cleaning</h1>
        </header>

        <section className="booking-service-summary">
          <div className="summary-thumb">
            <img src={serviceImage} alt={serviceTitle} loading="lazy" />
          </div>
          <div className="summary-info">
            <h2>{serviceTitle}</h2>
            <p>{serviceDescription}</p>
          </div>
        </section>

        <section className="booking-section">
          <div className="section-heading">
            <span className="section-dot" aria-hidden>
              <Check size={12} />
            </span>
            <h3>Search Cleaning Location</h3>
          </div>
          <div className="input-shell">
            <Search size={16} />
            <input
              type="text"
              placeholder="123 Harmony Lane, Bright City"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="map-shell" aria-label="map-preview">
            <div className="map-actions" aria-hidden>
              <button type="button">
                <Plus size={14} />
              </button>
              <button type="button">
                <Minus size={14} />
              </button>
            </div>
            <div className="map-badge">
              <MapPin size={12} />
              Address Verified
            </div>
          </div>
        </section>

        <section className="booking-section">
          <div className="section-heading">
            <span className="section-dot" aria-hidden>
              <Check size={12} />
            </span>
            <h3>Share Photos of Your Space</h3>
          </div>
          <p className="section-subtitle">
            Help your cleaner understand specific needs by uploading photos of areas that require extra attention.
          </p>
          <div
            className="upload-dropzone"
            onClick={() => inputRef.current?.click()}
            onKeyDown={handleDropzoneKey}
            role="button"
            tabIndex={0}
          >
            <div className="upload-icon" aria-hidden>
              <UploadCloud size={18} />
            </div>
            <h4>Upload cleaning</h4>
            <p>Drag and drop images here, or click to browse files</p>
            <div className="upload-previews" aria-hidden>
              <span>
                <ImageIcon size={14} />
              </span>
              <span>
                <ImageIcon size={14} />
              </span>
              <span>
                <ImageIcon size={14} />
              </span>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => onFileChange(e.target.files)}
            />
          </div>
          {files.length > 0 && (
            <p className="upload-count">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </p>
          )}
        </section>

        <section className="booking-section">
          <div className="section-heading">
            <span className="section-dot" aria-hidden>
              <Check size={12} />
            </span>
            <h3>Your Detailed Cleaning Brief</h3>
          </div>
          <label className="field-label" htmlFor="cleaning-notes">
            Specific Instructions &amp; Notes
          </label>
          <textarea
            id="cleaning-notes"
            placeholder="Describe what you need..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </section>

        <section className="booking-section">
          <div className="section-heading">
            <span className="section-dot" aria-hidden>
              <Check size={12} />
            </span>
            <h3>Select Date and Time</h3>
          </div>
          <div className="form-field">
            <label htmlFor="preferred-date">Preferred Date</label>
            <input
              id="preferred-date"
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
            />
          </div>
          <div className="time-grid">
            <div className="form-field">
              <label htmlFor="start-hour">Start Time (Hour)</label>
              <select id="start-hour" value={startHour} onChange={(e) => setStartHour(e.target.value)}>
                {hourOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="start-minute">Start Time (Minute)</label>
              <select id="start-minute" value={startMinute} onChange={(e) => setStartMinute(e.target.value)}>
                {minuteOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="cleaning-duration">Cleaning Duration</label>
              <select id="cleaning-duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
                {durationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <footer className="booking-actions">
          <button type="button" className="back-btn" onClick={() => navigate('/customer/dashboard')}>
            <ArrowLeft size={16} /> Back to Service
          </button>
          <button type="button" className="next-btn" onClick={() => navigate('/customer/bookings/matching')}>
            Confirm Booking <ArrowRight size={16} />
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BookingPage;
