import React, { useEffect, useRef, useState } from 'react';
import '../../../styles/cleaner/settings.scss';
import profileImage from '../../../assets/narith.png';
import { useAuth } from '../../../hooks/useAuth';
import { CameraOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

const SettingsPage = () => {
  const { user, uploadAvatar, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const [preview, setPreview] = useState(user?.avatar || profileImage);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false
  });
  const [passwords, setPasswords] = useState({
    current: '',
    next: ''
  });
  const [formData, setFormData] = useState({
    companyEmail: '',
    phoneNumber: '',
    accountStatus: 'active',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  const [companyName, setCompanyName] = useState('Sparkle Cleaning');

  const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const apiBaseUrl = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

  const addCacheBuster = (url) => {
    if (!url || /^data:/i.test(url)) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  };

  const normalizeAvatarUrl = (avatar, fallback) => {
    if (!avatar) return fallback;
    const cleaned = String(avatar).replace(/\\/g, '/');
    if (/^data:/i.test(cleaned)) return cleaned;
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    if (cleaned.startsWith('/')) return `${apiBaseUrl}${cleaned}`;
    if (cleaned.startsWith('uploads/') || cleaned.startsWith('public/')) {
      return `${apiBaseUrl}/${cleaned}`;
    }
    return fallback;
  };

  useEffect(() => {
    if (!user) return;
    setCompanyName((prev) => user.name || prev);
    setFormData((prev) => ({
      ...prev,
      companyEmail: user.email || prev.companyEmail,
      phoneNumber: user.phone_number || user.phone || prev.phoneNumber,
      accountStatus: user.account_status || prev.accountStatus
    }));
    if (user.avatar) {
      setPreview(normalizeAvatarUrl(user.avatar, profileImage));
    }
  }, [user]);

  useEffect(() => {
    const clearAutofill = () => {
      if (currentPasswordRef.current) currentPasswordRef.current.value = '';
      if (newPasswordRef.current) newPasswordRef.current.value = '';
      setPasswords({ current: '', next: '' });
    };

    clearAutofill();
    const timer = setTimeout(clearAutofill, 150);
    return () => clearTimeout(timer);
  }, []);

  const handlePasswordFocus = (key, event) => {
    if (!passwords[key] && event.currentTarget.value) {
      event.currentTarget.value = '';
    }
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (file, previewUrl) => {
    setIsSaving(true);
    setMessage('');
    try {
      if (file) {
        const result = await uploadAvatar(file);
        if (!result?.success) throw new Error(result?.error || 'Failed to upload photo.');
        const nextAvatar = normalizeAvatarUrl(result.user?.avatar, previewUrl);
        if (nextAvatar && nextAvatar !== previewUrl) {
          setPreview(addCacheBuster(nextAvatar));
        } else {
          setPreview(previewUrl);
        }
      } else {
        const result = await updateUser({ avatar: previewUrl });
        if (!result?.success) throw new Error(result?.error || 'Failed to update photo.');
        const nextAvatar = normalizeAvatarUrl(result.user?.avatar, previewUrl);
        if (nextAvatar && nextAvatar !== previewUrl) {
          setPreview(addCacheBuster(nextAvatar));
        } else {
          setPreview(previewUrl);
        }
      }
      setMessage('Photo updated successfully.');
    } catch (error) {
      setMessage(error.message || 'Failed to upload photo.');
    } finally {
      setIsSaving(false);
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
      const previewUrl = String(reader.result);
      setPreview(previewUrl);
      handleUpload(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (nextData, nextPasswords, nextCompanyName = companyName) => {
    const errors = {};
    if (!String(nextCompanyName || '').trim()) errors.companyName = 'Required';
    if (!nextData.companyEmail.trim()) errors.companyEmail = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(nextData.companyEmail)) errors.companyEmail = 'Invalid email';
    if (!nextData.phoneNumber.trim()) errors.phoneNumber = 'Required';
    if (!nextData.accountStatus) errors.accountStatus = 'Required';
    if (nextPasswords.next && !nextPasswords.current) {
      errors.currentPassword = 'Current password is required';
    }
    return errors;
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (showErrors) {
      const nextData = { ...formData, [key]: value };
      setFormErrors(validateForm(nextData, passwords));
    }
  };

  const handleSubmit = async () => {
    const errors = validateForm(formData, passwords);
    setFormErrors(errors);
    setShowErrors(true);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      company_name: companyName,
      name: companyName,
      company_email: formData.companyEmail,
      phone_number: formData.phoneNumber,
      account_status: formData.accountStatus,
    };

    if (passwords.current && passwords.next) {
      payload.current_password = passwords.current;
      payload.new_password = passwords.next;
    }

    console.debug('[SettingsPage] updateUser payload', payload);
    const result = await updateUser(payload);
    console.debug('[SettingsPage] updateUser result', result);
    if (result?.success) {
      setMessage('Information updated successfully.');
      setPasswords({ current: '', next: '' });
      window.dispatchEvent(
        new CustomEvent('cleaner:navbar-message', {
          detail: { type: 'success', text: 'Information updated successfully.' }
        })
      );
      return;
    }
    const errorText = result?.error || 'Failed to update information.';
    console.error('[SettingsPage] updateUser failed', errorText, result);
    setMessage(errorText);
  };

  return (
    <div className="cleaner-settings-page">
      <div className="cleaner-settings-shell">
        <section className="settings-hero-card">
          <div className="settings-hero-left">
            <div className="settings-hero-media">
              <button
                type="button"
                className="settings-hero-avatar"
                onClick={handlePickImage}
                disabled={isSaving}
                aria-label="Change profile photo"
              >
                <img
                  src={preview || profileImage}
                  alt="Cleaner profile"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = profileImage;
                  }}
                />
                <span className="settings-hero-avatar-edit">
                  <CameraOutlined />
                </span>
              </button>
            </div>
            <div className="settings-hero-text">
              <h2>{companyName || 'Company Name'}</h2>
              <button
                type="button"
                className="settings-hero-link"
                onClick={handlePickImage}
                disabled={isSaving}
              >
                {isSaving ? 'Updating photo...' : 'Upload a New Photo'}
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </section>

        <div className="settings-panels">
        <section className="settings-panel">
          <h3>Profile</h3>

          <div className="settings-section-title">Company Info</div>

          <div className="settings-grid-2">
            <div className="settings-field">
              <label>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(event) => {
                  const value = event.target.value;
                  setCompanyName(value);
                  if (showErrors) {
                    setFormErrors(validateForm(formData, passwords, value));
                  }
                }}
                placeholder="Enter company name"
                className={showErrors && formErrors.companyName ? 'input-error' : ''}
              />
            </div>
            <div className="settings-field">
              <label>Company Email</label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={(event) => handleFieldChange('companyEmail', event.target.value)}
                className={showErrors && formErrors.companyEmail ? 'input-error' : ''}
              />
            </div>
          </div>

          <div className="settings-field">
            <label>Phone Number</label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(event) => handleFieldChange('phoneNumber', event.target.value)}
              className={showErrors && formErrors.phoneNumber ? 'input-error' : ''}
            />
          </div>

          <div className="settings-field">
            <label>Account Status</label>
            <select
              value={formData.accountStatus}
              onChange={(event) => handleFieldChange('accountStatus', event.target.value)}
              className={showErrors && formErrors.accountStatus ? 'input-error' : ''}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </section>

        <section className="settings-panel">
          <div className="settings-section-title">Security</div>

          <div className="settings-field">
            <label>Current Password</label>
            <div className="settings-password-field">
              <input
                ref={currentPasswordRef}
                type={showPasswords.current ? 'text' : 'password'}
                placeholder="Enter your password"
                name="cleaner-current-password"
                autoComplete="off"
                data-1p-ignore="true"
                data-lpignore="true"
                value={passwords.current}
                onFocus={(event) => handlePasswordFocus('current', event)}
                onChange={(event) => {
                  const value = event.target.value;
                  setPasswords((prev) => ({ ...prev, current: value }));
                  if (showErrors) {
                    setFormErrors(validateForm(formData, { ...passwords, current: value }));
                  }
                }}
                className={showErrors && formErrors.currentPassword ? 'input-error' : ''}
              />
              <button
                type="button"
                className="settings-eye-btn icon inside"
                onClick={() =>
                  setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                }
                aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
              >
                {showPasswords.current ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
          </div>

          <div className="settings-field">
            <label>New Password</label>
            <div className="settings-password-field">
              <input
                ref={newPasswordRef}
                type={showPasswords.next ? 'text' : 'password'}
                placeholder="Enter your password"
                name="cleaner-new-password"
                autoComplete="new-password"
                data-1p-ignore="true"
                data-lpignore="true"
                value={passwords.next}
                onFocus={(event) => handlePasswordFocus('next', event)}
                onChange={(event) => {
                  const value = event.target.value;
                  setPasswords((prev) => ({ ...prev, next: value }));
                  if (showErrors) {
                    setFormErrors(validateForm(formData, { ...passwords, next: value }));
                  }
                }}
                className={showErrors && formErrors.newPassword ? 'input-error' : ''}
              />
              <button
                type="button"
                className="settings-eye-btn icon inside"
                onClick={() =>
                  setShowPasswords((prev) => ({ ...prev, next: !prev.next }))
                }
                aria-label={showPasswords.next ? 'Hide password' : 'Show password'}
              >
                {showPasswords.next ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
          </div>

          <button className="settings-primary-button" type="button" onClick={handleSubmit}>
            Update Information
          </button>
        </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
