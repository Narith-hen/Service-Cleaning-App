import React, { useState } from 'react';
import { BellOutlined, SlidersOutlined, CheckOutlined } from '@ant-design/icons';
import '../../../styles/cleaner/settings.scss';

const SettingsPage = () => {
  const [selectedTypes, setSelectedTypes] = useState(['Home Cleaning', 'Office Cleaning']);
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    smsUpdates: false
  });

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const jobTypes = ['Home Cleaning', 'Office Cleaning', 'Deep Cleaning', 'Sanitation'];

  return (
    <div className="cleaner-settings-page">
      <div className="settings-headline">
        <h1>Account Settings</h1>
        <p>Manage your service radius, job preferences, and notifications.</p>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <h2>
            <SlidersOutlined /> Service Preferences
          </h2>

          <div className="section-label">PREFERRED JOB TYPES</div>
          <div className="job-types-grid">
            {jobTypes.map((type) => {
              const active = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  className={`type-chip ${active ? 'active' : ''}`}
                  onClick={() => toggleType(type)}
                >
                  <span className="check">{active ? <CheckOutlined /> : null}</span>
                  {type}
                </button>
              );
            })}
          </div>

          <div className="radius-row">
            <span className="section-label">SERVICE RADIUS (MILES)</span>
            <strong>15 mi</strong>
          </div>
          <div className="radius-track">
            <span />
          </div>
          <div className="radius-scale">
            <span>1 MI</span>
            <span>50 MI</span>
          </div>

          <button type="button" className="save-btn">
            Save Preferences
          </button>
        </section>

        <section className="settings-card">
          <h2>
            <BellOutlined /> Notification Settings
          </h2>

          <div className="section-label dark">COMMUNICATION</div>

          <div className="notify-list">
            <div className="notify-row">
              <div>
                <h3>Email Alerts</h3>
                <p>New jobs and payment updates</p>
              </div>
              <button
                type="button"
                className={`toggle ${notifications.emailAlerts ? 'on' : ''}`}
                onClick={() => toggleNotification('emailAlerts')}
                aria-label="Toggle Email Alerts"
              >
                <span />
              </button>
            </div>

            <div className="notify-row">
              <div>
                <h3>Push Notifications</h3>
                <p>Direct messages and job reminders</p>
              </div>
              <button
                type="button"
                className={`toggle ${notifications.pushNotifications ? 'on' : ''}`}
                onClick={() => toggleNotification('pushNotifications')}
                aria-label="Toggle Push Notifications"
              >
                <span />
              </button>
            </div>

            <div className="notify-row">
              <div>
                <h3>SMS Updates</h3>
                <p>Urgent schedule changes only</p>
              </div>
              <button
                type="button"
                className={`toggle ${notifications.smsUpdates ? 'on' : ''}`}
                onClick={() => toggleNotification('smsUpdates')}
                aria-label="Toggle SMS Updates"
              >
                <span />
              </button>
            </div>
          </div>

          <button type="button" className="update-btn">
            Update Notifications
          </button>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
