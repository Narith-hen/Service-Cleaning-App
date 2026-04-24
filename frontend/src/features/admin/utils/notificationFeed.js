import { bookingService } from '../services/bookingService';

const BOOKING_FETCH_LIMIT = 100;

const normalizeStatusKey = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(/-/g, '_');

const toTimestamp = (value) => {
  const parsed = new Date(value || '').getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractBookingRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const extractPagination = (response) => {
  if (response?.pagination && typeof response.pagination === 'object') return response.pagination;
  if (response?.data?.pagination && typeof response.data.pagination === 'object') return response.data.pagination;
  return {};
};

const dedupeBookingRows = (rows) => {
  const map = new Map();

  rows.forEach((row) => {
    const bookingId = row?.booking_id ?? row?.id ?? null;
    if (!bookingId) return;
    map.set(String(bookingId), row);
  });

  return Array.from(map.values());
};

const resolveNotificationCategory = (row) => {
  const bookingStatus = normalizeStatusKey(row?.booking_status || row?.status || '');
  const serviceStatus = normalizeStatusKey(row?.service_status || '');

  if (bookingStatus === 'cancelled' || serviceStatus === 'cancelled') {
    return null;
  }

  if (serviceStatus === 'completed' || bookingStatus === 'completed') {
    return 'completed';
  }

  if (bookingStatus === 'pending') {
    return 'new_request';
  }

  return null;
};

const getNotificationTimestamp = (row, category) => {
  if (category === 'completed') {
    return (
      row?.completed_at ||
      row?.service_completed_at ||
      row?.cleaner_confirmed_at ||
      row?.updated_at ||
      row?.created_at ||
      new Date().toISOString()
    );
  }

  return row?.created_at || row?.updated_at || new Date().toISOString();
};

const buildNotificationMessage = ({ category, bookingId, customerName, serviceName }) => {
  if (category === 'completed') {
    return `${serviceName} for ${customerName} on booking #${bookingId} is completed.`;
  }

  return `${customerName} submitted a new request for ${serviceName} on booking #${bookingId}.`;
};

const buildNotificationFromBooking = (row, existingNotification) => {
  const bookingId = Number(row?.booking_id ?? row?.id ?? 0);
  if (!Number.isFinite(bookingId) || bookingId <= 0) return null;

  const category = resolveNotificationCategory(row);
  if (!category) return null;

  const customerName = row?.customer_name || row?.user_name || row?.customer_username || 'Customer';
  const serviceName = row?.service_name || row?.service?.name || 'Cleaning Service';
  const createdAt = getNotificationTimestamp(row, category);

  return {
    id: `booking-${bookingId}-${category}`,
    bookingId,
    category,
    type: category === 'completed' ? 'success' : 'info',
    title: category === 'completed' ? 'Booking completed' : 'New booking request',
    message: buildNotificationMessage({
      category,
      bookingId,
      customerName,
      serviceName
    }),
    created_at: createdAt,
    is_read: Boolean(existingNotification?.is_read),
    customerName,
    serviceName,
    link: `/admin/bookings?bookingId=${bookingId}`
  };
};

export const countUnreadNotifications = (notifications = []) =>
  notifications.filter((notification) => !notification.is_read).length;

export const buildAdminNotifications = (rows = [], existingNotifications = [], dismissedIds = []) => {
  const existingById = new Map(existingNotifications.map((notification) => [notification.id, notification]));
  const dismissedSet = new Set(dismissedIds);

  return dedupeBookingRows(rows)
    .map((row) => {
      const bookingId = Number(row?.booking_id ?? row?.id ?? 0);
      const category = resolveNotificationCategory(row);
      const notificationId = bookingId > 0 && category ? `booking-${bookingId}-${category}` : '';
      return buildNotificationFromBooking(row, existingById.get(notificationId));
    })
    .filter(Boolean)
    .filter((notification) => !dismissedSet.has(notification.id))
    .sort((left, right) => toTimestamp(right.created_at) - toTimestamp(left.created_at));
};

export const fetchAllAdminBookings = async () => {
  const rows = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const response = await bookingService.getBookings({
      page: currentPage,
      limit: BOOKING_FETCH_LIMIT
    });

    const pageRows = extractBookingRows(response);
    const pagination = extractPagination(response);

    rows.push(...pageRows);

    const reportedPages = Number(pagination?.pages || pagination?.total_pages || 1);
    totalPages = Number.isFinite(reportedPages) && reportedPages > 0 ? reportedPages : 1;

    if (!pageRows.length || currentPage >= totalPages) {
      break;
    }

    currentPage += 1;
  }

  return rows;
};
