import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BellOutlined,
  CameraOutlined,
  GlobalOutlined,
  LockOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { notification } from 'antd';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../contexts/theme_context';
import { settingsService } from '../services/settingsService';
import '../../../styles/admin/settings_page.css';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const normalizeAvatarUrl = (avatar) => {
  if (!avatar) return '';
  if (/^data:/i.test(avatar) || /^https?:\/\//i.test(avatar)) return avatar;
  if (String(avatar).startsWith('/')) return `${apiHost}${avatar}`;
  return avatar;
};

const getInitials = (firstName, lastName, fallback = 'Admin') => {
  const first = String(firstName || '').trim().charAt(0).toUpperCase();
  const last = String(lastName || '').trim().charAt(0).toUpperCase();
  return first || last ? `${first}${last}` : String(fallback).trim().charAt(0).toUpperCase() || 'A';
};

const SettingsPage = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const { user, updateUser, uploadAvatar } = useAuth();
  const { darkMode, setDarkMode, setLightMode } = useTheme();
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: ''
  });
  const [preferencesForm, setPreferencesForm] = useState({
    language: 'en',
    notificationEnabled: true,
    darkMode: false
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const nameParts = String(user?.name || '').trim().split(/\s+/).filter(Boolean);
    setProfileForm({
      firstName: user?.first_name || nameParts[0] || '',
      lastName: user?.last_name || nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      phone: user?.phone_number || user?.phone || '',
      city: user?.city || '',
      state: user?.state || '',
      country: user?.country || ''
    });
    setAvatarPreview(normalizeAvatarUrl(user?.avatar || ''));
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        setPreferencesLoading(true);
        const response = await settingsService.getSettings();
        const payload = response?.data || {};
        if (cancelled) return;

        const nextPreferences = {
          language: payload.language || 'en',
          notificationEnabled: Boolean(payload.notification_enabled ?? true),
          darkMode: Boolean(payload.dark_mode)
        };

        setPreferencesForm(nextPreferences);
        if (nextPreferences.darkMode) {
          setDarkMode();
        } else {
          setLightMode();
        }
      } catch (error) {
        if (cancelled) return;
        notificationApi.error({
          placement: 'bottomRight',
          message: 'Failed to load settings',
          description: error?.response?.data?.message || 'Could not load your admin preferences.',
          duration: 3
        });
      } finally {
        if (!cancelled) {
          setPreferencesLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [notificationApi, setDarkMode, setLightMode]);

  const displayName = useMemo(
    () => user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Admin User',
    [user]
  );

  const initials = useMemo(
    () => getInitials(user?.first_name, user?.last_name, displayName),
    [user, displayName]
  );

  const handleProfileChange = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePreferenceChange = (key, value) => {
    setPreferencesForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePasswordChange = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'Invalid image',
        description: 'Please choose an image file.',
        duration: 2
      });
      return;
    }

    setProfileLoading(true);
    try {
      if (user?.token) {
        const result = await uploadAvatar(file);
        if (!result?.success) {
          throw new Error(result?.error || 'Failed to upload avatar');
        }
        setAvatarPreview(normalizeAvatarUrl(result?.user?.avatar || user?.avatar || ''));
      } else {
        const reader = new FileReader();
        const previewUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(file);
        });
        const result = await updateUser({ avatar: previewUrl });
        if (!result?.success) {
          throw new Error(result?.error || 'Failed to update avatar');
        }
        setAvatarPreview(previewUrl);
      }

      notificationApi.success({
        placement: 'bottomRight',
        message: 'Profile image updated',
        duration: 2
      });
    } catch (error) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'Failed to update profile image',
        description: error?.message || 'Please try again.',
        duration: 3
      });
    } finally {
      setProfileLoading(false);
      event.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.email.trim()) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'Email is required',
        duration: 2
      });
      return;
    }

    setProfileLoading(true);
    try {
      const result = await updateUser({
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        email: profileForm.email,
        phone_number: profileForm.phone,
        city: profileForm.city,
        state: profileForm.state,
        country: profileForm.country
      });

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update admin profile');
      }

      notificationApi.success({
        placement: 'bottomRight',
        message: 'Profile updated successfully',
        duration: 2
      });
    } catch (error) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'Failed to update profile',
        description: error?.message || 'Please try again.',
        duration: 3
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setPreferencesSaving(true);
    try {
      await settingsService.updateSettings({
        language: preferencesForm.language,
        notification_enabled: preferencesForm.notificationEnabled,
        dark_mode: preferencesForm.darkMode
      });

      if (preferencesForm.darkMode) {
        setDarkMode();
      } else {
        setLightMode();
      }

      notificationApi.success({
        placement: 'bottomRight',
        message: 'Preferences saved',
        description: 'Your admin preferences were updated successfully.',
        duration: 2
      });
    } catch (error) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'Failed to save preferences',
        description: error?.response?.data?.message || 'Please try again.',
        duration: 3
      });
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'All password fields are required',
        duration: 2
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'New password must be at least 6 characters',
        duration: 2
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'Passwords do not match',
        duration: 2
      });
      return;
    }

    setPasswordSaving(true);
    try {
      await settingsService.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      notificationApi.success({
        placement: 'bottomRight',
        message: 'Password updated successfully',
        duration: 2
      });
    } catch (error) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'Failed to update password',
        description: error?.response?.data?.message || 'Please try again.',
        duration: 3
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const summaryCards = [
    {
      title: 'Language',
      value: preferencesForm.language === 'km' ? 'Khmer' : 'English',
      icon: <GlobalOutlined />,
      tone: 'blue',
      note: 'Saved in account settings'
    },
    {
      title: 'Notifications',
      value: preferencesForm.notificationEnabled ? 'Enabled' : 'Muted',
      icon: <BellOutlined />,
      tone: 'green',
      note: 'Platform alerts and updates'
    },
    {
      title: 'Theme',
      value: preferencesForm.darkMode ? 'Dark Mode' : 'Light Mode',
      icon: <MoonOutlined />,
      tone: 'amber',
      note: darkMode ? 'Currently active in admin UI' : 'Ready to switch when saved'
    }
  ];

  return (
    <section className="admin-settings-page">
      {contextHolder}
      <header className="admin-settings-header">
        <div>
          <h1 className="admin-page-title">Manage Settings</h1>
          <p className="admin-page-subtitle">Control your admin profile, interface preferences, and account security.</p>
        </div>
      </header>

      <section className="admin-settings-hero">
        <div className="settings-hero-profile">
          <button
            type="button"
            className="settings-avatar-button"
            onClick={handlePickAvatar}
            disabled={profileLoading}
            aria-label="Change profile image"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt={displayName} className="settings-avatar-image" />
            ) : (
              <span className="settings-avatar-fallback">{initials}</span>
            )}
            <span className="settings-avatar-edit">
              <CameraOutlined />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <div className="settings-hero-copy">
            <h2>{displayName}</h2>
            <p>{user?.email || 'No email available'}</p>
            <div className="settings-hero-tags">
              <span className="settings-chip positive">Administrator</span>
              <span className="settings-chip">Secure Access</span>
            </div>
          </div>
        </div>
        <div className="settings-hero-note">
          <SafetyCertificateOutlined />
          <div>
            <strong>Account Health</strong>
            <span>Keep your profile and preferences up to date so the admin workspace stays consistent across sessions.</span>
          </div>
        </div>
      </section>

      <section className="admin-settings-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.title} className="admin-settings-summary-card">
            <div className={`settings-summary-icon tone-${card.tone}`}>{card.icon}</div>
            <span className="settings-summary-label">{card.title}</span>
            <h3>{card.value}</h3>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <section className="admin-settings-grid">
        <article className="settings-panel">
          <div className="settings-panel-head">
            <div>
              <h3><UserOutlined /> Account Profile</h3>
              <p>Update the main admin contact details used across the platform.</p>
            </div>
          </div>

          <div className="settings-form-grid two-columns">
            <label className="settings-field">
              <span>First Name</span>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(event) => handleProfileChange('firstName', event.target.value)}
                placeholder="Enter first name"
              />
            </label>

            <label className="settings-field">
              <span>Last Name</span>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(event) => handleProfileChange('lastName', event.target.value)}
                placeholder="Enter last name"
              />
            </label>

            <label className="settings-field">
              <span>Email Address</span>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => handleProfileChange('email', event.target.value)}
                placeholder="Enter email address"
              />
            </label>

            <label className="settings-field">
              <span>Phone Number</span>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(event) => handleProfileChange('phone', event.target.value)}
                placeholder="Enter phone number"
              />
            </label>

            <label className="settings-field">
              <span>City</span>
              <input
                type="text"
                value={profileForm.city}
                onChange={(event) => handleProfileChange('city', event.target.value)}
                placeholder="Enter city"
              />
            </label>

            <label className="settings-field">
              <span>State / Province</span>
              <input
                type="text"
                value={profileForm.state}
                onChange={(event) => handleProfileChange('state', event.target.value)}
                placeholder="Enter state"
              />
            </label>

            <label className="settings-field full-width">
              <span>Country</span>
              <input
                type="text"
                value={profileForm.country}
                onChange={(event) => handleProfileChange('country', event.target.value)}
                placeholder="Enter country"
              />
            </label>
          </div>

          <div className="settings-panel-actions">
            <button type="button" className="settings-primary-button" onClick={handleSaveProfile} disabled={profileLoading}>
              <SaveOutlined />
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </article>

        <article className="settings-panel">
          <div className="settings-panel-head">
            <div>
              <h3><BellOutlined /> Preferences</h3>
              <p>Control interface defaults and how you receive admin notifications.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label className="settings-field">
              <span>Language</span>
              <select
                value={preferencesForm.language}
                onChange={(event) => handlePreferenceChange('language', event.target.value)}
                disabled={preferencesLoading}
              >
                <option value="en">English</option>
                <option value="km">Khmer</option>
              </select>
            </label>

            <div className="settings-toggle-card">
              <div>
                <strong>Notification Alerts</strong>
                <p>Receive platform and account activity updates.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch ${preferencesForm.notificationEnabled ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('notificationEnabled', !preferencesForm.notificationEnabled)}
                disabled={preferencesLoading}
                aria-pressed={preferencesForm.notificationEnabled}
              >
                <span />
              </button>
            </div>

            <div className="settings-toggle-card">
              <div>
                <strong>Dark Mode Preference</strong>
                <p>Save the theme mode you want applied in the admin interface.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch ${preferencesForm.darkMode ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('darkMode', !preferencesForm.darkMode)}
                disabled={preferencesLoading}
                aria-pressed={preferencesForm.darkMode}
              >
                <span />
              </button>
            </div>
          </div>

          <div className="settings-panel-actions">
            <button type="button" className="settings-primary-button" onClick={handleSavePreferences} disabled={preferencesSaving || preferencesLoading}>
              <SaveOutlined />
              {preferencesSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </article>

        <article className="settings-panel">
          <div className="settings-panel-head">
            <div>
              <h3><LockOutlined /> Security</h3>
              <p>Change your admin password and keep account access protected.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label className="settings-field">
              <span>Current Password</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => handlePasswordChange('currentPassword', event.target.value)}
                placeholder="Enter current password"
              />
            </label>

            <label className="settings-field">
              <span>New Password</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => handlePasswordChange('newPassword', event.target.value)}
                placeholder="Enter new password"
              />
            </label>

            <label className="settings-field">
              <span>Confirm New Password</span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => handlePasswordChange('confirmPassword', event.target.value)}
                placeholder="Confirm new password"
              />
            </label>
          </div>

          <div className="security-note">
            <strong>Password tip</strong>
            <span>Use at least 6 characters and avoid reusing old passwords across different accounts.</span>
          </div>

          <div className="settings-panel-actions">
            <button type="button" className="settings-primary-button" onClick={handleChangePassword} disabled={passwordSaving}>
              <LockOutlined />
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </article>
      </section>
    </section>
  );
};

export default SettingsPage;
