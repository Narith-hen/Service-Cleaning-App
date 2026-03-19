import React, { useEffect, useState } from 'react';
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  MessageOutlined,
  DeleteOutlined,
  StarOutlined
} from '@ant-design/icons';
import '../../../styles/customer/notification.scss';
import {
  loadCustomerNotifications,
  saveCustomerNotifications,
  timeAgo
} from '../../../utils/bookingSync';

const seedNotifications = [
  {
    id: 1,
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your regular cleaning booking for Oct 24 at 2:00 PM has been confirmed.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    color: '#10b981'
  },
  {
    id: 2,
    type: 'reminder',
    title: 'Upcoming Appointment',
    message: 'You have a deep cleaning appointment tomorrow at 10:00 AM.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: false,
    color: '#f59e0b'
  }
];

const areNotificationsEqual = (left = [], right = []) =>
  JSON.stringify(left) === JSON.stringify(right);

const NotificationPage = () => {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(() =>
    loadCustomerNotifications(seedNotifications)
  );

  useEffect(() => {
    saveCustomerNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    const sync = () => {
      const nextNotifications = loadCustomerNotifications(seedNotifications);
      setNotifications((prev) =>
        areNotificationsEqual(prev, nextNotifications) ? prev : nextNotifications
      );
    };

    window.addEventListener('storage', sync);
    window.addEventListener('booking-storage-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('booking-storage-updated', sync);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  return (
    <div className="notification-page">
      <section className="notification-hero" data-customer-reveal>
        <div>
          <div className="header-title">
            <h1>Notifications</h1>
            {unreadCount > 0 && <span className="unread-badge">{unreadCount} unread</span>}
          </div>
          <p className="notification-subtitle">
            Stay on top of booking approvals, cleaner updates, reminders, and service follow-ups.
          </p>
        </div>
      </section>

      <section className="notification-shell notification-shell--single" data-customer-reveal style={{ '--customer-reveal-delay': 1 }}>
        <div className="notification-main-card" data-customer-panel>
          <div className="page-header">
            <div className="header-actions">
              <button
                className="mark-all-btn"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                data-customer-button
              >
                Mark all as read
              </button>
            </div>
          </div>

          <div className="filter-tabs">
            <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} data-customer-button>
              All ({notifications.length})
            </button>
            <button className={`tab-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')} data-customer-button>
              Unread ({unreadCount})
            </button>
            <button className={`tab-btn ${filter === 'read' ? 'active' : ''}`} onClick={() => setFilter('read')} data-customer-button>
              Read ({notifications.length - unreadCount})
            </button>
          </div>

          <div className="notifications-list">
            {filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <BellOutlined className="empty-icon" />
                <h3>No notifications</h3>
                <p>You're all caught up! Check back later for updates.</p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => {
                const derivedIcon =
                  notification.type === 'booking' ? <CheckCircleOutlined />
                    : notification.type === 'reminder' ? <ClockCircleOutlined />
                    : notification.type === 'review' ? <StarOutlined />
                    : notification.type === 'payment' ? <DollarOutlined />
                    : <MessageOutlined />;
                const derivedColor = notification.color || '#3b82f6';

                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleMarkAsRead(notification.id)}
                    data-customer-reveal
                    data-customer-card
                    style={{ '--customer-reveal-delay': Math.min(index % 4, 3) }}
                  >
                    <div
                      className="notification-icon"
                      style={{ backgroundColor: `${derivedColor}20`, color: derivedColor }}
                    >
                      {derivedIcon}
                    </div>

                    <div className="notification-content">
                      <div className="notification-header">
                        <h3>{notification.title}</h3>
                        <span className="notification-time">
                          {notification.createdAt ? timeAgo(notification.createdAt) : ''}
                        </span>
                      </div>
                      <p className="notification-message">{notification.message}</p>
                    </div>

                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      data-customer-button
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default NotificationPage;
