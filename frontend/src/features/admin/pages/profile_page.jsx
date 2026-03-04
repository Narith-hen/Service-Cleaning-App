import React, { useMemo, useRef, useState } from 'react';
import { CameraOutlined } from '@ant-design/icons';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/admin/profile_page.css';

const AdminProfilePage = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fullName = useMemo(
    () => user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Admin User',
    [user]
  );
  const email = user?.email || '';
  const avatar = user?.avatar || '';

  const initials = useMemo(() => {
    const first = String(user?.first_name || '').trim().charAt(0).toUpperCase();
    const last = String(user?.last_name || '').trim().charAt(0).toUpperCase();
    if (first || last) return `${first}${last}`;
    return String(fullName).trim().charAt(0).toUpperCase() || 'A';
  }, [user, fullName]);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const nextAvatar = String(reader.result);
      setSaving(true);
      setMessage('');
      const result = await updateUser({
        avatar: nextAvatar
      });

      if (result.success) {
        setMessage('Profile image updated successfully.');
      } else {
        setMessage(result.error || 'Unable to update profile image.');
      }
      setSaving(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="admin-profile-page">
      <header className="admin-profile-header">
        <h1 className="admin-page-title">My Profile</h1>
        <p className="admin-page-subtitle">Manage your admin profile image and account details.</p>
      </header>

      <div className="admin-profile-card">
        <div className="admin-profile-avatar-wrap">
          {avatar ? (
            <img
              src={avatar}
              alt={fullName}
              className="admin-profile-avatar"
            />
          ) : (
            <div className="admin-profile-avatar admin-profile-avatar-fallback">
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={handlePickImage}
            disabled={saving}
            className="admin-profile-upload-btn"
            aria-label="Upload profile image"
          >
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

        <div className="admin-profile-info">
          <h3>{fullName}</h3>
          <p className="admin-profile-email">{email}</p>
          {message && (
            <p className={`admin-profile-message ${message.toLowerCase().includes('success') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminProfilePage;
