import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import CleanerMessagePanel from '../components/cleaner_message_panel';
import officeImage from '../../../assets/office.png';
import api from '../../../services/api';
import { useChatStore } from '../../../store/chatStore';
import { formatTimeRangeLabel } from '../../../utils/timeFormat';
import {
  ensureRealtimeSocketConnected,
  getRealtimeSocket
} from '../../../services/socketService';
import '../../../styles/cleaner/my_jobs.scss';
import '../../../styles/cleaner/messages.scss';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';
const CLEANER_CHAT_THREADS_KEY = 'cleaner_chat_threads_history';
const CLEANER_HIDDEN_CHAT_STORAGE_KEY = 'cleaner_hidden_message_threads_v1';
const fallbackThreads = [];
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const normalizeAssetUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(String(value))) return String(value);
  if (String(value).startsWith('/')) return `${API_BASE_URL}${value}`;
  return String(value);
};

// Helper to save chat threads to localStorage
const saveChatThreads = (threads) => {
  try {
    localStorage.setItem(CLEANER_CHAT_THREADS_KEY, JSON.stringify(threads));
  } catch (e) {
    // Ignore storage errors
  }
};

// Helper to load chat threads from localStorage
const loadChatThreads = () => {
  try {
    const raw = localStorage.getItem(CLEANER_CHAT_THREADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((thread) => /^\d+$/.test(String(thread?.sourceRequestId || thread?.id || '')));
    }
  } catch (e) {
    // Ignore
  }
  return [];
};

const readHiddenThreadIds = () => {
  try {
    const raw = localStorage.getItem(CLEANER_HIDDEN_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
  } catch {
    return [];
  }
};

const writeHiddenThreadIds = (threadIds) => {
  try {
    localStorage.setItem(CLEANER_HIDDEN_CHAT_STORAGE_KEY, JSON.stringify(threadIds));
  } catch {
    // Ignore storage issues for hidden chat state.
  }
};

const normalizeThread = (job, index) => ({
  id: String(job?.id || job?.sourceRequestId || `thread-${index + 1}`),
  sourceRequestId: job?.sourceRequestId || job?.id || `thread-${index + 1}`,
  status: job?.status || 'upcoming',
  title: job?.title || 'Cleaning Job',
  jobId: job?.jobId || '#SOMA-00000',
  price: job?.price || '$0.00',
  day: job?.day || '01',
  monthYear: job?.monthYear || 'June 2026',
  timeRange: job?.timeRange || '09:00 AM - 12:00 PM',
  location: job?.location || 'Phnom Penh, Cambodia',
  customer: job?.customer || 'Customer',
  customerId: job?.customerId || job?.customer_id || '3',
  customerAvatar: normalizeAssetUrl(job?.customerAvatar || job?.customer_avatar || ''),
  customerPhone: job?.customerPhone || job?.customer_phone || '',
  customerEmail: job?.customerEmail || job?.customer_email || '',
  customerAddress: job?.customerAddress || job?.customer_address || job?.location || '',
  bedrooms: job?.bedrooms || '3 Bedrooms',
  floors: job?.floors || '2 Floors',
  image: job?.image || officeImage
});

const getAuthToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.token || localStorage.getItem('token') || null;
  } catch {
    return localStorage.getItem('token') || null;
  }
};

const getPreviewText = (messageList) => {
  if (!Array.isArray(messageList) || messageList.length === 0) return 'Tap to open conversation.';
  const last = [...messageList].reverse().find((msg) => msg && (msg.text || msg.imageUrl || msg.message || msg.file_url));
  if (!last) return 'Tap to open conversation.';
  const textValue = last.text || last.message;
  if (textValue) {
    const trimmed = String(textValue).trim();
    if (!trimmed) return 'Tap to open conversation.';
    return trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed;
  }
  if (last.imageName || last.file_type) return `Image: ${last.imageName || last.file_type}`;
  return 'Image attachment';
};

const extractRealtimeMessage = (payload) => {
  if (payload?.message && typeof payload.message === 'object') {
    return {
      bookingId: String(payload.bookingId || payload.booking_id || payload.message.booking_id || ''),
      message: payload.message
    };
  }

  return {
    bookingId: String(payload?.bookingId || payload?.booking_id || payload?.booking_id || ''),
    message: payload
  };
};

const mergeThreadWithBooking = (thread, bookingData = {}) => {
  const customerName = bookingData.customer_full_name || bookingData.customer_name || thread.customer;
  const dateValue = bookingData.booking_date ? new Date(bookingData.booking_date) : null;
  const formattedDay = dateValue && !Number.isNaN(dateValue.getTime())
    ? String(dateValue.getDate()).padStart(2, '0')
    : thread.day;
  const formattedMonthYear = dateValue && !Number.isNaN(dateValue.getTime())
    ? dateValue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : thread.monthYear;

  return normalizeThread({
    ...thread,
    sourceRequestId: thread.sourceRequestId,
    id: thread.id,
    title: bookingData.service_name || thread.title,
    jobId: bookingData.booking_id ? `#SOMA-${String(bookingData.booking_id).padStart(5, '0')}` : thread.jobId,
    price: bookingData.negotiated_price || bookingData.total_price
      ? `$${Number(bookingData.negotiated_price || bookingData.total_price || 0).toFixed(2)}`
      : thread.price,
    day: formattedDay,
    monthYear: formattedMonthYear,
    timeRange: thread.timeRange,
    location: bookingData.address || thread.location,
    customer: customerName || 'Customer',
    customerId: bookingData.user_id || thread.customerId,
    customerAvatar: bookingData.customer_avatar || thread.customerAvatar,
    customerPhone: bookingData.customer_phone || thread.customerPhone,
    customerEmail: bookingData.customer_email || thread.customerEmail,
    customerAddress: bookingData.address || thread.customerAddress || thread.location
  });
};

const MessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
const [activeThreadId, setActiveThreadId] = useState(
    searchParams.get('thread') || searchParams.get('booking')
  );
  const [threadPreviews, setThreadPreviews] = useState({});
  const [hiddenThreadIds, setHiddenThreadIds] = useState(() => readHiddenThreadIds());
  const [priceInput, setPriceInput] = useState('');
  const [priceStatus, setPriceStatus] = useState('');
  const unreadByThread = useChatStore((state) => state.unreadByThread);
  const incrementUnread = useChatStore((state) => state.incrementUnread);

  const visibleThreads = useMemo(() => {
    const hidden = new Set(hiddenThreadIds.map((id) => String(id)));
    return threads.filter((thread) => !hidden.has(String(thread.sourceRequestId || thread.id)));
  }, [threads, hiddenThreadIds]);

  useEffect(() => {
    writeHiddenThreadIds(hiddenThreadIds);
  }, [hiddenThreadIds]);

  useEffect(() => {
    try {
      // First, try to load saved chat threads from localStorage
      const savedThreads = loadChatThreads();
      
      // Also load from confirmed jobs
      const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
      if (!raw && savedThreads.length > 0) {
        // No new jobs but have old chat threads - use those
        setThreads(savedThreads);
        return;
      }
      
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        // Use saved threads if no new jobs
        setThreads(savedThreads.length > 0 ? savedThreads : []);
        return;
      }
      
      const normalized = parsed.filter(Boolean).map(normalizeThread);
      
      // Merge with saved threads (keep old chat threads that might not be in jobs anymore)
      const existingThreadIds = new Set(normalized.map(t => t.sourceRequestId || t.id));
      const mergedThreads = [
        ...normalized,
        ...savedThreads.filter(t => !existingThreadIds.has(t.sourceRequestId || t.id))
      ];
      
      // Save merged threads back to localStorage
      saveChatThreads(mergedThreads);
      setThreads(mergedThreads);
    } catch {
      setThreads([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPreviews = async () => {
      if (!visibleThreads.length) {
        setThreadPreviews({});
        return;
      }

      if (!getAuthToken()) {
        const fallbackMap = visibleThreads.reduce((acc, thread) => {
          const threadId = String(thread.sourceRequestId || thread.id);
          acc[threadId] = 'Tap to open conversation.';
          return acc;
        }, {});
        if (!cancelled) {
          setThreadPreviews(fallbackMap);
        }
        return;
      }

      try {
        const entries = await Promise.all(
          visibleThreads.map(async (thread) => {
            const threadId = String(thread.sourceRequestId || thread.id);
            try {
              const response = await api.get(`/messages/booking/${threadId}`);
              const payload = response?.data?.data || [];
              return [threadId, getPreviewText(payload)];
            } catch {
              return [threadId, 'Tap to open conversation.'];
            }
          })
        );

        if (!cancelled) {
          setThreadPreviews(Object.fromEntries(entries));
        }
      } catch {
        if (!cancelled) {
          setThreadPreviews({});
        }
      }
    };

    loadPreviews();

    return () => {
      cancelled = true;
    };
  }, [threads]);

  useEffect(() => {
    let cancelled = false;

    const enrichThreadsFromBookings = async () => {
      if (!threads.length || !getAuthToken()) return;

      try {
        const enriched = await Promise.all(
          threads.map(async (thread) => {
            const threadId = String(thread.sourceRequestId || thread.id);
            try {
              const response = await api.get(`/bookings/${threadId}`);
              const bookingData = response?.data?.data || {};
              return mergeThreadWithBooking(thread, bookingData);
            } catch {
              return normalizeThread(thread);
            }
          })
        );

        if (!cancelled) {
          const prevSignature = JSON.stringify(threads);
          const nextSignature = JSON.stringify(enriched);
          if (prevSignature !== nextSignature) {
            saveChatThreads(enriched);
            setThreads(enriched);
          }
        }
      } catch {
        // Ignore enrichment errors and keep existing thread data.
      }
    };

    enrichThreadsFromBookings();

    return () => {
      cancelled = true;
    };
  }, [visibleThreads]);

  useEffect(() => {
    const paramThreadId = searchParams.get('thread') || searchParams.get('booking');
    if (paramThreadId && paramThreadId !== activeThreadId) {
      setActiveThreadId(paramThreadId);
    }
  }, [searchParams, activeThreadId]);

  useEffect(() => {
    const socket = ensureRealtimeSocketConnected();
    if (!socket) return undefined;

    const onNewMessage = (payload) => {
      const { bookingId, message } = extractRealtimeMessage(payload);
      if (!bookingId || !message) return;

      setHiddenThreadIds((prev) => prev.filter((id) => String(id) !== String(bookingId)));

      setThreadPreviews((prev) => ({
        ...prev,
        [bookingId]: getPreviewText([message])
      }));

      const currentActiveId = String(activeThreadId || '');
      const senderRole = String(message?.sender?.role?.role_name || message?.sender || '').toLowerCase();
      if (bookingId !== currentActiveId && senderRole === 'customer') {
        incrementUnread(bookingId);
      }

      setThreads((prev) => {
        if (prev.some((thread) => String(thread.sourceRequestId || thread.id) === bookingId)) {
          return prev;
        }

        return [
          normalizeThread({
            sourceRequestId: bookingId,
            id: bookingId,
            customer: message?.sender?.username || 'Customer'
          }, 0),
          ...prev
        ];
      });
    };

    const onMessagesSeen = ({ bookingId }) => {
      if (!bookingId) return;
      if (String(activeThreadId || '') === String(bookingId)) {
        useChatStore.getState().clearUnread(bookingId);
      }
    };

    socket.on('message:new', onNewMessage);
    socket.on('messages:seen', onMessagesSeen);

    return () => {
      getRealtimeSocket().off('message:new', onNewMessage);
      getRealtimeSocket().off('messages:seen', onMessagesSeen);
    };
  }, [activeThreadId, incrementUnread]);

  useEffect(() => {
    if (!visibleThreads.length) return;
    const normalizedActive = String(activeThreadId || '');
    const exists = visibleThreads.some((thread) =>
      String(thread.sourceRequestId || thread.id) === normalizedActive
    );
    if (exists) return;
    const first = visibleThreads[0];
    const nextId = String(first.sourceRequestId || first.id);
    const params = new URLSearchParams(searchParams);
    params.set('thread', nextId);
    setSearchParams(params, { replace: true });
    setActiveThreadId(nextId);
  }, [visibleThreads, activeThreadId, searchParams, setSearchParams]);

  const activeThread = useMemo(() => {
    if (!visibleThreads.length) return null;
    const activeId = String(activeThreadId || '');
    return (
      visibleThreads.find((thread) => String(thread.sourceRequestId || thread.id) === activeId)
      || visibleThreads[0]
    );
  }, [visibleThreads, activeThreadId]);

  useEffect(() => {
    if (!activeThread?.price) {
      setPriceInput('');
      return;
    }
    const numeric = String(activeThread.price).replace(/[^0-9.]/g, '');
    setPriceInput(numeric);
  }, [activeThread]);

  const handleSubmitPrice = async () => {
    if (!activeThread) return;
    const numeric = Number(String(priceInput || '').replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setPriceStatus('Enter a valid price to submit.');
      return;
    }

    const activeKey = String(activeThread.sourceRequestId || activeThread.id);
    setPriceStatus('Submitting price...');

    try {
      const response = await api.patch(`/bookings/${activeKey}/price`, {
        negotiated_price: numeric
      });
      const saved = response?.data?.data?.negotiated_price;
      const formatted = `$${Number(saved ?? numeric).toFixed(2)}`;

      setThreads((prev) =>
        prev.map((thread) =>
          String(thread.sourceRequestId || thread.id) === activeKey
            ? { ...thread, price: formatted }
            : thread
        )
      );

      try {
        const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          const updated = parsed.map((job) =>
            String(job?.sourceRequestId || job?.id) === activeKey
              ? { ...job, price: formatted }
              : job
          );
          localStorage.setItem(CONFIRMED_MY_JOBS_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch {
        /* ignore storage errors */
      }

      setPriceStatus('Price submitted for this booking.');
      navigate('/cleaner/my-jobs');
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      setPriceStatus(apiMessage || 'Failed to submit price.');
      return;
    }
  };

  const handleSelectThread = (thread) => {
    const nextId = String(thread.sourceRequestId || thread.id);
    const params = new URLSearchParams(searchParams);
    params.set('thread', nextId);
    setSearchParams(params, { replace: true });
    setActiveThreadId(nextId);
  };

  const handleDeleteThread = (thread, event) => {
    event.stopPropagation();
    const threadId = String(thread.sourceRequestId || thread.id);
    const customerLabel = thread.customer || 'this customer';
    const confirmed = window.confirm(`Delete this chat with ${customerLabel}?`);
    if (!confirmed) return;

    setHiddenThreadIds((prev) => (prev.includes(threadId) ? prev : [...prev, threadId]));
    setThreads((prev) => prev.filter((item) => String(item.sourceRequestId || item.id) !== threadId));
    setThreadPreviews((prev) => {
      const next = { ...prev };
      delete next[threadId];
      return next;
    });

    useChatStore.getState().clearUnread(threadId);

    if (String(activeThreadId || '') === threadId) {
      const remaining = visibleThreads.filter((item) => String(item.sourceRequestId || item.id) !== threadId);
      const params = new URLSearchParams(searchParams);
      if (remaining.length > 0) {
        const nextId = String(remaining[0].sourceRequestId || remaining[0].id);
        params.set('thread', nextId);
        setSearchParams(params, { replace: true });
        setActiveThreadId(nextId);
      } else {
        params.delete('thread');
        params.delete('booking');
        setSearchParams(params, { replace: true });
        setActiveThreadId(null);
      }
    }
  };

  if (!visibleThreads.length) {
    return (
      <div className="cleaner-messages-page">
        <div className="cleaner-messages-empty">
          <MessageOutlined />
          <h3>No messages yet</h3>
          <p>Your customer conversations will appear here once you accept a job.</p>
        </div>
      </div>
    );
  }

  const dateLabel = activeThread
    ? `${activeThread.monthYear} ${activeThread.day}, ${formatTimeRangeLabel(activeThread.timeRange, 'Time pending')}`
    : '';

  return (
    <div className="cleaner-messages-page">
      <div className="cleaner-messages-header">
        <div>
          <p className="cleaner-messages-kicker">Conversations</p>
          <h1>Messages</h1>
        </div>
        <span className="cleaner-messages-count">{visibleThreads.length} threads</span>
      </div>

      <div className="cleaner-messages-shell">
        <aside className="cleaner-messages-list">
          <div className="cleaner-messages-list-header">
            <strong>All chats</strong>
            <MessageOutlined />
          </div>
          <div className="cleaner-messages-thread-list">
            {visibleThreads.map((thread) => {
              const threadId = String(thread.sourceRequestId || thread.id);
              const isActive = String(activeThread?.sourceRequestId || activeThread?.id) === threadId;
              const preview = threadPreviews[threadId] || 'Tap to open conversation.';
              const unreadCount = unreadByThread[threadId] || 0;
              return (
                <div
                  key={threadId}
                  className={`cleaner-messages-thread-row ${isActive ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className={`cleaner-messages-thread ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectThread(thread)}
                  >
                    <div className="thread-avatar">
                      {thread.customerAvatar ? (
                        <img src={thread.customerAvatar} alt={thread.customer} className="thread-avatar-image" />
                      ) : (
                        thread.customer.charAt(0)
                      )}
                    </div>
                    <div className="thread-meta">
                      <strong>{thread.customer}</strong>
                      <span>{preview}</span>
                    </div>
                    <div className="thread-meta-right">
                      {unreadCount > 0 && (
                        <span className="thread-unread">{unreadCount}</span>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="cleaner-messages-thread-delete"
                    onClick={(event) => handleDeleteThread(thread, event)}
                    aria-label={`Delete chat with ${thread.customer || 'Customer'}`}
                    title="Delete chat"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="cleaner-messages-content">
          {activeThread && (
            <div className="my-jobs-message-view">
              <CleanerMessagePanel
                threadId={String(activeThread.sourceRequestId || activeThread.id)}
                customerName={activeThread.customer}
                customerId={String(activeThread.customerId)}
                customerAvatar={activeThread.customerAvatar}
                customerPhone={activeThread.customerPhone}
                customerEmail={activeThread.customerEmail}
                customerAddress={activeThread.customerAddress}
                subtitle={`${activeThread.title} Job - ${activeThread.jobId}`}
              />

              <aside className="my-jobs-details-panel">
                <h5>JOB DETAILS</h5>

                <div className="my-jobs-details-card">
                  <div className="my-jobs-detail-row">
                    <span className="my-jobs-detail-icon"><CalendarOutlined /></span>
                    <div>
                      <small>Date &amp; Time</small>
                      <strong>{dateLabel}</strong>
                    </div>
                  </div>
                  <div className="my-jobs-detail-row">
                    <span className="my-jobs-detail-icon"><EnvironmentOutlined /></span>
                    <div>
                      <small>Location</small>
                      <strong>{activeThread.customerAddress || activeThread.location || 'Location not provided'}</strong>
                    </div>
                  </div>

                </div>

                <div className="my-jobs-details-card my-jobs-details-card--service">
                  <div className="my-jobs-detail-row">
                    <span className="my-jobs-detail-icon"><FileTextOutlined /></span>
                    <div>
                      <small>Service</small>
                      <strong>{activeThread.title}</strong>
                    </div>
                  </div>
                </div>

                <button type="button" className="my-jobs-contract-btn">
                  <FileTextOutlined /> View Full Job Contract
                </button>

                <div className="my-jobs-map-preview" />

                <div className="my-jobs-price-card">
                  <div className="my-jobs-price-header">
                    <div>
                      <small>NEGOTIATED PRICE</small>
                      <strong>{activeThread.price}</strong>
                    </div>
                    <span className="my-jobs-price-badge">Cleaner</span>
                  </div>
                  <label className="my-jobs-price-label" htmlFor="negotiatedPrice">
                    Submit agreed price
                  </label>
                  <div className="my-jobs-price-input">
                    <input
                      id="negotiatedPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <button type="button" className="my-jobs-price-submit" onClick={handleSubmitPrice}>
                    Submit agreed price
                  </button>
                  {priceStatus && <p className="my-jobs-price-status">{priceStatus}</p>}
                </div>

              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
