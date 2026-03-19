import api from '../../../services/api';
import { useChatStore } from '../../../store/chatStore';

export const CLEANER_NOTIFICATIONS_KEY = 'cleaner_notifications_v1';
const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';
const CLEANER_CHAT_THREADS_KEY = 'cleaner_chat_threads_history';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const titleCaseStatus = (status) => {
  const text = String(status || '').replace(/-/g, ' ').trim();
  if (!text) return 'Updated';
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

const createNotification = ({
  id,
  type,
  title,
  message,
  createdAt,
  read = false,
  color,
  link
}) => ({
  id,
  type,
  title,
  message,
  created_at: createdAt,
  is_read: read,
  color,
  link
});

const buildRequestNotifications = async () => {
  try {
    const response = await api.get('/bookings/available', { params: { limit: 20 } });
    const rows = ensureArray(response?.data?.data);

    return rows.map((booking, index) => {
      const bookingId = String(booking?.booking_id || booking?.id || `request-${index + 1}`);
      const serviceName = booking?.service_name || booking?.service?.name || 'Cleaning service';
      const customerName =
        booking?.customer_name ||
        [booking?.first_name, booking?.last_name].filter(Boolean).join(' ').trim() ||
        'A customer';

      return createNotification({
        id: `request-${bookingId}`,
        type: 'request',
        title: 'New Request',
        message: `${customerName} requested ${serviceName}.`,
        createdAt: booking?.created_at || booking?.booking_date || new Date(Date.now() - index * 60000).toISOString(),
        color: '#3b82f6',
        link: '/cleaner/job-requests'
      });
    });
  } catch {
    return [];
  }
};

const buildJobStatusNotifications = () => {
  const jobs = ensureArray(readJson(CONFIRMED_MY_JOBS_STORAGE_KEY, []));
  const now = Date.now();

  return jobs.map((job, index) => {
    const sourceId = String(job?.sourceRequestId || job?.id || `job-${index + 1}`);
    const status = String(job?.status || 'upcoming').toLowerCase();
    const readableStatus = titleCaseStatus(status);
    const title = status === 'completed'
      ? 'Job Completed'
      : status === 'in-progress'
        ? 'Job In Progress'
        : 'Upcoming Job';
    const color = status === 'completed'
      ? '#10b981'
      : status === 'in-progress'
        ? '#f59e0b'
        : '#6366f1';

    return createNotification({
      id: `job-${sourceId}-${status}`,
      type: status === 'completed' ? 'complete' : status === 'in-progress' ? 'progress' : 'job',
      title,
      message: `${job?.title || 'Cleaning job'} is now ${readableStatus.toLowerCase()}.`,
      createdAt: new Date(now - index * 5 * 60000).toISOString(),
      color,
      link: '/cleaner/my-jobs'
    });
  });
};

const buildChatNotifications = () => {
  const unreadByThread = useChatStore.getState().unreadByThread || {};
  const threads = ensureArray(readJson(CLEANER_CHAT_THREADS_KEY, []));
  const jobs = ensureArray(readJson(CONFIRMED_MY_JOBS_STORAGE_KEY, []));
  const now = Date.now();

  return Object.entries(unreadByThread).map(([threadId, unreadCount], index) => {
    const thread = threads.find((item) => String(item?.sourceRequestId || item?.id) === String(threadId));
    const job = jobs.find((item) => String(item?.sourceRequestId || item?.id) === String(threadId));
    const customerName = thread?.customer || job?.customer || 'Customer';

    return createNotification({
      id: `chat-${threadId}`,
      type: 'chat',
      title: 'New Chat',
      message: `${customerName} sent ${unreadCount} new message${Number(unreadCount) > 1 ? 's' : ''}.`,
      createdAt: new Date(now - index * 2 * 60000).toISOString(),
      color: '#8b5cf6',
      link: `/cleaner/messages?thread=${encodeURIComponent(String(threadId))}`
    });
  });
};

export const loadCleanerNotifications = () => ensureArray(readJson(CLEANER_NOTIFICATIONS_KEY, []));

export const dispatchCleanerNotificationsUpdated = () => {
  try {
    window.dispatchEvent(new Event('cleaner-notifications-updated'));
  } catch {
    // Ignore non-browser environments.
  }
};

export const saveCleanerNotifications = (notifications = []) => {
  try {
    localStorage.setItem(CLEANER_NOTIFICATIONS_KEY, JSON.stringify(ensureArray(notifications)));
  } catch {
    // Ignore storage issues.
  }
};

export const buildCleanerNotifications = async () => {
  const previous = loadCleanerNotifications();
  const previousById = new Map(previous.map((item) => [String(item.id), item]));
  const [requestNotifications] = await Promise.all([
    buildRequestNotifications()
  ]);

  const derived = [
    ...buildChatNotifications(),
    ...requestNotifications,
    ...buildJobStatusNotifications()
  ];

  const next = derived
    .map((item) => {
      const existing = previousById.get(String(item.id));
      if (!existing) return item;
      if (existing.dismissed) {
        return { ...item, dismissed: true, is_read: true };
      }
      return {
        ...item,
        is_read: Boolean(existing.is_read)
      };
    })
    .filter((item) => !item.dismissed)
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

  saveCleanerNotifications(next);
  return next;
};
