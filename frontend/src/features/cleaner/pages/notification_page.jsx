import React, { useEffect, useMemo, useState } from 'react';
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  MessageOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../stores/useNotification.store';
import '../../../styles/cleaner/notification.scss';

const timeAgo = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getNotificationIcon = (type) => {
  switch (String(type || '').toLowerCase()) {
    case 'request':
      return <FileTextOutlined />;
    case 'progress':
      return <SyncOutlined spin={false} />;
    case 'complete':
      return <CheckCircleOutlined />;
    case 'chat':
      return <MessageOutlined />;
    default:
      return <BellOutlined />;
  }
};

const NotificationPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  useEffect(() => {
    const syncNotifications = () => {
      fetchNotifications(true);
    };

    window.addEventListener('storage', syncNotifications);
    window.addEventListener('cleaner-notifications-updated', syncNotifications);
    return () => {
      window.removeEventListener('storage', syncNotifications);
      window.removeEventListener('cleaner-notifications-updated', syncNotifications);
    };
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((item) => !item.is_read);
    if (filter === 'read') return notifications.filter((item) => item.is_read);
    return notifications;
  }, [filter, notifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="cleaner-notification-page">
      <section className="cleaner-notification-hero">
        <div>
          <div className="cleaner-notification-title">
            <h1>Notifications</h1>
            {unreadCount > 0 && <span className="cleaner-notification-badge">{unreadCount} unread</span>}
          </div>
          <p>
            Track real cleaner updates like new requests, in-progress jobs, completed jobs, and new chats.
          </p>
        </div>
      </section>

      <section className="cleaner-notification-card">
        <div className="cleaner-notification-toolbar">
          <div className="cleaner-notification-tabs">
            <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              All ({notifications.length})
            </button>
            <button type="button" className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>
              Unread ({unreadCount})
            </button>
            <button type="button" className={filter === 'read' ? 'active' : ''} onClick={() => setFilter('read')}>
              Read ({Math.max(0, notifications.length - unreadCount)})
            </button>
          </div>

          <button
            type="button"
            className="cleaner-mark-all-btn"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
        </div>

        <div className="cleaner-notification-list">
          {loading ? (
            <div className="cleaner-notification-empty">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="cleaner-notification-empty">
              <BellOutlined />
              <h3>No notifications</h3>
              <p>You are all caught up for now.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`cleaner-notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={`cleaner-notification-icon type-${notification.type || 'default'}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="cleaner-notification-content">
                  <div className="cleaner-notification-head">
                    <h3>{notification.title}</h3>
                    <span>{timeAgo(notification.created_at)}</span>
                  </div>
                  <p>{notification.message || 'Open to view this update.'}</p>
                </div>

                <button
                  type="button"
                  className="cleaner-notification-delete"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <DeleteOutlined />
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default NotificationPage;
