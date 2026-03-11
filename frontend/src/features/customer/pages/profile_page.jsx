import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CameraOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const ProfilePage = () => {
  const { user, updateUser, uploadAvatar } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const baseProfile = useMemo(
    () => ({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      name:
        user?.name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
        'Customer',
      email: user?.email || '',
      phone: user?.phone || user?.phone_number || '',
      avatar: user?.avatar || null,
      joinDate: user?.joinDate || 'January 2024',
      totalBookings: user?.totalBookings ?? 12,
      totalSpent: user?.totalSpent ?? 540,
    }),
    [user]
  );

  const [profile, setProfile] = useState(baseProfile);
  const [draft, setDraft] = useState(baseProfile);
  const [isEditing, setIsEditing] = useState(location.pathname.endsWith('/edit'));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    setProfile(baseProfile);
    setDraft(baseProfile);
  }, [baseProfile]);

  useEffect(() => {
    setIsEditing(location.pathname.endsWith('/edit'));
  }, [location.pathname]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const getInitials = () => {
    const nameStr = (
      `${draft.first_name || profile.first_name || ''} ${draft.last_name || profile.last_name || ''}` ||
      draft.name ||
      profile.name ||
      ''
    ).trim();
    if (!nameStr) return 'C';
    const parts = nameStr.split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) {
      setMessageType('error');
      setMessage('Please select an image.');
      return;
    }
    setUploading(true);
    const res = await uploadAvatar(file);
    if (res.success) {
      const avatarUrl = res.user?.avatar || null;
      setDraft((prev) => ({ ...prev, avatar: avatarUrl }));
      setProfile((prev) => ({ ...prev, avatar: avatarUrl }));
      setMessageType('success');
      setMessage('Profile photo updated.');
    } else {
      setMessageType('error');
      setMessage(res.error || 'Failed to update photo.');
    }
    setUploading(false);
    e.target.value = '';
  };

  const startEditing = () => {
    setDraft(profile);
    setMessage('');
    setMessageType('success');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setMessage('');
    setMessageType('success');
    setIsEditing(false);
  };

  const saveChanges = async () => {
    setSaving(true);
    setMessage('');

    const firstName = String(draft.first_name || '').trim();
    const lastName = String(draft.last_name || '').trim();
    const nameTrimmed = [firstName, lastName].filter(Boolean).join(' ').trim();
    const payload = {
      name: nameTrimmed,
      first_name: firstName,
      last_name: lastName,
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      phone_number: draft.phone.trim(),
      avatar: draft.avatar,
    };

    const result = await updateUser(payload);

    if (result.success) {
      setProfile({
        ...draft,
        first_name: firstName,
        last_name: lastName,
        name: nameTrimmed || 'Customer',
        totalBookings: profile.totalBookings,
        totalSpent: profile.totalSpent,
        joinDate: profile.joinDate,
      });
      setIsEditing(false);
      setMessageType('success');
      setMessage('Profile updated successfully.');
    } else {
      setMessageType('error');
      setMessage(result.error || 'Failed to save profile.');
    }

    setSaving(false);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/customer/dashboard');
  };

  const detailRows = [
    { label: 'First Name', key: 'first_name', editable: true, type: 'text' },
    { label: 'Last Name', key: 'last_name', editable: true, type: 'text' },
    { label: 'Email', key: 'email', editable: true, type: 'email' },
    { label: 'Phone Number', key: 'phone', editable: true, type: 'tel' },
  ];

  return (
    <div className="min-h-screen bg-[#edf2f2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto mb-3 flex max-w-5xl">
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 rounded border border-[#008000] bg-white px-4 py-2 text-sm font-semibold text-[#008000] transition hover:bg-[#f2fff2]"
        >
          <LeftOutlined />
          Back
        </button>
      </div>

      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <aside className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
            <div className="mx-auto relative w-fit">
              <div className="h-40 w-40 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                {draft.avatar ? (
                  <img src={draft.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-slate-500">
                    {getInitials()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading || saving}
                className="absolute bottom-1 right-1 rounded bg-slate-800 px-3 py-2 text-white transition hover:bg-slate-700 disabled:opacity-60"
                title="Update"
              >
                <CameraOutlined />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                hidden
              />
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">Total Booking</span>
                <strong className="text-lg text-slate-900">{profile.totalBookings}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">Total Spend</span>
                <strong className="text-lg text-slate-900">${profile.totalSpent}</strong>
              </div>
            </div>
          </aside>

          <main>
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-semibold text-slate-900">
                  {[
                    isEditing ? draft.first_name : profile.first_name,
                    isEditing ? draft.last_name : profile.last_name,
                  ].filter(Boolean).join(' ') || profile.name || 'Customer'}
                </h1>
                <p className="mt-1 text-lg text-slate-500">Member since {profile.joinDate}</p>
              </div>

              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-2 rounded bg-[#008000] px-5 py-2.5 font-semibold text-white hover:bg-[#006d00]"
                >
                  <EditOutlined /> EDIT
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <CloseOutlined /> Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded bg-[#008000] px-4 py-2 font-medium text-white hover:bg-[#006d00] disabled:opacity-60"
                  >
                    <SaveOutlined /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6 p-6">
              {detailRows.map((row) => (
                <div key={row.key} className="grid grid-cols-[210px_1fr] items-center gap-6 text-lg">
                  <span className="justify-self-start text-left text-slate-500">{row.label}</span>
                  {isEditing && row.editable ? (
                    <input
                      type={row.type || 'text'}
                      value={draft[row.key] || ''}
                      onChange={(e) => setDraft((p) => ({ ...p, [row.key]: e.target.value }))}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <strong className="justify-self-start text-left font-semibold text-slate-900">
                      {profile[row.key] || '-'}
                    </strong>
                  )}
                </div>
              ))}
            </div>
          </main>
        </div>

        {message && (
          <div
            className={`mx-6 mb-6 rounded border px-4 py-3 text-sm font-medium ${
              messageType === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
