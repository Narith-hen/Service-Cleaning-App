import React, { useState } from 'react';
import { SettingOutlined } from '@ant-design/icons';
import '../../../styles/cleaner/notification.scss';
import profileImage from '../../../assets/narith.png';
import molikaImage from '../../../assets/molika.png';
import meyImage from '../../../assets/mey.JPG';

const notifications = [
  {
    id: 1,
    name: 'Polly',
    action: 'edited',
    title: 'Contact page',
    time: '36 mins ago',
    source: 'Craftwork Design',
    unread: true,
    avatar: profileImage,
    status: 'online',
    section: 'New'
  },
  {
    id: 2,
    name: 'James',
    action: 'left a comment on',
    title: 'ACME 2.1',
    time: '2 hours ago',
    source: 'ACME',
    unread: true,
    avatar: molikaImage,
    status: 'away',
    section: 'New'
  },
  {
    id: 3,
    name: 'Mary',
    action: 'shared the file',
    title: 'Isometric 2.0',
    time: '3 hours ago',
    source: 'Craftwork Design',
    unread: false,
    avatar: meyImage,
    status: 'online',
    section: 'Today'
  },
  {
    id: 4,
    name: 'Dima Phizeg',
    action: 'edited',
    title: 'ACME 2.1',
    time: '3 hours ago',
    source: 'ACME',
    unread: false,
    avatar: profileImage,
    section: 'Today'
  },
  {
    id: 5,
    name: 'James',
    action: 'created',
    title: 'Changelog page',
    time: '1 day ago',
    source: 'Blank',
    unread: false,
    avatar: molikaImage,
    section: 'Today'
  }
];

const NotificationPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const unreadCount = notifications.filter((item) => item.unread).length;

  const sections = ['New', 'Today'];
  const grouped = sections.map((section) => ({
    section,
    items: notifications.filter((item) => item.section === section)
  }));

  return (
    <div className="cleaner-notification-page">
      <div className="notification-card">
        <header className="notification-header">
          <h2>Notifications</h2>
          <button type="button" className="ghost-link">
            Mark all as read
          </button>
        </header>

        <div className="notification-tabs compact">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All <span className="count">{notifications.length}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Unread <span className="count muted">{unreadCount}</span>
          </button>
          <div className="tab-spacer" />
          <button type="button" className="icon-btn" aria-label="Settings">
            <SettingOutlined />
          </button>
        </div>

        <div className="notification-list">
          {grouped.map((group) => (
            <div key={group.section} className="notification-group">
              <div className="group-title">{group.section}</div>
              {group.items.map((item) => (
                <article key={item.id} className="notification-row">
                  <div className="avatar-wrap">
                    <img src={item.avatar} alt={item.name} />
                    {item.status && <span className={`status-dot ${item.status}`} />}
                  </div>
                  <div className="notification-body">
                    <p className="title">
                      <strong>{item.name}</strong> {item.action}{' '}
                      <strong>{item.title}</strong>
                    </p>
                    <p className="meta">
                      {item.time}
                      {item.source ? ` \u2022 ${item.source}` : ''}
                    </p>
                  </div>
                  {item.unread && <span className="unread-dot" />}
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
