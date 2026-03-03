import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CameraOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/customer/profile.scss';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const baseProfile = useMemo(() => {
    const fullName =
      user?.name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
      'Customer';

    return {
      name: fullName,
      email: user?.email || '',
      phone: user?.phone || user?.phone_number || '',
      address: user?.address || '',
      avatar: user?.avatar || null,
      joinDate: user?.joinDate || 'January 2024',
      totalBookings: user?.totalBookings || 12,
      totalSpent: user?.totalSpent || 540
    };
  }, [user]);

  const [profile, setProfile] = useState(baseProfile);
  const [draft, setDraft] = useState(baseProfile);
  const [isEditing, setIsEditing] = useState(location.pathname.endsWith('/edit'));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setProfile(baseProfile);
    setDraft(baseProfile);
  }, [baseProfile]);

  useEffect(() => {
    if (location.pathname.endsWith('/edit')) {
      setIsEditing(true);
    }
  }, [location.pathname]);

  const initials = (draft.name || profile.name || 'C')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleDraftChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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

  const handleCancel = () => {
    setDraft(profile);
    setMessage('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const firstName = draft.name.trim().split(' ')[0] || '';
    const lastName = draft.name.trim().split(' ').slice(1).join(' ');

    const payload = {
      name: draft.name,
      first_name: firstName,
      last_name: lastName,
      email: draft.email,
      phone: draft.phone,
      phone_number: draft.phone,
      address: draft.address,
      avatar: draft.avatar
    };

    const result = await updateUser(payload);

    if (result.success) {
      const updatedProfile = {
        ...draft,
        totalBookings: profile.totalBookings,
        totalSpent: profile.totalSpent,
        joinDate: profile.joinDate
      };
      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } else {
      setMessage(result.error || 'Unable to update profile.');
    }

    setSaving(false);
  };

  return (
    <div className="customer-profile-page">
      <section className="profile-hero-card">
        <div className="avatar-wrap">
          {draft.avatar ? (
            <img src={draft.avatar} alt={draft.name} className="avatar-image" />
          ) : (
            <div className="avatar-fallback">{initials}</div>
          )}
          {isEditing && (
            <button type="button" className="avatar-edit-btn" onClick={handlePickImage}>
              <CameraOutlined />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="profile-hero-text">
          <h1>{draft.name || 'Customer'}</h1>
          <p>Member since {profile.joinDate}</p>
        </div>

        <div className="hero-actions">
          {!isEditing ? (
            <button type="button" className="btn-primary" onClick={handleEdit}>
              <EditOutlined /> Edit Profile
            </button>
          ) : (
            <>
              <button type="button" className="btn-ghost" onClick={handleCancel}>
                <CloseOutlined /> Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
                <SaveOutlined /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
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
          <span>Total Bookings</span>
          <strong>{profile.totalBookings}</strong>
        </article>
        <article>
          <span>Total Spent</span>
          <strong>${profile.totalSpent}</strong>
        </article>
      </section>
    </div>
  );
};

export default ProfilePage;
