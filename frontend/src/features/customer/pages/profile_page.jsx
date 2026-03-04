import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CameraOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const baseProfile = useMemo(() => ({
    name:
      user?.name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
      'Customer',
    email: user?.email || '',
    phone: user?.phone || user?.phone_number || '',
    address: user?.address || '',
    avatar: user?.avatar || null,
    joinDate: user?.joinDate || 'January 2024',
    totalBookings: user?.totalBookings ?? 12,
    totalSpent: user?.totalSpent ?? 540,
  }), [user]);

  const [profile, setProfile] = useState(baseProfile);
  const [draft, setDraft] = useState(baseProfile);
  const [isEditing, setIsEditing] = useState(location.pathname.endsWith('/edit'));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setProfile(baseProfile);
    setDraft(baseProfile);
  }, [baseProfile]);

  useEffect(() => {
    setIsEditing(location.pathname.endsWith('/edit'));
  }, [location.pathname]);

  const getInitials = () => {
    const nameStr = (draft.name || profile.name || '').trim();
    if (!nameStr) return 'C';
    const parts = nameStr.split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) {
      setMessage('Please select an image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarUrl = reader.result;
      setDraft((prev) => ({ ...prev, avatar: avatarUrl }));

      if (!isEditing) {
        setUploading(true);
        const res = await updateUser({ avatar: avatarUrl });
        if (res.success) {
          setProfile((prev) => ({ ...prev, avatar: avatarUrl }));
          setMessage('Profile photo updated.');
        } else {
          setMessage(res.error || 'Failed to update photo.');
        }
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startEditing = () => {
    setDraft(profile);
    setMessage('');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setMessage('');
    setIsEditing(false);
  };

  const saveChanges = async () => {
    setSaving(true);
    setMessage('');

    const nameTrimmed = draft.name.trim();
    const nameParts = nameTrimmed.split(/\s+/);
    const payload = {
      name: nameTrimmed,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      phone_number: draft.phone.trim(),
      address: draft.address.trim(),
      avatar: draft.avatar,
    };

    const result = await updateUser(payload);

    if (result.success) {
      setProfile({
        ...draft,
        totalBookings: profile.totalBookings,
        totalSpent: profile.totalSpent,
        joinDate: profile.joinDate,
      });
      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } else {
      setMessage(result.error || 'Failed to save profile.');
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero / Header */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-8 sm:p-10 text-center sm:text-left relative">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8">
              {/* Avatar + upload button */}
              <div className="relative mx-auto sm:mx-0 shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100">
                  {draft.avatar ? (
                    <img
                      src={draft.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-gray-400">
                      {getInitials()}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={uploading || saving}
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                  <CameraOutlined className="text-base" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  hidden
                />
              </div>

              {/* Name, join date, actions */}
              <div className="flex-1">
                {isEditing ? (
                  <input
                    className="text-3xl sm:text-4xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:border-blue-600 focus:outline-none pb-1 w-full max-w-md"
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                ) : (
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                    {profile.name || 'Customer'}
                  </h1>
                )}

                <p className="text-gray-600 mb-6">
                  Member since {profile.joinDate}
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  {!isEditing ? (
                    <button
                      onClick={startEditing}
                      className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
                    >
                      <EditOutlined className="mr-2" /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                      >
                        <CloseOutlined className="mr-2" /> Cancel
                      </button>
                      <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="inline-flex items-center px-7 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition shadow-sm"
                      >
                        <SaveOutlined className="mr-2" />
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-center border ${
              message.toLowerCase().includes('success')
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Info */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow border border-gray-200 p-7">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h2>

            <div className="space-y-5">
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Email Address', key: 'email', type: 'email' },
                { label: 'Phone Number', key: 'phone', type: 'tel' },
                { label: 'Address', key: 'address', type: 'text' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    {field.label}
                  </label>
                  {isEditing ? (
                    <input
                      type={field.type}
                      value={draft[field.key]}
                      onChange={(e) => setDraft((p) => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {profile[field.key] || <span className="text-gray-400">Not provided</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-7 h-fit">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Activity</h2>

            <div className="space-y-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Total Bookings</span>
                <span className="text-2xl font-semibold text-blue-700">{profile.totalBookings}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Total Spent</span>
                <span className="text-2xl font-semibold text-blue-700">${profile.totalSpent}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;