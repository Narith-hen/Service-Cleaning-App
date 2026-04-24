import React, { useEffect, useMemo, useState } from 'react';
import {
  BellOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
  InboxOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/theme_context';
import { useTranslation } from '../../../contexts/translation_context';
import { useNotificationStore } from '../stores/notification.store';
import '../../../styles/admin/notifications_page.css';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All', icon: <BellOutlined /> },
  { key: 'new_request', label: 'New Requests', icon: <InboxOutlined /> },
  { key: 'completed', label: 'Completed', icon: <CheckCircleOutlined /> },
  { key: 'unread', label: 'Unread', icon: <CheckOutlined /> }
];

const formatNotificationTime = (value) => {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return '';
  }
};

const AdminNotificationsPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { ta } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const notificationStats = useMemo(() => {
    const newRequests = notifications.filter((notification) => notification.category === 'new_request').length;
    const completed = notifications.filter((notification) => notification.category === 'completed').length;

    return {
      total: notifications.length,
      newRequests,
      completed,
      unread: unreadCount
    };
  }, [notifications, unreadCount]);

  const filteredNotifications = useMemo(() => notifications.filter((notification) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.is_read;
    return notification.category === activeFilter;
  }), [activeFilter, notifications]);

  const handleOpenNotification = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <section className={`admin-notifications-page ${darkMode ? 'dark-mode' : ''}`}>
      <header className="admin-notifications-hero">
        <div>
          <p className="admin-notifications-eyebrow">{ta('Notifications')}</p>
          <h1 className="admin-page-title">{ta('Admin Notifications')}</h1>
          <p className="admin-page-subtitle">
            {ta('Review new booking requests and completed services from one place.')}
          </p>
        </div>

        <div className="admin-notifications-actions">
          <button
            type="button"
            className="notifications-ghost-btn"
            onClick={() => fetchNotifications(true)}
            disabled={loading}
          >
            <ReloadOutlined spin={loading} />
            <span>{ta('Refresh')}</span>
          </button>
          <button
            type="button"
            className="notifications-primary-btn"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckOutlined />
            <span>{ta('Mark all read')}</span>
          </button>
        </div>
      </header>

      <section className="admin-notifications-summary-grid">
        <article className="admin-notifications-summary-card">
          <span>{ta('Total Alerts')}</span>
          <strong>{notificationStats.total}</strong>
          <p>{ta('All active notification items for booking activity.')}</p>
        </article>
        <article className="admin-notifications-summary-card">
          <span>{ta('New Requests')}</span>
          <strong>{notificationStats.newRequests}</strong>
          <p>{ta('Fresh customer requests waiting for admin attention.')}</p>
        </article>
        <article className="admin-notifications-summary-card">
          <span>{ta('Completed Jobs')}</span>
          <strong>{notificationStats.completed}</strong>
          <p>{ta('Bookings that already reached completed status.')}</p>
        </article>
        <article className="admin-notifications-summary-card">
          <span>{ta('Unread')}</span>
          <strong>{notificationStats.unread}</strong>
          <p>{ta('Notifications you have not opened yet.')}</p>
        </article>
      </section>

      <section className="admin-notifications-panel">
        <div className="admin-notifications-filters">
          {FILTER_OPTIONS.map((option) => {
            const count = option.key === 'all'
              ? notificationStats.total
              : option.key === 'new_request'
                ? notificationStats.newRequests
                : option.key === 'completed'
                  ? notificationStats.completed
                  : notificationStats.unread;

            return (
              <button
                key={option.key}
                type="button"
                className={`notification-filter-btn ${activeFilter === option.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(option.key)}
              >
                {option.icon}
                <span>{ta(option.label)}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </div>

        <div className="admin-notification-list">
          {loading && notifications.length === 0 ? (
            <div className="admin-notification-empty">
              <ReloadOutlined spin />
              <h3>{ta('Loading...')}</h3>
            </div>
          ) : error && notifications.length === 0 ? (
            <div className="admin-notification-empty">
              <BellOutlined />
              <h3>{ta('Unable to load notifications right now.')}</h3>
              <p>{error}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="admin-notification-empty">
              <BellOutlined />
              <h3>{ta('No notifications')}</h3>
              <p>{ta('You are all caught up on completed jobs and new requests.')}</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`admin-notification-card ${notification.category} ${!notification.is_read ? 'unread' : ''}`}
              >
                <div className="admin-notification-icon">
                  {notification.category === 'completed' ? <CheckCircleOutlined /> : <InboxOutlined />}
                </div>

                <div className="admin-notification-body">
                  <div className="admin-notification-meta">
                    <span className={`notification-tag ${notification.category}`}>
                      {notification.category === 'completed' ? ta('Completed') : ta('New Request')}
                    </span>
                    <span className="notification-time">{formatNotificationTime(notification.created_at)}</span>
                  </div>

                  <h3>{ta(notification.title)}</h3>
                  <p>{notification.message}</p>

                  <div className="admin-notification-footer">
                    <span>{ta('Booking')} #{notification.bookingId}</span>
                    <span>{notification.customerName}</span>
                    <span>{notification.serviceName}</span>
                  </div>
                </div>

                <div className="admin-notification-actions">
                  <button
                    type="button"
                    className="notification-open-btn"
                    onClick={() => handleOpenNotification(notification)}
                  >
                    {ta('Open booking')}
                  </button>
                  <button
                    type="button"
                    className="notification-delete-btn"
                    onClick={() => deleteNotification(notification.id)}
                    aria-label={ta('Dismiss notification')}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
};

export default AdminNotificationsPage;
