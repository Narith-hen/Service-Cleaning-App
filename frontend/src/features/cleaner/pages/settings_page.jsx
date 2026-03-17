import React, { useEffect, useRef, useState } from 'react';
import '../../../styles/cleaner/settings.scss';
import profileImage from '../../../assets/narith.png';
import { useAuth } from '../../../hooks/useAuth';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

const SettingsPage = () => {
  const { user, uploadAvatar, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(user?.avatar || profileImage);
  const [fileName, setFileName] = useState('Profile-pic.jpg');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false
  });
  const [passwords, setPasswords] = useState({
    current: 'password123',
    next: 'password123',
    confirm: 'password123'
  });
  const [formData, setFormData] = useState({
    cleanerCode: 'CLN-0001',
    companyEmail: 'sparkle@gmail.com',
    phoneNumber: '+855 12345678',
    teamMembers: 'Phnom Penh, Cambodia',
    latitude: '11.5564',
    longitude: '104.9282',
    accountStatus: 'active',
    address: 'Phnom Penh, Cambodia',
    locLatitude: '11.5564',
    locLongitude: '104.9282'
  });
  const [formErrors, setFormErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  const passwordRule = 'The password must be 9 characters.';

  const meetsPasswordRule = (value) => {
    if (!value) return false;
    const hasMinLength = value.length >= 9;
    return hasMinLength;
  };
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
      cleanerCode: user.user_code || prev.cleanerCode,
      companyEmail: user.email || prev.companyEmail,
      phoneNumber: user.phone_number || user.phone || prev.phoneNumber
    }));
    if (user.avatar) {
      setPreview(normalizeAvatarUrl(user.avatar, profileImage));
    }
  }, [user]);

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

    setFileName(file.name || 'Profile-pic.jpg');
    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = String(reader.result);
      setPreview(previewUrl);
      handleUpload(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (nextData, nextPasswords) => {
    const errors = {};
    if (!nextData.cleanerCode.trim()) errors.cleanerCode = 'Required';
    if (!companyName.trim()) errors.companyName = 'Required';
    if (!nextData.companyEmail.trim()) errors.companyEmail = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(nextData.companyEmail)) errors.companyEmail = 'Invalid email';
    if (!nextData.phoneNumber.trim()) errors.phoneNumber = 'Required';
    if (!nextData.teamMembers.trim()) errors.teamMembers = 'Required';
    if (!nextData.latitude.trim()) errors.latitude = 'Required';
    if (!nextData.longitude.trim()) errors.longitude = 'Required';
    if (!nextData.accountStatus) errors.accountStatus = 'Required';
    if (!nextData.address.trim()) errors.address = 'Required';
    if (!nextData.locLatitude.trim()) errors.locLatitude = 'Required';
    if (!nextData.locLongitude.trim()) errors.locLongitude = 'Required';

    if (!nextPasswords.current.trim()) errors.currentPassword = 'Required';
    if (!nextPasswords.next.trim()) errors.newPassword = 'Required';
    if (!nextPasswords.confirm.trim()) errors.confirmPassword = 'Required';
    if (nextPasswords.next && !meetsPasswordRule(nextPasswords.next)) {
      errors.newPassword = passwordRule;
    }
    if (nextPasswords.confirm && !meetsPasswordRule(nextPasswords.confirm)) {
      errors.confirmPassword = passwordRule;
    }
    if (nextPasswords.next && nextPasswords.confirm && nextPasswords.next !== nextPasswords.confirm) {
      errors.confirmPassword = 'Passwords do not match';
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
      cleaner_code: formData.cleanerCode,
      company_name: companyName,
      company_email: formData.companyEmail,
      phone_number: formData.phoneNumber,
      address: formData.address,
      latitude: formData.locLatitude || formData.latitude,
      longitude: formData.locLongitude || formData.longitude,
      account_status: formData.accountStatus,
    };

    const result = await updateUser(payload);
    if (result?.success) {
      setMessage('Information updated successfully.');
      window.dispatchEvent(
        new CustomEvent('cleaner:navbar-message', {
          detail: { type: 'success', text: 'Information updated successfully.' }
        })
      );
      return;
    }
    const errorText = result?.error || 'Failed to update information.';
    setMessage(errorText);
    window.dispatchEvent(
      new CustomEvent('cleaner:navbar-message', {
        detail: { type: 'error', text: errorText }
      })
    );
  };

  return (
    <div className="cleaner-settings-page">
      <div className="cleaner-settings-shell">
        <section className="settings-hero-card">
          <div className="settings-hero-left">
            <div className="settings-hero-media">
              <div className="settings-hero-avatar">
                <img
                  src={preview || profileImage}
                  alt="Cleaner profile"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = profileImage;
                  }}
                />
              </div>
            </div>
            <div className="settings-hero-text">
              <h2>{companyName || 'Company Name'}</h2>
              <p>Upload a New Photo</p>
            </div>
          </div>
          <button
            className="settings-ghost-button"
            type="button"
            onClick={handlePickImage}
            disabled={isSaving}
          >
            {isSaving ? 'Updating...' : 'Update'}
          </button>
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

          <div className="settings-field">
            <label>Cleaner Code</label>
            <input
              type="text"
              value={formData.cleanerCode}
              onChange={(event) => handleFieldChange('cleanerCode', event.target.value)}
              className={showErrors && formErrors.cleanerCode ? 'input-error' : ''}
            />
            {showErrors && formErrors.cleanerCode && (
              <span className="field-error">{formErrors.cleanerCode}</span>
            )}
          </div>

          <div className="settings-section-title">Company Info</div>

          <div className="settings-grid-2">
            <div className="settings-field">
              <label>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(event) => {
                  setCompanyName(event.target.value);
                  if (showErrors) {
                    setFormErrors(validateForm(formData, passwords));
                  }
                }}
                placeholder="Enter company name"
                className={showErrors && formErrors.companyName ? 'input-error' : ''}
              />
              {showErrors && formErrors.companyName && (
                <span className="field-error">{formErrors.companyName}</span>
              )}
            </div>
            <div className="settings-field">
              <label>Company Email</label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={(event) => handleFieldChange('companyEmail', event.target.value)}
                className={showErrors && formErrors.companyEmail ? 'input-error' : ''}
              />
              {showErrors && formErrors.companyEmail && (
                <span className="field-error">{formErrors.companyEmail}</span>
              )}
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
            {showErrors && formErrors.phoneNumber && (
              <span className="field-error">{formErrors.phoneNumber}</span>
            )}
          </div>

          <div className="settings-field">
            <label>Team Members</label>
            <input
              type="text"
              value={formData.teamMembers}
              onChange={(event) => handleFieldChange('teamMembers', event.target.value)}
              className={showErrors && formErrors.teamMembers ? 'input-error' : ''}
            />
            {showErrors && formErrors.teamMembers && (
              <span className="field-error">{formErrors.teamMembers}</span>
            )}
          </div>

          <div className="settings-grid-2">
            <div className="settings-field">
              <label>Latitude</label>
              <input
                type="text"
                value={formData.latitude}
                onChange={(event) => handleFieldChange('latitude', event.target.value)}
                className={showErrors && formErrors.latitude ? 'input-error' : ''}
              />
              {showErrors && formErrors.latitude && (
                <span className="field-error">{formErrors.latitude}</span>
              )}
            </div>
            <div className="settings-field">
              <label>Longitude</label>
              <input
                type="text"
                value={formData.longitude}
                onChange={(event) => handleFieldChange('longitude', event.target.value)}
                className={showErrors && formErrors.longitude ? 'input-error' : ''}
              />
              {showErrors && formErrors.longitude && (
                <span className="field-error">{formErrors.longitude}</span>
              )}
            </div>
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
            {showErrors && formErrors.accountStatus && (
              <span className="field-error">{formErrors.accountStatus}</span>
            )}
          </div>
        </section>

        <section className="settings-panel">
          <h3>Location</h3>

          <div className="settings-field">
            <label>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(event) => handleFieldChange('address', event.target.value)}
              className={showErrors && formErrors.address ? 'input-error' : ''}
            />
            {showErrors && formErrors.address && (
              <span className="field-error">{formErrors.address}</span>
            )}
          </div>

          <div className="settings-field">
            <label>Latitude</label>
            <input
              type="text"
              value={formData.locLatitude}
              onChange={(event) => handleFieldChange('locLatitude', event.target.value)}
              className={showErrors && formErrors.locLatitude ? 'input-error' : ''}
            />
            {showErrors && formErrors.locLatitude && (
              <span className="field-error">{formErrors.locLatitude}</span>
            )}
          </div>

          <div className="settings-field">
            <label>Longitude</label>
            <input
              type="text"
              value={formData.locLongitude}
              onChange={(event) => handleFieldChange('locLongitude', event.target.value)}
              className={showErrors && formErrors.locLongitude ? 'input-error' : ''}
            />
            {showErrors && formErrors.locLongitude && (
              <span className="field-error">{formErrors.locLongitude}</span>
            )}
          </div>

          <div className="settings-section-title">Security</div>

          <div className="settings-field">
            <label>Current Password</label>
            <div className="settings-password-field">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                placeholder="Enter your password"
                value={passwords.current}
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
            {showErrors && formErrors.currentPassword && (
              <span className="field-error">{formErrors.currentPassword}</span>
            )}
          </div>

          <div className="settings-field">
            <label>New Password</label>
            <div className="settings-password-field">
              <input
                type={showPasswords.next ? 'text' : 'password'}
                placeholder="Enter your password"
                value={passwords.next}
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
            {passwords.next && (
              <p
                className={`password-rule ${
                  meetsPasswordRule(passwords.next) ? 'is-valid' : 'is-invalid'
                }`}
              >
                {passwordRule}
              </p>
            )}
            {showErrors && formErrors.newPassword && (
              <span className="field-error">{formErrors.newPassword}</span>
            )}
          </div>

          <div className="settings-field">
            <label>Confirm Password</label>
            <div className="settings-password-field">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                placeholder="Enter your password"
                value={passwords.confirm}
                onChange={(event) => {
                  const value = event.target.value;
                  setPasswords((prev) => ({ ...prev, confirm: value }));
                  if (showErrors) {
                    setFormErrors(validateForm(formData, { ...passwords, confirm: value }));
                  }
                }}
                className={showErrors && formErrors.confirmPassword ? 'input-error' : ''}
              />
              <button
                type="button"
                className="settings-eye-btn icon inside"
                onClick={() =>
                  setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                }
                aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
              >
                {showPasswords.confirm ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {passwords.confirm && (
              <p
                className={`password-rule ${
                  meetsPasswordRule(passwords.confirm) ? 'is-valid' : 'is-invalid'
                }`}
              >
                {passwordRule}
              </p>
            )}
            {showErrors && formErrors.confirmPassword && (
              <span className="field-error">{formErrors.confirmPassword}</span>
            )}
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
