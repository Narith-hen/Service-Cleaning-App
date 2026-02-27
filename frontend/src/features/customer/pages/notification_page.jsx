import React, { useState } from 'react';
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

const NotificationPage = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your regular cleaning booking for Oct 24 at 2:00 PM has been confirmed.',
      time: '2 hours ago',
      read: false,
      icon: <CheckCircleOutlined />,
      color: '#10b981'
    },
    {
      id: 2,
      type: 'reminder',
      title: 'Upcoming Appointment',
      message: 'You have a deep cleaning appointment tomorrow at 10:00 AM.',
      time: '5 hours ago',
      read: false,
      icon: <ClockCircleOutlined />,
      color: '#f59e0b'
    },
    {
      id: 3,
      type: 'review',
      title: 'Review Reminder',
      message: 'How was your cleaning with Maria? Leave a review now.',
      time: '1 day ago',
      read: true,
      icon: <StarOutlined />,
      color: '#f59e0b'
    },
    {
      id: 4,
      type: 'payment',
      title: 'Payment Successful',
      message: 'Your payment of $45.00 for regular cleaning was successful.',
      time: '2 days ago',
      read: true,
      icon: <DollarOutlined />,
      color: '#10b981'
    },
    {
      id: 5,
      type: 'message',
      title: 'New Message',
      message: 'Maria Garcia sent you a message about your upcoming booking.',
      time: '3 days ago',
      read: true,
      icon: <MessageOutlined />,
      color: '#3b82f6'
    },
    {
      id: 6,
      type: 'booking',
      title: 'Booking Rescheduled',
      message: 'Your window cleaning has been rescheduled to Oct 28 at 3:00 PM.',
      time: '4 days ago',
      read: true,
      icon: <CalendarOutlined />,
      color: '#ef4444'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
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
          filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div 
                className="notification-icon"
                style={{ backgroundColor: `${notification.color}20`, color: notification.color }}
              >
                {notification.icon}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                  <span className="notification-time">{notification.time}</span>
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
          ))
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