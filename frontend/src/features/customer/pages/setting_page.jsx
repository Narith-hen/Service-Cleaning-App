import React, { useState } from 'react';

const SettingPage = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    promotions: true,
    bookingReminders: true
  });

  const [language, setLanguage] = useState('english');
  const [theme, setTheme] = useState('light');

  const handleNotificationChange = (type) => {
    setNotifications({
      ...notifications,
      [type]: !notifications[type]
    });
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Settings</h1>

      {/* Notification Settings */}
      <div style={{ 
        background: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginBottom: '15px' }}>Notifications</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={notifications.email}
              onChange={() => handleNotificationChange('email')}
              style={{ marginRight: '10px' }}
            />
            Email Notifications
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={notifications.sms}
              onChange={() => handleNotificationChange('sms')}
              style={{ marginRight: '10px' }}
            />
            SMS Notifications
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={notifications.promotions}
              onChange={() => handleNotificationChange('promotions')}
              style={{ marginRight: '10px' }}
            />
            Promotions & Offers
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={notifications.bookingReminders}
              onChange={() => handleNotificationChange('bookingReminders')}
              style={{ marginRight: '10px' }}
            />
            Booking Reminders
          </label>
        </div>
      </div>

      {/* Language Settings */}
      <div style={{ 
        background: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginBottom: '15px' }}>Language</h3>
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ 
            padding: '10px', 
            width: '100%', 
            borderRadius: '5px',
            border: '1px solid #ddd'
          }}
        >
          <option value="english">English</option>
          <option value="khmer">ភាសាខ្មែរ (Khmer)</option>
          <option value="chinese">中文 (Chinese)</option>
          <option value="french">Français (French)</option>
        </select>
      </div>

      {/* Theme Settings */}
      <div style={{ 
        background: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginBottom: '15px' }}>Theme</h3>
        <div style={{ display: 'flex', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="radio" 
              name="theme" 
              value="light"
              checked={theme === 'light'}
              onChange={(e) => setTheme(e.target.value)}
              style={{ marginRight: '5px' }}
            />
            Light
          </label>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="radio" 
              name="theme" 
              value="dark"
              checked={theme === 'dark'}
              onChange={(e) => setTheme(e.target.value)}
              style={{ marginRight: '5px' }}
            />
            Dark
          </label>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="radio" 
              name="theme" 
              value="system"
              checked={theme === 'system'}
              onChange={(e) => setTheme(e.target.value)}
              style={{ marginRight: '5px' }}
            />
            System Default
          </label>
        </div>
      </div>

      {/* Privacy Settings */}
      <div style={{ 
        background: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginBottom: '15px' }}>Privacy</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" style={{ marginRight: '10px' }} />
            Show my profile to other users
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" style={{ marginRight: '10px' }} />
            Allow others to see my booking history
          </label>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave}
        style={{
          padding: '12px 30px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Save Settings
      </button>

      <button 
        style={{
          padding: '12px 30px',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Cancel
      </button>

      {/* Danger Zone */}
      <div style={{ 
        marginTop: '40px',
        padding: '20px',
        border: '2px solid #dc3545',
        borderRadius: '10px',
        background: '#fff5f5'
      }}>
        <h3 style={{ color: '#dc3545', marginBottom: '10px' }}>Danger Zone</h3>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button 
          style={{
            padding: '10px 20px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default SettingPage;