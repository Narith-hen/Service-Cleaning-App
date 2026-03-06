import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BellOutlined,
  SlidersOutlined,
  CheckOutlined,
  UserOutlined,
  EditOutlined,
  CameraOutlined,
  PhoneOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/cleaner/settings.scss';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [selectedTypes, setSelectedTypes] = useState(['Home Cleaning', 'Office Cleaning']);
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    smsUpdates: false
  });
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: null
  });
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: null
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [savingQuickEdit, setSavingQuickEdit] = useState(false);

  const profileBase = useMemo(() => {
    const fullName =
      user?.name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
      'Cleaner';

    return {
      name: fullName,
      email: user?.email || '',
      phone: user?.phone || user?.phone_number || '',
      address: user?.address || '',
      avatar: user?.avatar || null
    };
  }, [user]);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const jobTypes = ['Home Cleaning', 'Office Cleaning', 'Deep Cleaning', 'Sanitation'];
  const searchParams = new URLSearchParams(location.search);
  const showProfileSettings = searchParams.get('section') === 'profile';

  useEffect(() => {
    setProfile(profileBase);
    setDraft(profileBase);
  }, [profileBase]);

  useEffect(() => {
    if (showProfileSettings) setProfileMessage('');
  }, [location.search, showProfileSettings]);

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleOpenQuickEdit = () => {
    setDraft(profile);
    setProfileMessage('');
    setIsQuickEditOpen(true);
  };

  const handleCloseQuickEdit = () => {
    setDraft(profile);
    setIsQuickEditOpen(false);
  };

  const handleQuickField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveQuickEdit = async () => {
    setSavingQuickEdit(true);
    setProfileMessage('');

    const firstName = draft.name.trim().split(' ')[0] || '';
    const lastName = draft.name.trim().split(' ').slice(1).join(' ');
    const payload = {
      name: draft.name,
      first_name: firstName,
      last_name: lastName,
      email: profile.email,
      phone: draft.phone,
      phone_number: draft.phone,
      address: profile.address,
      avatar: profile.avatar
    };

    const result = await updateUser(payload);
    if (result?.success) {
      const updated = { ...profile, name: draft.name, phone: draft.phone };
      setProfile(updated);
      setDraft(updated);
      setIsQuickEditOpen(false);
      setProfileMessage('');
    } else {
      setProfileMessage(result?.error || 'Unable to update profile.');
    }

    setSavingQuickEdit(false);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMessage('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarData = String(reader.result);
      const nextDraft = { ...draft, avatar: avatarData };
      setDraft(nextDraft);

      const firstName = nextDraft.name.trim().split(' ')[0] || '';
      const lastName = nextDraft.name.trim().split(' ').slice(1).join(' ');
      const payload = {
        name: nextDraft.name,
        first_name: firstName,
        last_name: lastName,
        email: nextDraft.email,
        phone: nextDraft.phone,
        phone_number: nextDraft.phone,
        address: nextDraft.address,
        avatar: nextDraft.avatar
      };

      const result = await updateUser(payload);
      if (result?.success) {
        setProfile(nextDraft);
        setProfileMessage('');
      } else {
        setProfileMessage(result?.error || 'Unable to update profile photo.');
      }
    };
    reader.readAsDataURL(file);
  };

  const initials = String(draft.name || 'C')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  const roleLabel = user?.role || 'cleaner';
  const isOnline = useMemo(() => {
    const rawStatus =
      user?.is_online ??
      user?.isOnline ??
      user?.online ??
      user?.availability_status ??
      user?.status;

    if (typeof rawStatus === 'boolean') return rawStatus;
    if (typeof rawStatus === 'number') return rawStatus === 1;

    if (typeof rawStatus === 'string') {
      const normalized = rawStatus.trim().toLowerCase();
      if (['online', 'active', 'available', 'true', '1'].includes(normalized)) return true;
      if (['offline', 'inactive', 'unavailable', 'false', '0'].includes(normalized)) return false;
    }

    return true;
  }, [user]);

  return (
    <div className="cleaner-settings-page">
      <div className="settings-headline">
        <h1>Account Settings</h1>
        <p>Manage your service radius, job preferences, and notifications.</p>
      </div>

      <div className="settings-grid">
        {showProfileSettings && (
          <section className="settings-card profile-settings-card">
            <h2>
              <UserOutlined /> Profile Settings
            </h2>
            <span className="section-label">EDITABLE PROFILE</span>

            {profileMessage && <div className="profile-message">{profileMessage}</div>}

            <div className="profile-preview-card">
              <div className="profile-preview-top">
                <div className="preview-actions">
                  <button type="button" className="preview-icon-btn" onClick={handleOpenQuickEdit} aria-label="Edit profile">
                    <EditOutlined />
                  </button>
                </div>

                <h3>{draft.name || 'Cleaner'}</h3>
                <p className="profile-role-row">{roleLabel}</p>
              </div>

              <div className="profile-preview-bottom">
                <button type="button" className="avatar-hero-btn" onClick={handlePickAvatar} aria-label="Change photo">
                  {draft.avatar ? (
                    <img src={draft.avatar} alt={draft.name || 'Profile'} className="settings-avatar-image" />
                  ) : (
                    <div className="settings-avatar-fallback">{initials || 'C'}</div>
                  )}
                  <span className="avatar-hero-badge">
                    <CameraOutlined />
                  </span>
                </button>

                <p className={`profile-online ${isOnline ? 'is-online' : 'is-offline'}`}>{isOnline ? 'online' : 'offline'}</p>
              </div>
            </div>

            {isQuickEditOpen && (
              <div className="quick-edit-panel">
                <div className="quick-edit-header">
                  <h4>Edit Profile</h4>
                  <button type="button" onClick={handleCloseQuickEdit} aria-label="Close edit">
                    <CloseOutlined />
                  </button>
                </div>

                <label className="quick-edit-row">
                  <span className="row-label">
                    <UserOutlined /> Name
                  </span>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => handleQuickField('name', e.target.value)}
                    placeholder="Enter your name"
                  />
                </label>

                <label className="quick-edit-row">
                  <span className="row-label">
                    <PhoneOutlined /> Phone number
                  </span>
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => handleQuickField('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </label>

                <button type="button" className="quick-save-btn" onClick={handleSaveQuickEdit} disabled={savingQuickEdit}>
                  {savingQuickEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </section>
        )}

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
