import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Image as ImageIcon,
  MapPin,
  Search,
  UploadCloud
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import summaryImage from '../../../assets/image.png';
import '../../../styles/customer/booking.scss';

const hourOptions = ['08 AM', '09 AM', '10 AM', '11 AM', '12 PM', '01 PM', '02 PM', '03 PM'];
const minuteOptions = ['00', '15', '30', '45'];
const timeOptions = hourOptions.flatMap((hour) => {
  const [clock, meridiem] = hour.split(' ');
  return minuteOptions.map((minute) => `${clock}:${minute} ${meridiem}`);
});
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const BookingPage = () => {
  const navigate = useNavigate();
  const locationHook = useLocation();
  const inputRef = useRef(null);
  const addressInputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [preferredDate, setPreferredDate] = useState('');
  const [startTime, setStartTime] = useState(timeOptions[8]);
  const [endTime, setEndTime] = useState(timeOptions[12]);
  const bookingTime = `${startTime} - ${endTime}`;
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [mapError, setMapError] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  const loadGoogleMaps = (apiKey) =>
    new Promise((resolve, reject) => {
      if (window.google?.maps?.places) {
        resolve();
        return;
      }

      const existingScript = document.getElementById('google-maps-sdk');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load')));
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.appendChild(script);
    });

  const onFileChange = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    setFiles((prevFiles) => {
      const nextFiles = [...prevFiles, ...incoming];
      const unique = [];
      const seen = new Set();

      nextFiles.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(file);
      });

      return unique.slice(0, 30);
    });
  };

  useEffect(() => {
    if (!files.length) {
      setPreviewUrls([]);
      return;
    }

    const nextUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleDropzoneKey = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    onFileChange(event.dataTransfer?.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) {
      setMapError('Missing Google Maps API key.');
      setIsMapReady(false);
      return;
    }

    let cancelled = false;
    loadGoogleMaps(GOOGLE_MAPS_KEY)
      .then(() => {
        if (!cancelled) {
          setMapError('');
          setIsMapReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMapError('Unable to load Google Maps.');
          setIsMapReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !window.google?.maps || !mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = { lat: 11.5564, lng: 104.9282 };
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false
    });

    mapInstanceRef.current = map;
    markerRef.current = new window.google.maps.Marker({
      map,
      position: defaultCenter
    });
  }, [isMapReady]);

  useEffect(() => {
    if (!isMapReady || !window.google?.maps?.places || !addressInputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      fields: ['formatted_address', 'geometry']
    });

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const formattedAddress = place?.formatted_address || addressInputRef.current?.value || '';
      setAddress(formattedAddress);

      if (place?.geometry?.location && mapInstanceRef.current) {
        mapInstanceRef.current.panTo(place.geometry.location);
        mapInstanceRef.current.setZoom(16);
        if (markerRef.current) {
          markerRef.current.setPosition(place.geometry.location);
        }
        setIsAddressVerified(true);
      } else {
        setIsAddressVerified(false);
      }
    });

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
    };
  }, [isMapReady]);

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
          <p>Service Booking</p>
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
              1
            </span>
            <h3>Search Cleaning Location</h3>
          </div>
          <div className="input-shell">
            <Search size={16} />
            <input
              type="text"
              placeholder="123 Harmony Lane, Bright City"
              value={address}
              ref={addressInputRef}
              onChange={(e) => {
                setAddress(e.target.value);
                setIsAddressVerified(false);
              }}
            />
          </div>
          <div className="map-shell map-shell--google" aria-label="map-preview">
            {mapError ? (
              <div className="map-fallback">
                <p>{mapError}</p>
                <p>Add `VITE_GOOGLE_MAPS_API_KEY` to your frontend .env file.</p>
              </div>
            ) : !isMapReady ? (
              <div className="map-fallback">
                <p>Loading map...</p>
              </div>
            ) : (
              <div className="map-canvas" ref={mapRef} />
            )}
            {isAddressVerified && (
              <div className="map-badge">
                <MapPin size={12} />
                Address Verified
              </div>
            )}
          </div>
        </section>

        <section className="booking-section">
          <div className="section-heading">
            <span className="section-dot" aria-hidden>
              2
            </span>
            <h3>Share Photos of Your Space</h3>
          </div>
          <p className="section-subtitle">
            Help your cleaner understand specific needs by uploading photos of areas that require extra attention.
          </p>
          <div
            className={`upload-dropzone${previewUrls.length ? ' upload-dropzone--active' : ''}`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={handleDropzoneKey}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
          >
            <div className="upload-icon" aria-hidden>
              <UploadCloud size={18} />
            </div>
            <h4>Upload cleaning</h4>
            <p>Drag and drop images here, or click to browse files (up to 30)</p>
            {previewUrls.length === 0 ? (
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
            ) : (
              <div className="upload-previews upload-previews--filled">
                {previewUrls.map((src, index) => (
                  <div className="upload-thumb" key={`${files[index]?.name || 'image'}-${index}`}>
                    <img src={src} alt={files[index]?.name || `Upload ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
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
              3
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
              4
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
              <label htmlFor="start-time">Start Time (Hour &amp; Minute)</label>
              <select id="start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                {timeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="end-time">End Time (Hour &amp; Minute)</label>
              <select id="end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                {timeOptions.map((option) => (
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
