import React, { useEffect, useState } from 'react';
import { 
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  StarOutlined,
  DollarOutlined,
  MessageOutlined,
  DeleteOutlined,
  SettingOutlined
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
    icon: <CheckCircleOutlined />,
    color: '#10b981'
  },
  {
    id: 2,
    type: 'reminder',
    title: 'Upcoming Appointment',
    message: 'You have a deep cleaning appointment tomorrow at 10:00 AM.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: false,
    icon: <ClockCircleOutlined />,
    color: '#f59e0b'
  }
];

const NotificationPage = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [notifications, setNotifications] = useState(() =>
    loadCustomerNotifications(seedNotifications)
  );

  useEffect(() => {
    saveCustomerNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    const sync = () => setNotifications(loadCustomerNotifications(seedNotifications));
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
      <div className="page-header">
        <div className="header-title">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            className="mark-all-btn"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
          <button className="settings-btn">
            <SettingOutlined />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`tab-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button 
          className={`tab-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <BellOutlined className="empty-icon" />
            <h3>No notifications</h3>
            <p>You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const derivedIcon = notification.icon
              || (notification.type === 'booking' ? <CheckCircleOutlined />
                : notification.type === 'reminder' ? <ClockCircleOutlined />
                : notification.type === 'review' ? <StarOutlined />
                : notification.type === 'payment' ? <DollarOutlined />
                : <MessageOutlined />);
            const derivedColor = notification.color || '#3b82f6';
            return (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(notification.id)}
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
                >
                  <DeleteOutlined />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Notification Settings Preview */}
      <div className="settings-preview">
        <h3>Notification Settings</h3>
        <div className="setting-options">
          <div className="setting-option">
            <div className="setting-info">
              <h4>Booking Updates</h4>
              <p>Get notified about booking confirmations and changes</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-option">
            <div className="setting-info">
              <h4>Promotions & Offers</h4>
              <p>Receive special offers and discounts</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-option">
            <div className="setting-info">
              <h4>Review Reminders</h4>
              <p>Get reminded to leave reviews after cleanings</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-option">
            <div className="setting-info">
              <h4>Payment Notifications</h4>
              <p>Get updates about payments and invoices</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        <button className="manage-settings-btn">Manage All Settings</button>
      </div>
    </div>
  );
};

export default NotificationPage; // <-- THIS IS CRITICAL!
