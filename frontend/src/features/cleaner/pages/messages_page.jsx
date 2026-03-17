import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import CleanerMessagePanel from '../components/cleaner_message_panel';
import officeImage from '../../../assets/office.png';
import api from '../../../services/api';
import { useChatStore } from '../../../store/chatStore';
import '../../../styles/cleaner/my_jobs.scss';
import '../../../styles/cleaner/messages.scss';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';
const fallbackThreads = [];

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

const MessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(
    searchParams.get('thread') || searchParams.get('booking')
  );
  const [threadPreviews, setThreadPreviews] = useState({});
  const unreadByThread = useChatStore((state) => state.unreadByThread);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setThreads([]);
        return;
      }
      const normalized = parsed.filter(Boolean).map(normalizeThread);
      setThreads(normalized);
    } catch {
      setThreads([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPreviews = async () => {
      if (!threads.length) {
        setThreadPreviews({});
        return;
      }

      if (!getAuthToken()) {
        const fallbackMap = threads.reduce((acc, thread) => {
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
          threads.map(async (thread) => {
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
    const paramThreadId = searchParams.get('thread') || searchParams.get('booking');
    if (paramThreadId && paramThreadId !== activeThreadId) {
      setActiveThreadId(paramThreadId);
    }
  }, [searchParams, activeThreadId]);

  useEffect(() => {
    if (!threads.length) return;
    const normalizedActive = String(activeThreadId || '');
    const exists = threads.some((thread) =>
      String(thread.sourceRequestId || thread.id) === normalizedActive
    );
    if (exists) return;
    const first = threads[0];
    const nextId = String(first.sourceRequestId || first.id);
    const params = new URLSearchParams(searchParams);
    params.set('thread', nextId);
    setSearchParams(params, { replace: true });
    setActiveThreadId(nextId);
  }, [threads, activeThreadId, searchParams, setSearchParams]);

  const activeThread = useMemo(() => {
    if (!threads.length) return null;
    const activeId = String(activeThreadId || '');
    return (
      threads.find((thread) => String(thread.sourceRequestId || thread.id) === activeId)
      || threads[0]
    );
  }, [threads, activeThreadId]);

  const handleSelectThread = (thread) => {
    const nextId = String(thread.sourceRequestId || thread.id);
    const params = new URLSearchParams(searchParams);
    params.set('thread', nextId);
    setSearchParams(params, { replace: true });
    setActiveThreadId(nextId);
  };

  if (!threads.length) {
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
    ? `${activeThread.monthYear} ${activeThread.day}, ${activeThread.timeRange}`
    : '';

  return (
    <div className="cleaner-messages-page">
      <div className="cleaner-messages-header">
        <div>
          <p className="cleaner-messages-kicker">Conversations</p>
          <h1>Messages</h1>
        </div>
        <span className="cleaner-messages-count">{threads.length} threads</span>
      </div>

      <div className="cleaner-messages-shell">
        <aside className="cleaner-messages-list">
          <div className="cleaner-messages-list-header">
            <strong>All chats</strong>
            <MessageOutlined />
          </div>
          <div className="cleaner-messages-thread-list">
            {threads.map((thread) => {
              const threadId = String(thread.sourceRequestId || thread.id);
              const isActive = String(activeThread?.sourceRequestId || activeThread?.id) === threadId;
              const preview = threadPreviews[threadId] || 'Tap to open conversation.';
              const unreadCount = unreadByThread[threadId] || 0;
              return (
                <button
                  key={threadId}
                  type="button"
                  className={`cleaner-messages-thread ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectThread(thread)}
                >
                  <div className="thread-avatar">{thread.customer.charAt(0)}</div>
                  <div className="thread-meta">
                    <strong>{thread.customer}</strong>
                    <span>{preview}</span>
                  </div>
                  <div className="thread-meta-right">
                    <span className="thread-time">{thread.timeRange}</span>
                    {unreadCount > 0 && (
                      <span className="thread-unread">{unreadCount}</span>
                    )}
                  </div>
                </button>
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
                      <strong>{activeThread.location}</strong>
                    </div>
                  </div>
                </div>

                <div className="my-jobs-checklist-card">
                  <h6>Checklist Preview</h6>
                  <ul>
                    <li><CheckCircleOutlined /> Kitchen Deep Clean</li>
                    <li><CheckCircleOutlined /> Bathroom Sanitization</li>
                    <li><ClockCircleOutlined /> Window Cleaning (Pending)</li>
                  </ul>
                </div>

                <button type="button" className="my-jobs-contract-btn">
                  <FileTextOutlined /> View Full Job Contract
                </button>

                <div className="my-jobs-map-preview" />
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
