import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Input, Button, Select, message } from 'antd';
import '../../../styles/cleaner/settings.scss';

const { Option } = Select;

const SettingsPage = () => {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    cleanerCode: 'CLN-0001',
    companyName: 'Sparkle Cleaning',
    companyEmail: 'sparkle@gmail.com',
    phoneNumber: '+855 12345678',
    teamMembers: 'Phnom Penh, Cambodia',
    address: 'Phnom Penh, Cambodia',
    latitude: '11.5564',
    longitude: '104.9282',
    accountStatus: 'Active'
  });

  const [passwords, setPasswords] = useState({
    current: 'password',
    next: 'password',
    confirm: 'password'
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarName, setAvatarName] = useState('Profile-pic.jpg');

  const avatarPreview = useMemo(() => {
    if (!avatarFile) return null;
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field) => (event) => {
    const value = event.target.value;
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = () => {
    message.success('Information updated successfully!');
  };

  const triggerPhotoPicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      message.info('No photo selected.');
      return;
    }
    setAvatarFile(file);
    setAvatarName(file.name);
    message.success('Photo updated. Click Update Information to save all changes.');
  };

  return (
    <div className="cleaner-settings-page">
      <div className="settings-shell">
        <div className="settings-header-card">
          <div className="settings-header-left">
            <img
              className="settings-avatar"
              src={
                avatarPreview ||
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=100&h=100&q=80'
              }
              alt="Profile"
            />
            <div>
              <h2>{form.companyName || 'Upload a New Photo'}</h2>
              <p>{avatarName}</p>
            </div>
          </div>
          <Button
            className="settings-header-btn"
            icon={<UploadOutlined />}
            onClick={triggerPhotoPicker}
          >
            Update
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            hidden
          />
        </div>

        <div className="settings-grid-two">
          <section className="settings-panel">
            <div className="settings-panel-header">Profile</div>

            <div className="settings-field">
              <label>Cleaner Code</label>
              <Input value={form.cleanerCode} onChange={handleChange('cleanerCode')} />
            </div>

            <div className="settings-field settings-inline">
              <label>Profile Image</label>
              <Button
                className="settings-outline-btn"
                icon={<UploadOutlined />}
                onClick={triggerPhotoPicker}
              >
                Upload New Photo
              </Button>
            </div>

            <div className="settings-panel-subheader">Company Info</div>

            <div className="settings-row">
              <div className="settings-field">
                <label>Company Name</label>
                <Input value={form.companyName} onChange={handleChange('companyName')} />
              </div>
              <div className="settings-field">
                <label>Company Email</label>
                <Input value={form.companyEmail} onChange={handleChange('companyEmail')} />
              </div>
            </div>

            <div className="settings-field">
              <label>Phone Number</label>
              <Input value={form.phoneNumber} onChange={handleChange('phoneNumber')} />
            </div>

            <div className="settings-field">
              <label>Team Members</label>
              <Input value={form.teamMembers} onChange={handleChange('teamMembers')} />
            </div>

            <div className="settings-row">
              <div className="settings-field">
                <label>Latitude</label>
                <Input value={form.latitude} onChange={handleChange('latitude')} />
              </div>
              <div className="settings-field">
                <label>Longitude</label>
                <Input value={form.longitude} onChange={handleChange('longitude')} />
              </div>
            </div>

            <div className="settings-field">
              <label>Account Status</label>
              <Select value={form.accountStatus} onChange={handleChange('accountStatus')}>
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
                <Option value="Suspended">Suspended</Option>
              </Select>
            </div>
          </section>

          <div className="settings-right-stack">
            <section className="settings-panel">
              <div className="settings-panel-header">Location</div>

              <div className="settings-field">
                <label>Address</label>
                <Input value={form.address} onChange={handleChange('address')} />
              </div>

              <div className="settings-field">
                <label>Latitude</label>
                <Input value={form.latitude} onChange={handleChange('latitude')} />
              </div>

              <div className="settings-field">
                <label>Longitude</label>
                <Input value={form.longitude} onChange={handleChange('longitude')} />
              </div>
            </section>

            <section className="settings-panel">
              <div className="settings-panel-header">Security</div>

              <div className="settings-field">
                <label>Current Password</label>
                <Input.Password value={passwords.current} onChange={handlePasswordChange('current')} />
              </div>

              <div className="settings-field">
                <label>New Password</label>
                <Input.Password value={passwords.next} onChange={handlePasswordChange('next')} />
              </div>

              <div className="settings-field">
                <label>Confirm Password</label>
                <Input.Password value={passwords.confirm} onChange={handlePasswordChange('confirm')} />
              </div>

              <Button className="settings-primary-btn" onClick={handleUpdate}>
                Update Information
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
