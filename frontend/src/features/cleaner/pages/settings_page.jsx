import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CameraOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/cleaner/settings.scss';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [profileMessage, setProfileMessage] = useState('');

  const profileData = useMemo(() => {
    const fullName =
      user?.name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
      'Cleaner';

    const completedJobsValue =
      user?.completedJobs ??
      user?.completed_jobs ??
      user?.jobs_completed ??
      user?.total_completed_jobs ??
      0;

    const ratingValue =
      user?.rating ??
      user?.avg_rating ??
      user?.average_rating ??
      0;

    return {
      name: fullName,
      email: user?.email || '-',
      phone: user?.phone || user?.phone_number || '-',
      address: user?.address || '-',
      avatar: user?.avatar || null,
      completedJobs: completedJobsValue,
      rating: Number(ratingValue).toFixed(1).replace('.0', '')
    };
  }, [user]);

  const [profile, setProfile] = useState(profileData);

  useEffect(() => {
    setProfile(profileData);
  }, [profileData]);

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

  const firstInitial = String(user?.first_name || '').trim().charAt(0).toUpperCase();
  const lastInitial = String(user?.last_name || '').trim().charAt(0).toUpperCase();
  const initials = (firstInitial + lastInitial) || String(profile.name || 'C').trim().charAt(0).toUpperCase() || 'C';

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMessage('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarData = String(reader.result);
      const nextProfile = { ...profile, avatar: avatarData };
      setProfile(nextProfile);

      const firstName = String(profile.name).trim().split(' ')[0] || '';
      const lastName = String(profile.name).trim().split(' ').slice(1).join(' ');

      const payload = {
        name: profile.name,
        first_name: firstName,
        last_name: lastName,
        email: profile.email === '-' ? '' : profile.email,
        phone: profile.phone === '-' ? '' : profile.phone,
        phone_number: profile.phone === '-' ? '' : profile.phone,
        address: profile.address === '-' ? '' : profile.address,
        avatar: avatarData
      };

      const result = await updateUser(payload);
      if (!result?.success) {
        setProfileMessage(result?.error || 'Unable to update profile photo.');
      } else {
        setProfileMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="cleaner-settings-page">
      <section className="settings-profile-card">
        <div className="settings-profile-banner">
          <button type="button" className="settings-profile-edit" onClick={handlePickAvatar} aria-label="Edit profile photo">
            <EditOutlined />
          </button>
          <h1>{profile.name || 'Cleaner'}</h1>
        </div>

        <div className="settings-profile-lower">
          <div className="settings-profile-avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name || 'Profile'} className="settings-profile-avatar" />
            ) : (
              <div className="settings-profile-fallback">{initials}</div>
            )}
            <button type="button" className="settings-profile-camera" onClick={handlePickAvatar} aria-label="Change profile photo">
              <CameraOutlined />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <p className={`settings-profile-status ${isOnline ? 'is-online' : 'is-offline'}`}>
            {isOnline ? 'online' : 'offline'}
          </p>
        </div>

        {profileMessage && <div className="settings-profile-message">{profileMessage}</div>}
      </section>

      <section className="settings-profile-grid">
        <article className="settings-profile-field">
          <label>Full Name</label>
          <p>{profile.name || '-'}</p>
        </article>
        <article className="settings-profile-field">
          <label>Email</label>
          <p>{profile.email || '-'}</p>
        </article>
        <article className="settings-profile-field">
          <label>Phone</label>
          <p>{profile.phone || '-'}</p>
        </article>
        <article className="settings-profile-field">
          <label>Address</label>
          <p>{profile.address || '-'}</p>
        </article>
      </section>

      <section className="settings-profile-stats">
        <article>
          <span>Completed Jobs</span>
          <strong>{profile.completedJobs}</strong>
        </article>
        <article>
          <span>Rating</span>
          <strong>{profile.rating}</strong>
        </article>
      </section>
    </div>
  );
};

export default SettingsPage;
