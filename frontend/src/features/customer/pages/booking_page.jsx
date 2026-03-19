import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Image as ImageIcon,
  MapPin,
  Search,
  UploadCloud,
  X
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import summaryImage from '../../../assets/image.png';
import '../../../styles/customer/booking.scss';
import { formatDateParts } from '../../../utils/bookingSync';
import api from '../../../services/api';

const hourOptions = ['08 AM', '09 AM', '10 AM', '11 AM', '12 PM', '01 PM', '02 PM', '03 PM'];
const minuteOptions = ['00', '15', '30', '45'];
const timeOptions = hourOptions.flatMap((hour) => {
  const [clock, meridiem] = hour.split(' ');
  return minuteOptions.map((minute) => `${clock}:${minute} ${meridiem}`);
});
const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${apiHost}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const BookingPage = () => {
  const navigate = useNavigate();
  const locationHook = useLocation();
  const inputRef = useRef(null);
  const addressInputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const geocoderRef = useRef(null);
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const prevFilesLengthRef = useRef(0);
  const [preferredDate, setPreferredDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [loadingServices, setLoadingServices] = useState(false);
  const bookingTime = `${startTime} - ${endTime}`;
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapWarning, setMapWarning] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);
  const showKeyHint = typeof mapError === 'string' && mapError.startsWith('Missing Google Maps API key');

  const loadGoogleMaps = (apiKey, hostLabel) =>
    new Promise((resolve, reject) => {
      if (window.google?.maps?.Map) {
        resolve();
        return;
      }

      const handleReady = () => {
        if (window.google?.maps?.Map) {
          resolve();
          return;
        }
        reject(
          new Error(
            'Google Maps loaded but Map class is unavailable. Check API key permissions or script blockers.'
          )
        );
      };

      const existingScript = document.getElementById('google-maps-sdk');
      if (existingScript) {
        // If the cached script was loaded with a different key, replace it so the new key takes effect.
        const existingSrc = existingScript.getAttribute('src') || '';
        if (existingSrc.includes(apiKey)) {
          existingScript.addEventListener('load', handleReady);
          existingScript.addEventListener('error', () =>
            reject(
              new Error(
                `Google Maps failed to load (possible 401/403). Check API key, billing, and HTTP referrer for "${hostLabel}".`
              )
            )
          );
          return;
        }
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      window.__googleMapsInit = () => {
        delete window.__googleMapsInit;
        handleReady();
      };
      const encodedKey = encodeURIComponent(apiKey);
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodedKey}&libraries=places&v=weekly&callback=__googleMapsInit`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!window.__googleMapsInit) {
          handleReady();
        }
      };
      script.onerror = () =>
        reject(
          new Error(
            `Google Maps failed to load (possible 401/403). Check API key, billing, and HTTP referrer for "${hostLabel}".`
          )
        );
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

  useEffect(() => {
    setSelectedImages((prev) => {
      if (!files.length) return [];

      const maxIndex = files.length - 1;
      const sanitized = (Array.isArray(prev) ? prev : []).filter(
        (idx) => Number.isInteger(idx) && idx >= 0 && idx <= maxIndex
      );

      const prevLen = prevFilesLengthRef.current;
      const next = new Set(sanitized);

      if (next.size === 0) {
        for (let i = 0; i < files.length; i += 1) next.add(i);
      } else if (files.length > prevLen) {
        for (let i = prevLen; i < files.length; i += 1) next.add(i);
      }

      return Array.from(next).sort((a, b) => a - b);
    });

    prevFilesLengthRef.current = files.length;
  }, [files.length]);

  const handleImageSelect = (index) => {
    setSelectedImages((prev) => {
      const prevSet = new Set(Array.isArray(prev) ? prev : []);
      if (prevSet.has(index)) prevSet.delete(index);
      else prevSet.add(index);
      return Array.from(prevSet).sort((a, b) => a - b);
    });
  };

  const handleRemoveImage = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setSelectedImages((prev) =>
      (Array.isArray(prev) ? prev : [])
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i))
    );
    prevFilesLengthRef.current = Math.max(0, prevFilesLengthRef.current - 1);
  };

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

  useEffect (() => {
    if (!GOOGLE_MAPS_KEY) {
      setMapError('Missing Google Maps API key.');
      setIsMapReady(false);
      return;
    }

    let cancelled = false;
    const host = typeof window !== 'undefined' ? window.location.host : 'your-domain';
    const origin = typeof window !== 'undefined' ? window.location.origin : `https://${host}`;
    const pathHint = typeof window !== 'undefined' ? window.location.pathname : '';
    const handleAuthFailure = () => {
      if (cancelled) return;
      setMapError(
        `Google Maps authentication failed. Verify billing is enabled, the Maps JavaScript + Places APIs are enabled, and whitelist an HTTP referrer like "${origin}/*" (current path: "${pathHint}").`
      );
      setIsMapReady(false);
    };

    window.gm_authFailure = handleAuthFailure;
    loadGoogleMaps(GOOGLE_MAPS_KEY, host)
      .then(() => {
        if (!cancelled) {
          if (!window.google?.maps) {
            setMapError('Google Maps failed to initialize.');
            setIsMapReady(false);
            return;
          }
          if (!window.google?.maps?.places) {
            setMapWarning('Places API not available. Address autocomplete is disabled.');
          } else {
            setMapWarning('');
          }
          setMapError('');
          setIsMapReady(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMapError(error?.message || 'Unable to load Google Maps.');
          setIsMapReady(false);
        }
      });

    return () => {
      cancelled = true;
      if (window.gm_authFailure === handleAuthFailure) {
        delete window.gm_authFailure;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !window.google?.maps || !mapRef.current || mapInstanceRef.current) return;

    if (!window.google?.maps?.Map || !window.google?.maps?.Marker) {
      setMapError((prev) => prev || 'Google Maps is not available. Please refresh and try again.');
      setIsMapReady(false);
      return;
    }

    try {
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
      if (window.google?.maps?.Geocoder) {
        geocoderRef.current = new window.google.maps.Geocoder();
      }
    } catch (error) {
      setMapError(error?.message || 'Failed to initialize Google Maps.');
      setIsMapReady(false);
    }
  }, [isMapReady]);

  useEffect(() => {
    if (!isMapReady || !window.google?.maps || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const listener = map.addListener('click', (event) => {
      if (!event?.latLng) return;
      const position = event.latLng;
      if (markerRef.current) {
        markerRef.current.setPosition(position);
      }
      map.panTo(position);
      map.setZoom(16);
      setIsAddressVerified(true);

      if (geocoderRef.current) {
        geocoderRef.current.geocode({ location: position }, (results, status) => {
          if (status === 'OK' && results?.[0]?.formatted_address) {
            setAddress(results[0].formatted_address);
          }
        });
      }
    });

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
    };
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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapWarning('Geolocation is not supported by this browser.');
      return;
    }

    if (!isMapReady || !mapInstanceRef.current) {
      setMapWarning('Map is not ready yet.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        mapInstanceRef.current.panTo(coords);
        mapInstanceRef.current.setZoom(16);
        if (markerRef.current) {
          markerRef.current.setPosition(coords);
        }
        setIsAddressVerified(true);

        if (geocoderRef.current) {
          geocoderRef.current.geocode({ location: coords }, (results, status) => {
            if (status === 'OK' && results?.[0]?.formatted_address) {
              setAddress(results[0].formatted_address);
            }
          });
        }
      },
      () => {
        setMapWarning('Unable to access your current location.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
  const serviceTitle = (() => {
    const fromList = services.find((svc) => String(svc.id) === String(serviceId))?.title;
    return fromList || selectedService?.title || selectedService?.name || 'School Cleaning';
  })();
  const serviceDescription = (() => {
    const fromList = services.find((svc) => String(svc.id) === String(serviceId))?.description;
    return (
      fromList ||
      selectedService?.description ||
      'A comprehensive scrub for your entire home, focusing on often-neglected areas. Ideal for refreshing your space or preparing for special occasions.'
    );
  })();
  const serviceImage =
    toAbsoluteImageUrl(
      services.find((svc) => String(svc.id) === String(serviceId))?.image ||
        selectedService?.image ||
        ''
    ) || summaryImage;

  useEffect(() => {
    if (!stateService) return;
    if (!(stateService?.title || stateService?.description || stateService?.image)) return;
    try {
      localStorage.setItem('selectedService', JSON.stringify(stateService));
    } catch (error) {
      // Ignore storage failures (private mode, quotas).
    }
  }, [stateService]);

  // Fetch services so booking always references real DB items.
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const response = await api.get('/services', { params: { page: 1, limit: 50 } });
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        const mapped = rows.map((item, idx) => ({
          id: item.service_id || item.id || idx,
          title: item.name || `Service ${idx + 1}`,
          description: item.description || '',
          image: toAbsoluteImageUrl(item.images?.[0]?.image_url || item.image || '') || summaryImage,
          price: item.price || 0
        }));
        setServices(mapped);

        // Try to keep current selection; otherwise default to first.
        const incoming =
          selectedService?.service_id ||
          selectedService?.id ||
          (locationHook.state && (locationHook.state.service_id || locationHook.state.id));
        if (incoming && mapped.some((m) => Number(m.id) === Number(incoming))) {
          setServiceId(String(incoming));
        } else if (mapped[0]) {
          setServiceId(String(mapped[0].id));
        }
      } catch (error) {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmBooking = async () => {
    if (!preferredDate || !startTime || !endTime) {
      setStatusMessage({
        title: 'Missing details',
        message: 'Please select date, start time, and end time before confirming.',
        ago: ''
      });
      return;
    }

    // Basic auth guard to avoid silent 401s.
    const hasToken = (() => {
      try {
        const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
        return Boolean(savedUser?.token || localStorage.getItem('token'));
      } catch {
        return false;
      }
    })();
    if (!hasToken) {
      setStatusMessage({
        title: 'Sign in required',
        message: 'Please log in as a customer before booking.',
        ago: ''
      });
      navigate('/auth/login');
      return;
    }

    const parseTime = (timeString) => {
      const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return { hours: 0, minutes: 0 };
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = match[3].toUpperCase();
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    };

    const { hours, minutes } = parseTime(startTime);
    const bookingDate = new Date(preferredDate);
    bookingDate.setHours(hours, minutes, 0, 0);

    const selectedFromList = services.find((svc) => String(svc.id) === String(serviceId));
    const numericServiceId = selectedFromList ? Number(selectedFromList.id) : Number(serviceId);

    if (!serviceId || !Number.isFinite(numericServiceId)) {
      setStatusMessage({
        title: 'Service missing',
        message: 'Unable to identify the selected service. Please choose a valid service again.',
        ago: ''
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        booking_date: bookingDate.toISOString(),
        service_id: numericServiceId,
        address: address || 'Address pending',
        start_time: startTime,
        end_time: endTime
      };

      if (details && details.trim()) {
        payload.notes = details.trim();
      }

      const resp = await api.post('/bookings', payload);
      const bookingId = resp?.data?.data?.booking_id;

      if (bookingId) {
        try {
          localStorage.setItem('last_booking_id', String(bookingId));
          localStorage.setItem('last_booking_start_time', String(startTime || ''));
          localStorage.setItem('last_booking_service_title', String(serviceTitle || ''));
        } catch {
          /* ignore */
        }

        // upload images if any
        if (files.length) {
          const toBase64 = (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          const encoded = await Promise.all(files.map((f) => toBase64(f)));
          await api.post(`/bookings/${bookingId}/images`, { images: encoded });
        }
      }

      const { month, day } = formatDateParts(preferredDate);
      setStatusMessage({
        title: 'Request submitted',
        message: `We are matching you with a cleaner. Request date: ${month} ${day}, ${startTime} - ${endTime}.`,
        ago: 'just now'
      });
      navigate('/customer/bookings/matching', {
        state: {
          bookingId: bookingId ? String(bookingId) : null,
          serviceTitle,
          startTime
        }
      });
    } catch (error) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message;
      const validationMessages = Array.isArray(error?.response?.data?.errors)
        ? error.response.data.errors.map((e) => e.msg).join(', ')
        : null;
      setStatusMessage({
        title: 'Failed to book',
        message:
          validationMessages ||
          apiMessage ||
          (status ? `Request failed with status ${status}` : 'Please try again.'),
        ago: ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-page-v2 customer-motion-disabled">
      <div className="booking-request-card" data-customer-reveal data-customer-panel>
        <header className="booking-request-header" data-customer-reveal style={{ '--customer-reveal-delay': 0 }}>
          <p>Service Booking</p>
        </header>

        <section className="booking-service-summary" data-customer-reveal style={{ '--customer-reveal-delay': 1 }}>
          <div className="summary-thumb">
            <img src={serviceImage} alt={serviceTitle} loading="lazy" />
          </div>
          <div className="summary-info">
            <h2>{serviceTitle}</h2>
            <p>{serviceDescription}</p>
          </div>
          {previewUrls.length > 0 && (
            <div className="uploaded-images-display">
              <h4>Your Uploaded Photos ({selectedImages.length})</h4>
              <div className="uploaded-images-grid">
                {previewUrls.map((preview, index) => (
                  <div
                    key={index}
                    className={`uploaded-image-thumb ${selectedImages.includes(index) ? 'selected' : ''}`}
                  >
                    <img src={preview} alt={`Uploaded ${index + 1}`} />
                    {selectedImages.includes(index) && (
                      <div className="thumb-selected-badge">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="booking-section" data-customer-reveal style={{ '--customer-reveal-delay': 1 }}>
          <div className="section-heading">
            <span className="section-dot" aria-hidden>
              1
            </span>
            <h3>Select Service &amp; Add Location</h3>
          </div>
          <div className="form-field">
            <label htmlFor="service-select">Select Service</label>
            <select
              id="service-select"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              disabled={loadingServices || services.length === 0}
            >
              {loadingServices && <option>Loading services...</option>}
              {!loadingServices && services.length === 0 && <option>No services available</option>}
              {!loadingServices &&
                services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.title}
                  </option>
                ))}
            </select>
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
            <button type="button" className="locate-btn" onClick={handleUseCurrentLocation} data-customer-button>
              Use current location
            </button>
          </div>
          <div className="map-shell map-shell--google" aria-label="map-preview">
            {mapError ? (
              <div className="map-fallback">
                <p>{mapError}</p>
                {showKeyHint && <p>Add `VITE_GOOGLE_MAPS_API_KEY` to your frontend `.env` file.</p>}
              </div>
            ) : !isMapReady ? (
              <div className="map-fallback">
                <p>Loading map...</p>
              </div>
            ) : (
              <>
                <div className="map-canvas" ref={mapRef} />
                {mapWarning && (
                  <div className="map-warning" role="status">
                    {mapWarning}
                  </div>
                )}
              </>
            )}
            {isAddressVerified && (
              <div className="map-badge">
                <MapPin size={12} />
                Address Verified
              </div>
            )}
          </div>
        </section>

        <section className="booking-section" data-customer-reveal style={{ '--customer-reveal-delay': 2 }}>
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
            <>
              <p className="upload-count">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
              <div className="image-previews">
                {previewUrls.map((preview, index) => (
                  <div
                    key={index}
                    className={`image-preview-item ${selectedImages.includes(index) ? 'selected' : ''}`}
                    onClick={() => handleImageSelect(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleImageSelect(index);
                      }
                    }}
                  >
                    <img src={preview} alt={`Upload ${index + 1}`} />
                    <div className="image-overlay">
                      {selectedImages.includes(index) ? (
                        <Check size={20} className="check-icon" />
                      ) : (
                        <span className="select-hint">Click to select</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="selection-info">
                {selectedImages.length} of {files.length} images selected
              </p>
            </>
          )}
        </section>

        <section className="booking-section" data-customer-reveal style={{ '--customer-reveal-delay': 3 }}>
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

        <section className="booking-section" data-customer-reveal style={{ '--customer-reveal-delay': 4 }}>
          <div className="section-heading">
            <span className="section-dot" aria-hidden>
              4
            </span>
            <h3>Select Date and Time</h3>
          </div>
          {statusMessage && (
            <div className="booking-status-banner" role="status">
              <p>
                <strong>{statusMessage.title}</strong>
              </p>
              <p>{statusMessage.message}</p>
              {statusMessage.ago && <small>{statusMessage.ago}</small>}
            </div>
          )}
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
                <option value="" disabled>
                  Select start time
                </option>
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
                <option value="" disabled>
                  Select end time
                </option>
                {timeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <footer className="booking-actions" data-customer-reveal style={{ '--customer-reveal-delay': 4 }}>
          <button type="button" className="back-btn" onClick={() => navigate('/customer/dashboard')} data-customer-button>
            <ArrowLeft size={16} /> Back to Service
          </button>
          <button type="button" className="next-btn" onClick={handleConfirmBooking} disabled={submitting} data-customer-button>
            {submitting ? 'Submitting...' : 'Confirm Booking'} <ArrowRight size={16} />
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BookingPage;
