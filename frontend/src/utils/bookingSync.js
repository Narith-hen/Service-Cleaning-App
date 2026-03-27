const JOB_REQUESTS_STORAGE_KEY = 'cleaner_job_requests';
const CUSTOMER_NOTIFICATIONS_KEY = 'customer_booking_notifications';
const LAST_BOOKING_KEY = 'customer_last_booking_id';

const safeParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) || typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const loadCleanerRequests = (fallback = []) => {
  let raw = null;
  try {
    raw = typeof window !== 'undefined' ? localStorage.getItem(JOB_REQUESTS_STORAGE_KEY) : null;
  } catch {
    raw = null;
  }
  const parsed = safeParse(raw, []);
  if (Array.isArray(parsed) && parsed.length) return parsed;
  return fallback;
};

export const saveCleanerRequests = (requests = []) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(JOB_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new Event('booking-storage-updated'));
  } catch {
    /* ignore persistence issues */
  }
};

export const appendCleanerRequest = (request, fallback = []) => {
  const current = loadCleanerRequests(fallback);
  const next = [request, ...current];
  saveCleanerRequests(next);
  return next;
};

export const loadCustomerNotifications = (fallback = []) => {
  let raw = null;
  try {
    raw = typeof window !== 'undefined' ? localStorage.getItem(CUSTOMER_NOTIFICATIONS_KEY) : null;
  } catch {
    raw = null;
  }
  const parsed = safeParse(raw, []);
  if (Array.isArray(parsed) && parsed.length) return parsed;
  return fallback;
};

export const saveCustomerNotifications = (notifications = []) => {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = Array.isArray(notifications)
      ? notifications.map(({ icon, ...notification }) => notification)
      : [];
    localStorage.setItem(CUSTOMER_NOTIFICATIONS_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new Event('booking-storage-updated'));
  } catch {
    /* ignore persistence issues */
  }
};

export const appendCustomerNotification = (notification, fallback = []) => {
  const base = {
    id: Date.now(),
    read: false,
    createdAt: new Date().toISOString()
  };
  const current = loadCustomerNotifications(fallback);
  const next = [{ ...base, ...notification }, ...current];
  saveCustomerNotifications(next);
  return next;
};

export const setLastBookingId = (bookingId) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_BOOKING_KEY, String(bookingId));
  } catch {
    /* ignore persistence issues */
  }
};

export const getLastBookingId = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LAST_BOOKING_KEY);
  } catch {
    return null;
  }
};

export const timeAgo = (isoString) => {
  if (!isoString) return '';
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  if (Number.isNaN(diffMs)) return '';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

export const formatDateParts = (isoDate) => {
  if (!isoDate) return { month: 'TBD', day: '??' };
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return { month: 'TBD', day: '??' };
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = String(date.getDate()).padStart(2, '0');
  return { month, day };
};

export const deriveServiceTone = (title = '') => {
  const lower = title.toLowerCase();
  if (lower.includes('deep')) return 'deep';
  if (lower.includes('regular')) return 'regular';
  return 'standard';
};

export const toMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
};
