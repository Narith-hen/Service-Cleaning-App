import React, { useState } from 'react';

const SettingPage = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    bookingReminders: true,
    profileVisible: true,
    bookingHistoryVisible: false
  });
  const [language, setLanguage] = useState('english');
  const [theme, setTheme] = useState('light');

  const handleNotificationChange = (type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="customer-simple-page">
      <section className="customer-simple-page__hero" data-customer-reveal>
        <span className="customer-simple-page__eyebrow">Preferences</span>
        <h1>Settings</h1>
        <p>
          Update how you receive notifications, choose your preferred language, and keep your
          privacy settings aligned with how you use the customer portal.
        </p>
      </section>

      <div className="customer-simple-grid customer-simple-grid--two">
        <section
          className="customer-simple-card customer-simple-stack"
          data-customer-reveal
          data-customer-panel
          style={{ '--customer-reveal-delay': 1 }}
        >
          <div>
            <h2>Notifications</h2>
            <p className="customer-note">Choose which updates should reach you first.</p>
          </div>

          <div className="customer-simple-stack">
            <div className="customer-toggle-row" data-customer-card>
              <div className="customer-toggle-row__copy">
                <strong>Email Notifications</strong>
                <span>Booking confirmations and service updates in your inbox.</span>
              </div>
              <button type="button" className={`customer-switch ${notifications.email ? 'active' : ''}`} onClick={() => handleNotificationChange('email')} data-customer-button />
            </div>

            <div className="customer-toggle-row" data-customer-card>
              <div className="customer-toggle-row__copy">
                <strong>SMS Notifications</strong>
                <span>Receive short reminders when your cleaner is on the way.</span>
              </div>
              <button type="button" className={`customer-switch ${notifications.sms ? 'active' : ''}`} onClick={() => handleNotificationChange('sms')} data-customer-button />
            </div>

            <div className="customer-toggle-row" data-customer-card>
              <div className="customer-toggle-row__copy">
                <strong>Booking Reminders</strong>
                <span>Helpful reminders before your scheduled cleaning session.</span>
              </div>
              <button type="button" className={`customer-switch ${notifications.bookingReminders ? 'active' : ''}`} onClick={() => handleNotificationChange('bookingReminders')} data-customer-button />
            </div>
          </div>
        </section>

        <section
          className="customer-simple-card customer-simple-stack"
          data-customer-reveal
          data-customer-panel
          style={{ '--customer-reveal-delay': 2 }}
        >
          <div>
            <h2>Language & Theme</h2>
            <p className="customer-note">Tailor the interface to match your workflow.</p>
          </div>

          <div className="customer-field-group">
            <label htmlFor="customer-language">
              Language
              <select id="customer-language" value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="english">English</option>
                <option value="khmer">Khmer</option>
                <option value="chinese">Chinese</option>
                <option value="french">French</option>
              </select>
            </label>
          </div>

          <div>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '10px' }}>Theme Preference</strong>
            <div className="customer-chip-row">
              {['light', 'dark', 'system'].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`customer-chip-button ${theme === option ? 'active' : ''}`}
                  onClick={() => setTheme(option)}
                  data-customer-button
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="customer-simple-card customer-simple-stack" data-customer-reveal data-customer-panel style={{ '--customer-reveal-delay': 2, marginTop: '18px' }}>
        <div>
          <h2>Privacy</h2>
          <p className="customer-note">Control what others can see about your activity.</p>
        </div>

        <div className="customer-simple-stack">
          <div className="customer-toggle-row" data-customer-card>
            <div className="customer-toggle-row__copy">
              <strong>Show my profile to other users</strong>
              <span>Allow cleaners to view your public customer profile.</span>
            </div>
            <button type="button" className={`customer-switch ${notifications.profileVisible ? 'active' : ''}`} onClick={() => handleNotificationChange('profileVisible')} data-customer-button />
          </div>

          <div className="customer-toggle-row" data-customer-card>
            <div className="customer-toggle-row__copy">
              <strong>Allow others to see booking history</strong>
              <span>Share previous service activity when it helps build trust.</span>
            </div>
            <button type="button" className={`customer-switch ${notifications.bookingHistoryVisible ? 'active' : ''}`} onClick={() => handleNotificationChange('bookingHistoryVisible')} data-customer-button />
          </div>
        </div>

        <div className="customer-inline-actions">
          <button type="button" className="customer-primary-button" onClick={handleSave} data-customer-button>
            Save Settings
          </button>
          <button type="button" className="customer-secondary-button" data-customer-button>
            Cancel
          </button>
        </div>
      </section>

      <section className="customer-danger-card" data-customer-reveal style={{ '--customer-reveal-delay': 3, marginTop: '18px' }}>
        <h3>Danger Zone</h3>
        <p>Once you delete your account, there is no going back. Please be certain.</p>
        <button type="button" className="customer-danger-button" data-customer-button>
          Delete Account
        </button>
      </section>
    </div>
  );
};

export default SettingPage;
