import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  PictureOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  LoadingOutlined,
  CloudUploadOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import summaryImage from '../../../assets/image.png';
import '../../../styles/customer/booking.scss';
import { formatDateParts } from '../../../utils/bookingSync';
import api from '../../../services/api';

const hourOptions = ['08 AM', '09 AM', '10 AM', '11 AM', '12 PM', '01 PM', '02 PM', '03 PM'];
const minuteOptions = ['00', '15', '30', '45'];
const MAX_BOOKING_IMAGES = 10;
const timeOptions = hourOptions.flatMap((hour) => {
  const [clock, meridiem] = hour.split(' ');
  return minuteOptions.map((minute) => `${clock}:${minute} ${meridiem}`);
});
const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const KNOWN_LOCATION_MATCHES = [
  {
    label: 'Passerelles Numeriques Cambodia (PNC)',
    geocodeQuery: 'Passerelles numeriques Cambodia (PNC), Street 371, Phnom Penh, Cambodia',
    lat: 11.55086,
    lng: 104.88308,
    radiusMeters: 250
  }
];

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
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const knownLocationCoordsCacheRef = useRef({});
  const mapWarningTimeoutRef = useRef(null);
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const prevFilesLengthRef = useRef(0);
  const [preferredDate, setPreferredDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [loadingServices, setLoadingServices] = useState(false);
  const bookingTime = startTime;
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapWarning, setMapWarning] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const showKeyHint = typeof mapError === 'string' && mapError.startsWith('Missing Google Maps API key');
  const fallbackMapQuery = selectedCoords
    ? `${Number(selectedCoords.lat).toFixed(6)},${Number(selectedCoords.lng).toFixed(6)}`
    : (address || '').trim() || 'Phnom Penh, Cambodia';
  const fallbackMapSrc = `https://maps.google.com/maps?output=embed&q=${encodeURIComponent(fallbackMapQuery)}`;

  const clearMapWarning = () => {
    if (mapWarningTimeoutRef.current) {
      clearTimeout(mapWarningTimeoutRef.current);
      mapWarningTimeoutRef.current = null;
    }
    setMapWarning('');
  };

  const showMapWarning = (message, duration = 4000) => {
    if (mapWarningTimeoutRef.current) {
      clearTimeout(mapWarningTimeoutRef.current);
    }
    setMapWarning(message);
    if (duration > 0) {
      mapWarningTimeoutRef.current = window.setTimeout(() => {
        setMapWarning('');
        mapWarningTimeoutRef.current = null;
      }, duration);
    }
  };

  const updateMapPosition = (position) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(position);
    mapInstanceRef.current.setZoom(16);
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    }
  };

  const formatCoordinateAddress = (coords) =>
    `Current location (${Number(coords?.lat || 0).toFixed(5)}, ${Number(coords?.lng || 0).toFixed(5)})`;

  const buildLocationDisplayLabel = ({ name = '', formattedAddress = '' }) => {
    const trimmedName = String(name || '').trim();
    const trimmedAddress = String(formattedAddress || '').trim();

    return trimmedName || trimmedAddress;
  };

  const getDistanceInMeters = (fromCoords, toCoords) => {
    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    const latDelta = toRadians(Number(toCoords.lat) - Number(fromCoords.lat));
    const lngDelta = toRadians(Number(toCoords.lng) - Number(fromCoords.lng));
    const startLat = toRadians(Number(fromCoords.lat));
    const endLat = toRadians(Number(toCoords.lat));

    const haversine =
      Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
      Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

    return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  };

  const getKnownLocationMatch = (coords) => {
    const lat = Number(coords?.lat);
    const lng = Number(coords?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return KNOWN_LOCATION_MATCHES.find((locationMatch) => (
      getDistanceInMeters({ lat, lng }, locationMatch) <= locationMatch.radiusMeters
    ));
  };

  const getKnownLocationLabel = (coords) => getKnownLocationMatch(coords)?.label || '';

  const fetchKnownLocationCoords = async (locationMatch) => {
    if (!locationMatch) return null;

    const cachedCoords = knownLocationCoordsCacheRef.current[locationMatch.label];
    if (cachedCoords) return cachedCoords;

    const fallbackCoords = {
      lat: Number(locationMatch.lat),
      lng: Number(locationMatch.lng)
    };

    if (!GOOGLE_MAPS_KEY) {
      knownLocationCoordsCacheRef.current[locationMatch.label] = fallbackCoords;
      return fallbackCoords;
    }

    try {
      const query = locationMatch.geocodeQuery || locationMatch.label;

      if (geocoderRef.current) {
        const geocodedCoords = await new Promise((resolve, reject) => {
          geocoderRef.current.geocode({ address: query }, (results, status) => {
            if (status === 'OK' && results?.[0]?.geometry?.location) {
              resolve({
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
              });
              return;
            }

            reject(new Error(status || 'UNKNOWN'));
          });
        });

        knownLocationCoordsCacheRef.current[locationMatch.label] = geocodedCoords;
        return geocodedCoords;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${encodeURIComponent(GOOGLE_MAPS_KEY)}`
      );
      if (!response.ok) {
        knownLocationCoordsCacheRef.current[locationMatch.label] = fallbackCoords;
        return fallbackCoords;
      }

      const data = await response.json();
      const location = data?.results?.[0]?.geometry?.location;
      const resolvedCoords = location?.lat && location?.lng
        ? { lat: Number(location.lat), lng: Number(location.lng) }
        : fallbackCoords;

      knownLocationCoordsCacheRef.current[locationMatch.label] = resolvedCoords;
      return resolvedCoords;
    } catch {
      knownLocationCoordsCacheRef.current[locationMatch.label] = fallbackCoords;
      return fallbackCoords;
    }
  };

  const scoreGeocodeResult = (result) => {
    const types = result?.types || [];
    const hasType = (type) => types.includes(type);

    let score = 0;
    if (hasType('point_of_interest') || hasType('establishment')) score += 100;
    if (hasType('premise')) score += 90;
    if (hasType('subpremise')) score += 80;
    if (hasType('street_address')) score += 50;
    if (hasType('route')) score += 30;
    if (hasType('plus_code')) score -= 25;
    if (hasType('political')) score -= 10;

    return score;
  };

  const pickPreferredGeocodeResult = (results) => {
    if (!Array.isArray(results) || !results.length) return null;

    return results.reduce((bestResult, currentResult) => {
      if (!bestResult) return currentResult;
      return scoreGeocodeResult(currentResult) > scoreGeocodeResult(bestResult) ? currentResult : bestResult;
    }, null);
  };

  const updateSelectedLocation = ({ coords, nextAddress = '', verified = true }) => {
    if (!coords || !Number.isFinite(Number(coords.lat)) || !Number.isFinite(Number(coords.lng))) {
      setSelectedCoords(null);
      setIsAddressVerified(false);
      return;
    }

    const normalizedCoords = {
      lat: Number(coords.lat),
      lng: Number(coords.lng)
    };

    setSelectedCoords(normalizedCoords);
    setIsAddressVerified(Boolean(verified));
    updateMapPosition(normalizedCoords);

    if (typeof nextAddress === 'string' && nextAddress.trim()) {
      setAddress(nextAddress.trim());
      return;
    }

    setAddress(formatCoordinateAddress(normalizedCoords));
  };

  const fetchPlaceNameFromPlaceId = (placeId, fallbackAddress = '') =>
    new Promise((resolve) => {
      if (!placeId || !placesServiceRef.current) {
        resolve(fallbackAddress);
        return;
      }

      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ['name', 'formatted_address']
        },
        (place, status) => {
          if (status === 'OK' && place) {
            resolve(
              buildLocationDisplayLabel({
                name: place?.name,
                formattedAddress: place?.formatted_address || fallbackAddress
              })
            );
            return;
          }

          resolve(fallbackAddress);
        }
      );
    });

  const fetchNearbyPlaceLabel = (coords) =>
    new Promise((resolve) => {
      if (!coords || !placesServiceRef.current || !window.google?.maps?.places) {
        resolve('');
        return;
      }

      placesServiceRef.current.nearbySearch(
        {
          location: coords,
          radius: 120,
          type: 'establishment'
        },
        (results, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !Array.isArray(results) || !results.length) {
            resolve('');
            return;
          }

          const bestMatch = results.find((result) => String(result?.name || '').trim())
            || results[0];

          resolve(
            buildLocationDisplayLabel({
              name: bestMatch?.name,
              formattedAddress: bestMatch?.vicinity || ''
            })
          );
        }
      );
    });

  const fetchReverseGeocodeAddress = async (coords) => {
    if (!GOOGLE_MAPS_KEY) return '';

    const knownLocationLabel = getKnownLocationLabel(coords);
    if (knownLocationLabel) return knownLocationLabel;

    try {
      const lat = Number(coords?.lat);
      const lng = Number(coords?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(`${lat},${lng}`)}&key=${encodeURIComponent(GOOGLE_MAPS_KEY)}`
      );

      if (!response.ok) return '';

      const data = await response.json();
      if (data?.status !== 'OK' || !Array.isArray(data?.results) || !data.results[0]) {
        return '';
      }

      const preferredResult = pickPreferredGeocodeResult(data.results);
      const readableAddress = formatReadableGeocodeAddress(preferredResult);
      const nearbyPlaceLabel = await fetchNearbyPlaceLabel(coords);

      if (nearbyPlaceLabel) {
        return nearbyPlaceLabel;
      }

      if (preferredResult?.place_id) {
        return fetchPlaceNameFromPlaceId(preferredResult.place_id, readableAddress);
      }

      return readableAddress;
    } catch {
      return '';
    }
  };

  const reverseGeocodePosition = (coords) =>
    new Promise((resolve) => {
      const knownLocationLabel = getKnownLocationLabel(coords);
      if (knownLocationLabel) {
        resolve(knownLocationLabel);
        return;
      }

      if (!geocoderRef.current) {
        fetchReverseGeocodeAddress(coords).then(resolve);
        return;
      }

      geocoderRef.current.geocode({ location: coords }, async (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const preferredResult = pickPreferredGeocodeResult(results);
          const readableAddress = formatReadableGeocodeAddress(preferredResult);
          const nearbyPlaceLabel = await fetchNearbyPlaceLabel(coords);
          if (nearbyPlaceLabel) {
            resolve(nearbyPlaceLabel);
            return;
          }
          if (preferredResult?.place_id) {
            resolve(await fetchPlaceNameFromPlaceId(preferredResult.place_id, readableAddress));
            return;
          }
          resolve(readableAddress);
          return;
        }

        fetchReverseGeocodeAddress(coords).then(resolve);
      });
    });

  const getCurrentPosition = (options) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

  const formatReadableGeocodeAddress = (result) => {
    if (!result) return '';

    const addressComponents = result.address_components || [];
    const getComponent = (types) => {
      const component = addressComponents.find((entry) => entry.types.some((type) => types.includes(type)));
      return component?.long_name || component?.short_name || '';
    };

    const placeName = getComponent(['point_of_interest', 'establishment', 'premise', 'subpremise']);
    const locality = getComponent(['locality', 'sublocality', 'administrative_area_level_2']);
    const streetNumber = getComponent(['street_number']);
    const streetName = getComponent(['route']);
    const city = getComponent(['administrative_area_level_1']);

    const routeLine = streetName
      ? (streetNumber ? `${streetName} ${streetNumber}` : streetName)
      : '';

    if (placeName) {
      return [...new Set([placeName, routeLine, locality || city].filter(Boolean))].join(', ');
    }

    let readableAddress = locality || city || '';

    if (streetName) {
      readableAddress = readableAddress
        ? `${readableAddress}, ${streetNumber ? `${streetName} ${streetNumber}` : streetName}`
        : streetNumber
          ? `${streetName} ${streetNumber}`
          : streetName;
    }

    return readableAddress || result.formatted_address || '';
  };

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

      return unique.slice(0, MAX_BOOKING_IMAGES);
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
            if (mapWarningTimeoutRef.current) {
              clearTimeout(mapWarningTimeoutRef.current);
            }
            setMapWarning('Places API not available. Address autocomplete is disabled.');
            mapWarningTimeoutRef.current = window.setTimeout(() => {
              setMapWarning('');
              mapWarningTimeoutRef.current = null;
            }, 5000);
          } else {
            if (mapWarningTimeoutRef.current) {
              clearTimeout(mapWarningTimeoutRef.current);
              mapWarningTimeoutRef.current = null;
            }
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
    return () => {
      if (mapWarningTimeoutRef.current) {
        clearTimeout(mapWarningTimeoutRef.current);
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
      if (window.google?.maps?.places?.PlacesService) {
        placesServiceRef.current = new window.google.maps.places.PlacesService(map);
      }
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
      updateSelectedLocation({
        coords: {
          lat: position.lat(),
          lng: position.lng()
        },
        verified: true
      });

      reverseGeocodePosition({
        lat: position.lat(),
        lng: position.lng()
      }).then((resolvedAddress) => {
        if (resolvedAddress) {
          setAddress(resolvedAddress);
        }
      });
    });

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
    };
  }, [isMapReady]);

  useEffect(() => {
    if (!isMapReady || !window.google?.maps?.places || !addressInputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      fields: ['name', 'formatted_address', 'geometry', 'place_id']
    });

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const formattedAddress = place?.formatted_address || addressInputRef.current?.value || '';
      const displayAddress = buildLocationDisplayLabel({
        name: place?.name,
        formattedAddress
      });

      if (place?.geometry?.location && mapInstanceRef.current) {
        updateSelectedLocation({
          coords: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          },
          nextAddress: displayAddress || formattedAddress,
          verified: true
        });
      } else {
        setAddress(displayAddress || formattedAddress);
        setSelectedCoords(null);
        setIsAddressVerified(false);
      }
    });

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
    };
  }, [isMapReady]);

  useEffect(() => {
    if (!selectedCoords || !isMapReady || !mapInstanceRef.current) return;
    updateMapPosition(selectedCoords);
  }, [selectedCoords, isMapReady]);

  const handleUseCurrentLocation = async () => {
    if (isLocating) return;

    if (!navigator.geolocation) {
      showMapWarning('Geolocation is not supported by this browser.');
      return;
    }

    clearMapWarning();
    setIsLocating(true);

    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission?.state === 'denied') {
          setIsLocating(false);
          showMapWarning('Location access was blocked. Allow it in your browser and try again.', 5000);
          return;
        }
      }
    } catch {
      // Permissions API is optional; continue with direct lookup.
    }

    const geolocationAttempts = [
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
    ];

    let resolvedPosition = null;
    let lastError = null;

    for (const options of geolocationAttempts) {
      try {
        resolvedPosition = await getCurrentPosition(options);
        if (resolvedPosition) break;
      } catch (error) {
        lastError = error;
        if (error?.code === 1) break;
      }
    }

    if (!resolvedPosition) {
      setIsLocating(false);
      const nextWarning =
        lastError?.code === 1
          ? 'Location access was blocked. Allow it in your browser and try again.'
          : lastError?.code === 3
            ? 'Location request timed out. Turn on device location, then try again.'
            : 'Unable to access your current location right now.';
      showMapWarning(nextWarning, 5000);
      return;
    }

    const coords = {
      lat: resolvedPosition.coords.latitude,
      lng: resolvedPosition.coords.longitude
    };
    const knownLocationMatch = getKnownLocationMatch(coords);
    const snappedCoords = knownLocationMatch
      ? await fetchKnownLocationCoords(knownLocationMatch)
      : coords;
    const knownLocationLabel = knownLocationMatch?.label || '';

    updateSelectedLocation({
      coords: snappedCoords,
      nextAddress: knownLocationLabel || 'Finding nearby address...',
      verified: true
    });

    const resolvedAddress = await reverseGeocodePosition(snappedCoords);
    setIsLocating(false);

    if (resolvedAddress) {
      clearMapWarning();
      setAddress(resolvedAddress);
      return;
    }

    setAddress(formatCoordinateAddress(coords));
    showMapWarning('Using your current coordinates while the address loads.', 3500);
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
    try {
      if (!stateService) return;
      if (!(stateService?.title || stateService?.description || stateService?.image)) return;
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
    if (!preferredDate || !startTime) {
      setStatusMessage({
        title: 'Missing details',
        message: 'Please select date and start time before confirming.',
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
      };

      if (details && details.trim()) {
        payload.notes = details.trim();
      }

      if (selectedCoords) {
        payload.latitude = Number(selectedCoords.lat);
        payload.longitude = Number(selectedCoords.lng);
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
        if (bookingId && files.length) {
          const formData = new FormData();
          const filesToUpload = selectedImages.length
            ? selectedImages.map((index) => files[index]).filter(Boolean)
            : files;

          filesToUpload.forEach((file) => {
            formData.append('images', file);
          });

          await api.post(`/bookings/${bookingId}/images`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        }
      }

      const { month, day } = formatDateParts(preferredDate);
      setStatusMessage({
        title: 'Request submitted',
        message: `We are matching you with a cleaner. Request date: ${month} ${day}, ${startTime}.`,
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
              {/* <h4>Your Uploaded Photos ({selectedImages.length})</h4> */}
              <div className="uploaded-images-grid">
                {previewUrls.map((preview, index) => (
                  <div
                    key={index}
            
                  >
                    <button
                      type="button"
                      className="uploaded-thumb-remove-btn"
                      aria-label={`Remove uploaded photo ${index + 1}`}
                      onClick={() => handleRemoveImage(index)}
                    >
                      <CloseOutlined />
                    </button>
                    {selectedImages.includes(index) && (
                      <div className="thumb-selected-badge">
                        <CheckOutlined />
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
            <h3>Add Location</h3>
          </div>
          <div className="input-shell">
            <SearchOutlined />
            <input
              type="text"
              placeholder="123 Harmony Lane, Bright City"
              value={address}
              ref={addressInputRef}
              onChange={(e) => {
                setAddress(e.target.value);
                setSelectedCoords(null);
                setIsAddressVerified(false);
              }}
            />
            <button
              type="button"
              className={`locate-btn${isLocating ? ' locate-btn--loading' : ''}`}
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              aria-busy={isLocating}
              data-customer-button
            >
              {isLocating ? <LoadingOutlined spin /> : null}
              {isLocating ? 'Finding location...' : 'Use current location'}
            </button>
          </div>
          <div className="map-shell map-shell--google" aria-label="map-preview">
            {mapError ? (
              <div className="map-fallback map-fallback--embed">
                <p>{mapError}</p>
                {showKeyHint && <p>Add `VITE_GOOGLE_MAPS_API_KEY` to your frontend `.env` file.</p>}
                <iframe
                  className="map-fallback-iframe"
                  title="Google Maps fallback preview"
                  src={fallbackMapSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <p className="map-fallback-note">Fallback map mode is active while API authentication is being fixed.</p>
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
                <EnvironmentOutlined />
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
              <CloudUploadOutlined />
            </div>
            <h4>Upload cleaning</h4>
            <p>Drag and drop images here, or click to browse files (up to {MAX_BOOKING_IMAGES})</p>
            {previewUrls.length === 0 ? (
              <div className="upload-previews" aria-hidden>
                <span>
                  <PictureOutlined />
                </span>
                <span>
                  <PictureOutlined />
                </span>
                <span>
                  <PictureOutlined />
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
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="preferred-date">Preferred Date</label>
              <input
                id="preferred-date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="start-time">Time (Hour &amp; Minute)</label>
              <select id="start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                <option value="" disabled>
                  Select time
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
            <ArrowLeftOutlined /> Back to Service
          </button>
          <button type="button" className="next-btn" onClick={handleConfirmBooking} disabled={submitting} data-customer-button>
            {submitting ? 'Submitting...' : 'Confirm Booking'} <ArrowRightOutlined />
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BookingPage;
