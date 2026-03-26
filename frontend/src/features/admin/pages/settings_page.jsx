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
import { useTranslation } from '../../../contexts/translation_context';
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
  const { ta, changeLanguage } = useTranslation();
  const fileInputRef = useRef(null);
  const preferenceRequestRef = useRef(0);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
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

  const resetProfileFormFromUser = () => {
    const nameParts = String(user?.name || '').trim().split(/\s+/).filter(Boolean);
    setProfileForm({
      firstName: user?.first_name || nameParts[0] || '',
      lastName: user?.last_name || nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      phone: user?.phone_number || user?.phone || ''
    });
  };

  useEffect(() => {
    resetProfileFormFromUser();
    setAvatarPreview(normalizeAvatarUrl(user?.avatar || ''));
    setProfileEditing(false);
  }, [user]);

  useEffect(() => {
    const currentUserId = user?.user_id || user?.id;
    if (!currentUserId) {
      setPreferencesLoading(false);
      return;
    }

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
        changeLanguage(nextPreferences.language);
        if (nextPreferences.darkMode) {
          setDarkMode();
        } else {
          setLightMode();
        }
      } catch (error) {
        if (cancelled) return;
        notificationApi.error({
          placement: 'bottomRight',
          message: ta('Failed to load settings'),
          description: error?.response?.data?.message || ta('Could not load your admin preferences.'),
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
  }, [user?.id, user?.user_id]);

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

  const handleCancelProfileEdit = () => {
    resetProfileFormFromUser();
    setProfileEditing(false);
  };

  const applyPreferenceVisuals = (nextPreferences) => {
    changeLanguage(nextPreferences.language);
    if (nextPreferences.darkMode) {
      setDarkMode();
    } else {
      setLightMode();
    }
  };

  const handlePreferenceChange = async (key, value) => {
    if (preferencesLoading || preferencesSaving) return;

    const previousPreferences = { ...preferencesForm };
    const nextPreferences = { ...previousPreferences, [key]: value };

    setPreferencesForm(nextPreferences);
    applyPreferenceVisuals(nextPreferences);
    setPreferencesSaving(true);
    const requestId = preferenceRequestRef.current + 1;
    preferenceRequestRef.current = requestId;

    try {
      await settingsService.updateSettings({
        language: nextPreferences.language,
        notification_enabled: nextPreferences.notificationEnabled,
        dark_mode: nextPreferences.darkMode
      });
    } catch (error) {
      if (requestId !== preferenceRequestRef.current) return;

      setPreferencesForm(previousPreferences);
      applyPreferenceVisuals(previousPreferences);
      notificationApi.error({
        placement: 'bottomRight',
        message: ta('Failed to save preferences'),
        description: error?.response?.data?.message || ta('Please try again.'),
        duration: 3
      });
    } finally {
      if (requestId === preferenceRequestRef.current) {
        setPreferencesSaving(false);
      }
    }
  };

  const handlePasswordChange = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancelPasswordEdit = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordEditing(false);
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
        message: ta('Invalid image'),
        description: ta('Please choose an image file.'),
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
        message: ta('Profile image updated'),
        duration: 2
      });
    } catch (error) {
      notificationApi.error({
        placement: 'bottomRight',
        message: ta('Failed to update profile image'),
        description: error?.message || ta('Please try again.'),
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
        message: ta('Email is required'),
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
        phone_number: profileForm.phone
      });

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update admin profile');
      }

      notificationApi.success({
        placement: 'bottomRight',
        message: ta('Profile updated successfully'),
        duration: 2
      });
      setProfileEditing(false);
    } catch (error) {
      notificationApi.error({
        placement: 'bottomRight',
        message: ta('Failed to update profile'),
        description: error?.message || ta('Please try again.'),
        duration: 3
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      notificationApi.error({
        placement: 'bottomRight',
        message: ta('All password fields are required'),
        duration: 2
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      notificationApi.error({
        placement: 'bottomRight',
        message: ta('New password must be at least 6 characters'),
        duration: 2
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notificationApi.error({
        placement: 'bottomRight',
        message: ta('Passwords do not match'),
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
      setPasswordEditing(false);

      notificationApi.success({
        placement: 'bottomRight',
        message: ta('Password updated successfully'),
        duration: 2
      });
    } catch (error) {
      notificationApi.error({
        placement: 'bottomRight',
        message: ta('Failed to update password'),
        description: error?.response?.data?.message || ta('Please try again.'),
        duration: 3
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const summaryCards = [
    {
      title: ta('Language'),
      value: preferencesForm.language === 'km' ? ta('Khmer') : ta('English'),
      icon: <GlobalOutlined />,
      tone: 'blue',
      note: ta('Saved in account settings')
    },
    {
      title: ta('Notifications'),
      value: preferencesForm.notificationEnabled ? ta('Enabled') : ta('Muted'),
      icon: <BellOutlined />,
      tone: 'green',
      note: ta('Platform alerts and updates')
    },
    {
      title: ta('Theme'),
      value: preferencesForm.darkMode ? ta('Dark Mode') : ta('Light Mode'),
      icon: <MoonOutlined />,
      tone: 'amber',
      note: darkMode ? ta('Currently active in admin UI') : ta('Applied instantly in admin UI')
    }
  ];

  return (
    <section className="admin-settings-page">
      {contextHolder}
      <header className="admin-settings-header">
        <div>
          <h1 className="admin-page-title">{ta('Manage Settings')}</h1>
          <p className="admin-page-subtitle">{ta('Control your admin profile, interface preferences, and account security.')}</p>
        </div>
      </header>

      <section className="admin-settings-hero">
        <div className="settings-hero-profile">
          <button
            type="button"
            className="settings-avatar-button"
            onClick={handlePickAvatar}
            disabled={profileLoading}
            aria-label={ta('Change profile image')}
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
            <p>{user?.email || ta('No email available')}</p>
            <div className="settings-hero-tags">
              <span className="settings-chip positive">{ta('Administrator')}</span>
              <span className="settings-chip">{ta('Secure Access')}</span>
            </div>
          </div>
        </div>
        <div className="settings-hero-note">
          <SafetyCertificateOutlined />
          <div>
            <strong>{ta('Account Health')}</strong>
            <span>{ta('Keep your profile and preferences up to date so the admin workspace stays consistent across sessions.')}</span>
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
              <h3><UserOutlined /> {ta('Account Profile')}</h3>
              <p>{ta('Update the main admin contact details used across the platform.')}</p>
            </div>
          </div>

          <div className="settings-form-grid two-columns">
            <label className="settings-field">
              <span>{ta('First Name')}</span>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(event) => handleProfileChange('firstName', event.target.value)}
                placeholder={ta('Enter first name')}
                disabled={!profileEditing || profileLoading}
              />
            </label>

            <label className="settings-field">
              <span>{ta('Last Name')}</span>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(event) => handleProfileChange('lastName', event.target.value)}
                placeholder={ta('Enter last name')}
                disabled={!profileEditing || profileLoading}
              />
            </label>

            <label className="settings-field">
              <span>{ta('Email Address')}</span>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => handleProfileChange('email', event.target.value)}
                placeholder={ta('Enter email address')}
                disabled={!profileEditing || profileLoading}
              />
            </label>

            <label className="settings-field">
              <span>{ta('Phone Number')}</span>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(event) => handleProfileChange('phone', event.target.value)}
                placeholder={ta('Enter phone number')}
                disabled={!profileEditing || profileLoading}
              />
            </label>
          </div>

          <div className="settings-panel-actions">
            {profileEditing ? (
              <>
                <button type="button" className="settings-cancel-button" onClick={handleCancelProfileEdit} disabled={profileLoading}>
                  {ta('Cancel')}
                </button>
                <button type="button" className="settings-primary-button" onClick={handleSaveProfile} disabled={profileLoading}>
                  <SaveOutlined />
                  {profileLoading ? ta('Saving...') : ta('Save Profile')}
                </button>
              </>
            ) : (
              <button type="button" className="settings-secondary-button" onClick={() => setProfileEditing(true)} disabled={profileLoading}>
                <UserOutlined />
                {ta('Edit Profile')}
              </button>
            )}
          </div>
        </article>

        <article className="settings-panel">
          <div className="settings-panel-head">
            <div>
              <h3><BellOutlined /> {ta('Preferences')}</h3>
              <p>{ta('Control interface defaults and how you receive admin notifications.')}</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label className="settings-field">
              <span>{ta('Language')}</span>
              <select
                value={preferencesForm.language}
                onChange={(event) => handlePreferenceChange('language', event.target.value)}
                disabled={preferencesLoading || preferencesSaving}
              >
                <option value="en">{ta('English')}</option>
                <option value="km">{ta('Khmer')}</option>
              </select>
            </label>

            <div className="settings-toggle-card">
              <div>
                <strong>{ta('Notification Alerts')}</strong>
                <p>{ta('Receive platform and account activity updates.')}</p>
              </div>
              <button
                type="button"
                className={`toggle-switch ${preferencesForm.notificationEnabled ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('notificationEnabled', !preferencesForm.notificationEnabled)}
                disabled={preferencesLoading || preferencesSaving}
                aria-pressed={preferencesForm.notificationEnabled}
              >
                <span />
              </button>
            </div>

            <div className="settings-toggle-card">
              <div>
                <strong>{ta('Dark Mode Preference')}</strong>
                <p>{ta('Save the theme mode you want applied in the admin interface.')}</p>
              </div>
              <button
                type="button"
                className={`toggle-switch ${preferencesForm.darkMode ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('darkMode', !preferencesForm.darkMode)}
                disabled={preferencesLoading || preferencesSaving}
                aria-pressed={preferencesForm.darkMode}
              >
                <span />
              </button>
            </div>
          </div>
        </article>

        <article className="settings-panel">
          <div className="settings-panel-head">
            <div>
              <h3><LockOutlined /> {ta('Security')}</h3>
              <p>{ta('Change your admin password and keep account access protected.')}</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label className="settings-field">
              <span>{ta('Current Password')}</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => handlePasswordChange('currentPassword', event.target.value)}
                placeholder={ta('Enter current password')}
                disabled={!passwordEditing || passwordSaving}
              />
            </label>

            <label className="settings-field">
              <span>{ta('New Password')}</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => handlePasswordChange('newPassword', event.target.value)}
                placeholder={ta('Enter new password')}
                disabled={!passwordEditing || passwordSaving}
              />
            </label>

            <label className="settings-field">
              <span>{ta('Confirm New Password')}</span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => handlePasswordChange('confirmPassword', event.target.value)}
                placeholder={ta('Confirm new password')}
                disabled={!passwordEditing || passwordSaving}
              />
            </label>
          </div>

          <div className="security-note">
            <strong>{ta('Password tip')}</strong>
            <span>{ta('Use at least 6 characters and avoid reusing old passwords across different accounts.')}</span>
          </div>

          <div className="settings-panel-actions">
            {passwordEditing ? (
              <>
                <button type="button" className="settings-cancel-button" onClick={handleCancelPasswordEdit} disabled={passwordSaving}>
                  {ta('Cancel')}
                </button>
                <button type="button" className="settings-primary-button" onClick={handleChangePassword} disabled={passwordSaving}>
                  <LockOutlined />
                  {passwordSaving ? ta('Updating...') : ta('Update Password')}
                </button>
              </>
            ) : (
              <button type="button" className="settings-secondary-button" onClick={() => setPasswordEditing(true)} disabled={passwordSaving}>
                <LockOutlined />
                {ta('Edit Password')}
              </button>
            )}
          </div>
        </article>
      </section>
    </section>
  );
};

export default SettingsPage;
