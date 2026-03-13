import React, { useState } from 'react';
import {
  EditOutlined,
  CloseOutlined,
  PlusOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { Input, Button, Switch, message } from 'antd';
import '../../../styles/cleaner/settings.scss';

const SettingsPage = () => {
  const [profile, setProfile] = useState({
    companyName: 'SovaClean Services',
    email: 'contact@sovaclean.com',
    phone: '+855 12 345 678',
    website: 'www.sovaclean.com',
    description: 'Professional cleaning services offering residential and commercial cleaning solutions. We specialize in deep cleaning, move-in/out cleaning, and regular maintenance cleaning.'
  });

  const [serviceAreas, setServiceAreas] = useState([
    { id: 1, name: 'Downtown' },
    { id: 2, name: 'Riverside' },
    { id: 3, name: 'West End' }
  ]);

  const [newArea, setNewArea] = useState('');

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailPayments: true,
    smsReminders: false
  });

  const [schedule, setSchedule] = useState([
    { id: 1, day: 'Monday', status: 'available', startTime: '09:00', endTime: '17:00' },
    { id: 2, day: 'Tuesday', status: 'available', startTime: '09:00', endTime: '17:00' },
    { id: 3, day: 'Wednesday', status: 'available', startTime: '09:00', endTime: '17:00' },
    { id: 4, day: 'Thursday', status: 'available', startTime: '09:00', endTime: '17:00' },
    { id: 5, day: 'Friday', status: 'available', startTime: '09:00', endTime: '17:00' },
    { id: 6, day: 'Saturday', status: 'available', startTime: '09:00', endTime: '14:00' },
    { id: 0, day: 'Sunday', status: 'closed', startTime: '', endTime: '' }
  ]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddArea = () => {
    if (newArea.trim()) {
      setServiceAreas((prev) => [
        ...prev,
        { id: Date.now(), name: newArea.trim() }
      ]);
      setNewArea('');
    }
  };

  const handleRemoveArea = (id) => {
    setServiceAreas((prev) => prev.filter((area) => area.id !== id));
  };

  const handleNotificationChange = (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleProfileFieldChange = (field) => (event) => {
    const value = event.target.value;
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (profileMessage) setProfileMessage('');
  };

  const handleSaveProfile = async () => {
    const cleanedName = String(profile.companyName || '').trim();
    if (!cleanedName) {
      setProfileMessage('Company name is required.');
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage('');

    // Simulate API call - replace with actual API call
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Here you would typically make an API call like:
      // const result = await updateUser(payload);
      console.log('Profile saved successfully:', {
        companyName: cleanedName,
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        description: profile.description
      });
      
      setProfileMessage('Profile updated successfully.');
      message.success('Profile updated successfully!');
    } catch (error) {
      setProfileMessage('Unable to save profile.');
      message.error('Failed to update profile');
    }
    setIsSavingProfile(false);
  };

  const handleSaveSchedule = () => {
    message.success('Schedule updated successfully!');
  };

  return (
    <div className="cleaner-settings-page">
      <div className="settings-container">
        <h1 className="settings-page-title">Settings</h1>
        <p className="settings-page-subtitle">Manage your service provider profile and preferences</p>

        {/* Card 1: Profile Information */}
        <section className="settings-card">
          <div className="settings-card-header">
            <h2>Profile Information</h2>
            <p>Update your business details and contact information</p>
          </div>

          <div className="settings-card-body">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar">
                  <span>SC</span>
                </div>
                <button type="button" className="avatar-edit-badge" aria-label="Edit avatar">
                  <EditOutlined />
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Company Name</label>
                <Input
                  value={profile.companyName}
                  onChange={(e) => handleProfileChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <Input
                  value={profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Website (Optional)</label>
                <Input
                  value={profile.website}
                  onChange={(e) => handleProfileChange('website', e.target.value)}
                  placeholder="Enter website URL"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Service Description</label>
              <Input.TextArea
                value={profile.description}
                onChange={(e) => handleProfileChange('description', e.target.value)}
                placeholder="Describe your cleaning services..."
                rows={4}
              />
            </div>

            <div className="form-actions">
              <Button 
                type="primary" 
                onClick={handleSaveProfile}
                loading={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            {profileMessage && (
              <div className={`profile-message ${profileMessage.includes('success') ? 'success' : 'error'}`}>
                {profileMessage}
              </div>
            )}
          </div>
        </section>

        {/* Card 2: Service Areas & Notifications */}
        <section className="settings-card settings-card-split">
          {/* Left: Service Areas */}
          <div className="settings-card-half">
            <div className="settings-card-header">
              <h2>
                <EnvironmentOutlined /> Service Areas
              </h2>
              <p>Manage the locations you serve</p>
            </div>

            <div className="settings-card-body">
              <div className="service-areas-chips">
                {serviceAreas.map((area) => (
                  <span key={area.id} className="area-chip">
                    {area.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(area.id)}
                      aria-label={`Remove ${area.name}`}
                    >
                      <CloseOutlined />
                    </button>
                  </span>
                ))}
              </div>

              <div className="add-area-form">
                <Input
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="Add new area"
                  onPressEnter={handleAddArea}
                />
                <Button type="primary" onClick={handleAddArea}>
                  <PlusOutlined /> Add
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Notifications */}
          <div className="settings-card-half">
            <div className="settings-card-header">
              <h2>Notifications</h2>
              <p>Manage your notification preferences</p>
            </div>

            <div className="settings-card-body">
              <div className="notification-row">
                <div className="notification-info">
                  <span className="notification-label">Booking Alerts</span>
                  <span className="notification-desc">Receive notifications for new booking requests</span>
                </div>
                <Switch
                  checked={notifications.emailBookings}
                  onChange={(checked) => handleNotificationChange('emailBookings', checked)}
                  className="notification-switch"
                />
              </div>

              <div className="notification-row">
                <div className="notification-info">
                  <span className="notification-label">Payment Updates</span>
                  <span className="notification-desc">Get notified when payments are processed</span>
                </div>
                <Switch
                  checked={notifications.emailPayments}
                  onChange={(checked) => handleNotificationChange('emailPayments', checked)}
                  className="notification-switch"
                />
              </div>

              <div className="notification-row">
                <div className="notification-info">
                  <span className="notification-label">SMS Reminders</span>
                  <span className="notification-desc">Receive SMS reminders for upcoming jobs</span>
                </div>
                <Switch
                  checked={notifications.smsReminders}
                  onChange={(checked) => handleNotificationChange('smsReminders', checked)}
                  className="notification-switch"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Card 3: Availability Schedule */}
        <section className="settings-card">
          <div className="settings-card-header">
            <h2>Availability Schedule</h2>
            <p>Set your working days and hours</p>
          </div>

          <div className="settings-card-body">
            <div className="schedule-table-wrapper">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((day) => (
                    <tr key={day.id}>
                      <td className="day-cell">{day.day}</td>
                      <td>
                        <span className={`status-badge ${day.status}`}>
                          {day.status === 'available' ? 'Available' : 'Closed'}
                        </span>
                      </td>
                      <td>
                        {day.status === 'available' ? (
                          <Input
                            type="time"
                            value={day.startTime}
                            className="time-input"
                            disabled={day.status === 'closed'}
                          />
                        ) : (
                          <span className="na-text">N/A</span>
                        )}
                      </td>
                      <td>
                        {day.status === 'available' ? (
                          <Input
                            type="time"
                            value={day.endTime}
                            className="time-input"
                            disabled={day.status === 'closed'}
                          />
                        ) : (
                          <span className="na-text">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <Button type="primary" onClick={handleSaveSchedule}>
                Save Schedule
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
