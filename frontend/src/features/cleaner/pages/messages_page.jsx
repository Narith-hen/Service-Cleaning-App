import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { getCleanerScopedStorageKey } from '../utils/storageKeys';
import '../../../styles/cleaner/my_jobs.scss';
import '../../../styles/cleaner/messages.scss';

const getConfirmedMyJobsStorageKey = () => getCleanerScopedStorageKey('cleaner_confirmed_my_jobs');
const getCleanerChatThreadsStorageKey = () => getCleanerScopedStorageKey('cleaner_chat_threads_history');
const getCleanerHiddenChatStorageKey = () => getCleanerScopedStorageKey('cleaner_hidden_message_threads_v1');
const getCleanerChatMessagesStorageKey = () => getCleanerScopedStorageKey('cleaner_message_threads_v1');
const fallbackThreads = [];
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const normalizeAssetUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(String(value))) return String(value);
  if (String(value).startsWith('/')) return `${API_BASE_URL}${value}`;
  return String(value);
};

const getCurrentUserId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.id || stored?.user_id || null;
  } catch {
    return null;
  }
};

const formatThreadDateParts = (bookingDate) => {
  const dateValue = bookingDate ? new Date(bookingDate) : null;
  if (!dateValue || Number.isNaN(dateValue.getTime())) {
    return {
      day: '01',
      monthYear: 'June 2026'
    };
  }

  return {
    day: String(dateValue.getDate()).padStart(2, '0'),
    monthYear: dateValue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  };
};

const isCleanerMessageEligibleBooking = (booking, currentUserId) => {
  if (!booking || !currentUserId) return false;
  if (String(booking.cleaner_id || '') !== String(currentUserId)) return false;
  return String(booking.booking_status || '').trim().toLowerCase() !== 'cancelled';
};

// Helper to save chat threads to localStorage
const saveChatThreads = (threads) => {
  try {
    localStorage.setItem(getCleanerChatThreadsStorageKey(), JSON.stringify(threads));
  } catch (e) {
    // Ignore storage errors
  }
};

// Helper to load chat threads from localStorage
const loadChatThreads = () => {
  try {
    const raw = localStorage.getItem(getCleanerChatThreadsStorageKey());
    
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
    const raw = localStorage.getItem(getCleanerHiddenChatStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
  } catch {
    return [];
  }
};

const writeHiddenThreadIds = (threadIds) => {
  try {
    localStorage.setItem(getCleanerHiddenChatStorageKey(), JSON.stringify(threadIds));
  } catch {
    // Ignore storage issues for hidden chat state.
  }
};

const readStoredMessageThreads = () => {
  try {
    const raw = localStorage.getItem(getCleanerChatMessagesStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredMessageThreads = (threads) => {
  try {
    localStorage.setItem(getCleanerChatMessagesStorageKey(), JSON.stringify(threads));
  } catch {
    // Ignore storage failures for local chat cleanup.
  }
};

const getCanonicalThreadId = (job, index = 0) => {
  const rawCandidates = [
    job?.booking_id,
    job?.bookingId,
    job?.sourceRequestId,
    job?.id
  ];

  for (const candidate of rawCandidates) {
    const text = String(candidate || '').trim();
    if (!text) continue;
    if (text.startsWith('confirmed-')) {
      const unwrapped = text.replace(/^confirmed-/, '').trim();
      if (unwrapped) return unwrapped;
    }
    if (/^\d+$/.test(text)) {
      return text;
    }
  }

  return `thread-${index + 1}`;
};

const dedupeThreads = (items = []) => {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const normalized = normalizeThread(item, result.length);
    const key = String(normalized.sourceRequestId || normalized.id || '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
};

const normalizeThread = (job, index) => {
  const negotiatedPriceValue = job?.negotiatedPrice ?? job?.negotiated_price ?? null;
  const hasNegotiatedPrice = negotiatedPriceValue != null && String(negotiatedPriceValue).trim() !== '';
  const canonicalThreadId = getCanonicalThreadId(job, index);
  const derivedDateParts = formatThreadDateParts(job?.booking_date || job?.bookingDate);
  const derivedPrice = job?.price || (
    job?.negotiated_price || job?.total_price
      ? `$${Number(job?.negotiated_price || job?.total_price || 0).toFixed(2)}`
      : '$0.00'
  );

  return {
  id: canonicalThreadId,
  sourceRequestId: canonicalThreadId,
  status: job?.status || 'upcoming',
  title: job?.title || job?.service?.name || job?.service_name || 'Cleaning Job',
  jobId: job?.jobId || '#SOMA-00000',
  price: derivedPrice,
  negotiatedPrice: hasNegotiatedPrice ? Number(negotiatedPriceValue) : null,
  hasNegotiatedPrice,
  day: job?.day || derivedDateParts.day,
  monthYear: job?.monthYear || derivedDateParts.monthYear,
  timeRange: job?.timeRange || job?.booking_time || '09:00 AM - 12:00 PM',
  location: job?.location || job?.address || job?.customerAddress || 'Phnom Penh, Cambodia',
  customer: job?.customer || job?.customer_name || job?.customer_username || job?.user?.username || 'Customer',
  customerId: job?.customerId || job?.customer_id || '3',
  customerAvatar: normalizeAssetUrl(job?.customerAvatar || job?.customer_avatar || job?.user?.avatar || ''),
  customerPhone: job?.customerPhone || job?.customer_phone || job?.user?.phone_number || '',
  customerEmail: job?.customerEmail || job?.customer_email || job?.user?.email || '',
  customerAddress: job?.customerAddress || job?.customer_address || job?.address || job?.location || '',
  bedrooms: job?.bedrooms || '3 Bedrooms',
  floors: job?.floors || '2 Floors',
  image: job?.image || normalizeAssetUrl(job?.serviceImage || job?.service_image || job?.service?.image || '') || officeImage
};
};

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
  const negotiatedPriceValue = bookingData.negotiated_price ?? thread.negotiatedPrice ?? thread.negotiated_price ?? null;
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
    price: bookingData.negotiated_price != null || bookingData.total_price != null
      ? `$${Number(bookingData.negotiated_price ?? bookingData.total_price ?? 0).toFixed(2)}`
      : thread.price,
    negotiated_price: negotiatedPriceValue,
    day: formattedDay,
    monthYear: formattedMonthYear,
    timeRange: bookingData.booking_time || thread.timeRange,
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState([]);
  const [priceInput, setPriceInput] = useState('');
  const [isPriceInputFocused, setIsPriceInputFocused] = useState(false);
  const [priceStatus, setPriceStatus] = useState('');
  const unreadByThread = useChatStore((state) => state.unreadByThread);
  const incrementUnread = useChatStore((state) => state.incrementUnread);
  const lastPriceSyncRef = useRef({ threadId: null, price: '' });
  const hasPriceDraftRef = useRef(false);

  const visibleThreads = useMemo(() => {
    const hidden = new Set(hiddenThreadIds.map((id) => String(id)));
    return threads.filter((thread) => !hidden.has(String(thread.sourceRequestId || thread.id)));
  }, [threads, hiddenThreadIds]);

  useEffect(() => {
    writeHiddenThreadIds(hiddenThreadIds);
  }, [hiddenThreadIds]);

  useEffect(() => {
    const visibleIds = new Set(visibleThreads.map((thread) => String(thread.sourceRequestId || thread.id)));
    setSelectedThreadIds((prev) => prev.filter((id) => visibleIds.has(String(id))));
    if (selectionMode && visibleIds.size === 0) {
      setSelectionMode(false);
    }
  }, [visibleThreads, selectionMode]);

  useEffect(() => {
    let cancelled = false;
    
    const loadThreads = async () => {
      try {
        // First, try to load saved chat threads from localStorage
        const savedThreads = loadChatThreads();
        
        // Also load from confirmed jobs
        const raw = localStorage.getItem(getConfirmedMyJobsStorageKey());
        if (!raw && savedThreads.length > 0) {
          // No new jobs but have old chat threads - use those
          const dedupedSavedThreads = dedupeThreads(savedThreads);
          saveChatThreads(dedupedSavedThreads);
          if (!cancelled) setThreads(dedupedSavedThreads);
          return;
        }
        
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed) || parsed.length === 0) {
          // Use saved threads if no new jobs
          const dedupedSavedThreads = savedThreads.length > 0 ? dedupeThreads(savedThreads) : [];
          if (dedupedSavedThreads.length > 0) {
            saveChatThreads(dedupedSavedThreads);
          }
          if (!cancelled) setThreads(dedupedSavedThreads);
          return;
        }
        
        const mergedThreads = dedupeThreads([
          ...parsed.filter(Boolean),
          ...savedThreads
        ]);
        
        // Save merged threads back to localStorage
        saveChatThreads(mergedThreads);
        if (!cancelled) setThreads(mergedThreads);
      } catch {
        if (!cancelled) setThreads([]);
      }
    };
    
    loadThreads();
    
    // Poll for new confirmed jobs every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        const currentUserId = getCurrentUserId();
        
        if (!currentUserId) return;
        
        // Fetch bookings assigned to this cleaner
        const response = await api.get(`/bookings/cleaner/${currentUserId}`, {
          params: { page: 1, limit: 100 }
        });
        if (cancelled) return;
        
        const bookingsData = response?.data?.data || [];
        const cleanerConfirmedBookings = bookingsData.filter((booking) =>
          isCleanerMessageEligibleBooking(booking, currentUserId)
        );
        
        if (cleanerConfirmedBookings.length > 0) {
          // Update localStorage with fresh data
          const normalized = dedupeThreads(cleanerConfirmedBookings);
          localStorage.setItem(getConfirmedMyJobsStorageKey(), JSON.stringify(normalized));
          
          // Merge with saved threads
          const savedThreads = loadChatThreads();
          const mergedThreads = dedupeThreads([
            ...normalized,
            ...savedThreads
          ]);
          saveChatThreads(mergedThreads);
          if (!cancelled) setThreads(mergedThreads);
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);
    
    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
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

        return dedupeThreads([
          normalizeThread({
            bookingId,
            sourceRequestId: bookingId,
            id: bookingId,
            customer: message?.sender?.username || 'Customer'
          }, 0),
          ...prev
        ]);
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

  const handleToggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedThreadIds([]);
      return;
    }

    setSelectionMode(true);
  };

  const handleToggleThreadSelection = (threadId, event) => {
    event?.stopPropagation();
    const normalizedThreadId = String(threadId);

    setSelectedThreadIds((prev) => (
      prev.includes(normalizedThreadId)
        ? prev.filter((id) => id !== normalizedThreadId)
        : [...prev, normalizedThreadId]
    ));
  };

  const handleSelectAllThreads = () => {
    const visibleIds = visibleThreads.map((thread) => String(thread.sourceRequestId || thread.id));
    if (!visibleIds.length) return;

    setSelectedThreadIds((prev) => (
      prev.length === visibleIds.length ? [] : visibleIds
    ));
  };

  const deleteThreads = (threadIds) => {
    const normalizedIds = [...new Set(threadIds.map((id) => String(id)).filter(Boolean))];
    if (!normalizedIds.length) return;

    const targetIds = new Set(normalizedIds);

    setHiddenThreadIds((prev) => [...new Set([...prev, ...normalizedIds])]);
    setThreads((prev) => {
      const nextThreads = prev.filter((item) => !targetIds.has(String(item.sourceRequestId || item.id)));
      saveChatThreads(nextThreads);
      return nextThreads;
    });
    setThreadPreviews((prev) => {
      const next = { ...prev };
      normalizedIds.forEach((threadId) => {
        delete next[threadId];
      });
      return next;
    });

    const storedMessageThreads = readStoredMessageThreads();
    if (Object.keys(storedMessageThreads).some((threadId) => targetIds.has(String(threadId)))) {
      const nextStoredMessageThreads = { ...storedMessageThreads };
      normalizedIds.forEach((threadId) => {
        delete nextStoredMessageThreads[threadId];
      });
      writeStoredMessageThreads(nextStoredMessageThreads);
    }

    normalizedIds.forEach((threadId) => {
      useChatStore.getState().clearUnread(threadId);
    });

    setSelectedThreadIds((prev) => prev.filter((id) => !targetIds.has(String(id))));
    if (selectionMode) {
      setSelectionMode(false);
    }

    if (targetIds.has(String(activeThreadId || ''))) {
      const remaining = visibleThreads.filter((item) => !targetIds.has(String(item.sourceRequestId || item.id)));
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

  useEffect(() => {
    const activeKey = String(activeThread?.sourceRequestId || activeThread?.id || '');
    const normalizedPrice = activeThread?.price
      ? String(activeThread.price).replace(/[^0-9.]/g, '')
      : '';

    const threadChanged = lastPriceSyncRef.current.threadId !== activeKey;
    const priceChanged = lastPriceSyncRef.current.price !== normalizedPrice;

    if (!activeKey) {
      lastPriceSyncRef.current.threadId = null;
      lastPriceSyncRef.current.price = '';
      setPriceInput('');
      return;
    }

    if (threadChanged) {
      lastPriceSyncRef.current.threadId = activeKey;
      lastPriceSyncRef.current.price = normalizedPrice;
      hasPriceDraftRef.current = false;
      setPriceInput(normalizedPrice);
      setPriceStatus('');
      return;
    }

    if (priceChanged && !isPriceInputFocused && !hasPriceDraftRef.current) {
      lastPriceSyncRef.current.price = normalizedPrice;
      setPriceInput(normalizedPrice);
    }
  }, [activeThread?.id, activeThread?.sourceRequestId, activeThread?.price, isPriceInputFocused]);

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

      setThreads((prev) => {
        const updatedThreads = prev.map((thread) =>
          String(thread.sourceRequestId || thread.id) === activeKey
            ? {
              ...thread,
              price: formatted,
              negotiatedPrice: Number(saved ?? numeric),
              hasNegotiatedPrice: true
            }
            : thread
        );

        saveChatThreads(updatedThreads);
        return updatedThreads;
      });
      lastPriceSyncRef.current.threadId = activeKey;
      lastPriceSyncRef.current.price = String(formatted).replace(/[^0-9.]/g, '');
      hasPriceDraftRef.current = false;
      setPriceInput(lastPriceSyncRef.current.price);

      try {
        const raw = localStorage.getItem(getConfirmedMyJobsStorageKey());
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          const updated = parsed.map((job) =>
            String(job?.sourceRequestId || job?.id) === activeKey
              ? { ...job, price: formatted, negotiated_price: Number(saved ?? numeric) }
              : job
          );
          localStorage.setItem(getConfirmedMyJobsStorageKey(), JSON.stringify(updated));
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

    deleteThreads([threadId]);
  };

  const handleDeleteSelectedThreads = () => {
    if (!selectedThreadIds.length) return;

    const confirmed = window.confirm(
      selectedThreadIds.length === visibleThreads.length
        ? 'Delete all chats?'
        : `Delete ${selectedThreadIds.length} selected chats?`
    );
    if (!confirmed) return;

    deleteThreads(selectedThreadIds);
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
  const allVisibleSelected = visibleThreads.length > 0 && selectedThreadIds.length === visibleThreads.length;
  const hasSubmittedNegotiatedPrice = Boolean(activeThread?.hasNegotiatedPrice || activeThread?.negotiatedPrice != null);

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
            <div className="cleaner-messages-list-header-copy">
              <strong>All chats</strong>
              {selectionMode && (
                <span>{selectedThreadIds.length} selected</span>
              )}
            </div>
            <div className="cleaner-messages-list-actions">
              {selectionMode ? (
                <>
                  <button
                    type="button"
                    className="cleaner-messages-list-action"
                    onClick={handleSelectAllThreads}
                  >
                    {allVisibleSelected ? 'Clear all' : 'Select all'}
                  </button>
                  <button
                    type="button"
                    className="cleaner-messages-list-action cleaner-messages-list-action-danger"
                    onClick={handleDeleteSelectedThreads}
                    disabled={!selectedThreadIds.length}
                  >
                    Delete selected
                  </button>
                  <button
                    type="button"
                    className="cleaner-messages-list-action"
                    onClick={handleToggleSelectionMode}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="cleaner-messages-list-action"
                    onClick={handleToggleSelectionMode}
                  >
                    Select
                  </button>
                  <MessageOutlined />
                </>
              )}
            </div>
          </div>
          <div className="cleaner-messages-thread-list">
            {visibleThreads.map((thread) => {
              const threadId = String(thread.sourceRequestId || thread.id);
              const isActive = String(activeThread?.sourceRequestId || activeThread?.id) === threadId;
              const isSelected = selectedThreadIds.includes(threadId);
              const preview = threadPreviews[threadId] || 'Tap to open conversation.';
              const unreadCount = unreadByThread[threadId] || 0;
              return (
                <div
                  key={threadId}
                  className={`cleaner-messages-thread-row ${isActive ? 'active' : ''} ${selectionMode ? 'selecting' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  {selectionMode && (
                    <button
                      type="button"
                      className={`cleaner-messages-thread-check ${isSelected ? 'selected' : ''}`}
                      onClick={(event) => handleToggleThreadSelection(threadId, event)}
                      aria-label={`${isSelected ? 'Deselect' : 'Select'} chat with ${thread.customer || 'Customer'}`}
                      title={isSelected ? 'Deselect chat' : 'Select chat'}
                    >
                      <span />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`cleaner-messages-thread ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (selectionMode) {
                        handleToggleThreadSelection(threadId);
                        return;
                      }
                      handleSelectThread(thread);
                    }}
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
                  {!selectionMode && (
                    <button
                      type="button"
                      className="cleaner-messages-thread-delete"
                      onClick={(event) => handleDeleteThread(thread, event)}
                      aria-label={`Delete chat with ${thread.customer || 'Customer'}`}
                      title="Delete chat"
                    >
                      <DeleteOutlined />
                    </button>
                  )}
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
                  {hasSubmittedNegotiatedPrice ? (
                    <p className="my-jobs-price-status">
                      {priceStatus || 'Negotiated price submitted for this booking.'}
                    </p>
                  ) : (
                    <>
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
                          onFocus={() => setIsPriceInputFocused(true)}
                          onBlur={() => setIsPriceInputFocused(false)}
                          onChange={(e) => {
                            hasPriceDraftRef.current = true;
                            setPriceInput(e.target.value);
                          }}
                          placeholder="0.00"
                        />
                      </div>
                      <button type="button" className="my-jobs-price-submit" onClick={handleSubmitPrice}>
                        Submit agreed price
                      </button>
                      {priceStatus && <p className="my-jobs-price-status">{priceStatus}</p>}
                    </>
                  )}
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
