import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CameraOutlined, EditOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/customer/profile.scss';

const ProfilePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const baseProfile = useMemo(() => {
    const fullName =
      user?.name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
      'Cleaner';

    return {
      name: fullName,
      email: user?.email || '',
      phone: user?.phone || user?.phone_number || '',
      address: user?.address || '',
      avatar: user?.avatar || null,
      joinDate: user?.joinDate || 'January 2024',
      completedJobs: user?.completedJobs || 0,
      rating: user?.rating || 0
    };
  }, [user]);

  const [profile, setProfile] = useState(baseProfile);
  const [draft, setDraft] = useState(baseProfile);
  const [isEditing, setIsEditing] = useState(location.pathname.endsWith('/edit'));
  const [message, setMessage] = useState('');

  useEffect(() => {
    setProfile(baseProfile);
    setDraft(baseProfile);
  }, [baseProfile]);

  useEffect(() => {
    setIsEditing(location.pathname.endsWith('/edit'));
  }, [location.pathname]);

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
  const initials = (firstInitial + lastInitial) || String(draft.name || 'C').trim().charAt(0).toUpperCase() || 'C';

  const handleDraftChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => ({ ...prev, avatar: String(reader.result) }));
      setMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setDraft(profile);
    setMessage('');
    setIsEditing(true);
  };

  return (
    <div className="customer-profile-page">
      <section className="profile-hero-card">
        <div className="hero-banner">
          <div className="hero-top-actions">
            <button
              type="button"
              className="hero-icon-btn"
              onClick={handleEdit}
              aria-label="Edit profile"
            >
              <EditOutlined />
            </button>
          </div>

          <div className="profile-hero-text">
            <h1>{draft.name || 'Cleaner'}</h1>
          </div>
        </div>

        <div className="hero-lower">
          <div className="avatar-wrap">
            {draft.avatar ? (
              <img src={draft.avatar} alt={draft.name} className="avatar-image" />
            ) : (
              <div className="avatar-fallback">{initials}</div>
            )}
            <button type="button" className="avatar-edit-btn" onClick={handlePickImage} aria-label="Change photo">
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

          <p className={`hero-status ${isOnline ? 'is-online' : 'is-offline'}`}>
            {isOnline ? 'online' : 'offline'}
          </p>
        </div>
      </section>

      {message && <div className="profile-message">{message}</div>}

      <section className="profile-grid">
        <article className="profile-field">
          <label>Full Name</label>
          {isEditing ? (
            <input
              type="text"
              value={draft.name}
              onChange={(e) => handleDraftChange('name', e.target.value)}
              placeholder="Enter your full name"
            />
          ) : (
            <p>{profile.name || '-'}</p>
          )}
        </article>

        <article className="profile-field">
          <label>Email</label>
          {isEditing ? (
            <input
              type="email"
              value={draft.email}
              onChange={(e) => handleDraftChange('email', e.target.value)}
              placeholder="Enter your email"
            />
          ) : (
            <p>{profile.email || '-'}</p>
          )}
        </article>

        <article className="profile-field">
          <label>Phone</label>
          {isEditing ? (
            <input
              type="tel"
              value={draft.phone}
              onChange={(e) => handleDraftChange('phone', e.target.value)}
              placeholder="Enter your phone"
            />
          ) : (
            <p>{profile.phone || '-'}</p>
          )}
        </article>

        <article className="profile-field">
          <label>Address</label>
          {isEditing ? (
            <input
              type="text"
              value={draft.address}
              onChange={(e) => handleDraftChange('address', e.target.value)}
              placeholder="Enter your address"
            />
          ) : (
            <p>{profile.address || '-'}</p>
          )}
        </article>
      </section>

      <section className="profile-stats">
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

export default ProfilePage;
