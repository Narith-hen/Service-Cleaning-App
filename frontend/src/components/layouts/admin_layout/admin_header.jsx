import React, { useEffect, useRef, useState } from "react";
import {
  BellOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useTheme } from "../../../contexts/theme_context";
import { useAuth } from "../../../hooks/useAuth";
import { useTranslation } from "../../../contexts/translation_context";
import { useNotificationStore } from "../../../features/admin/stores/notification.store";
import { useLocation, useNavigate } from "react-router-dom";
import "../../../styles/admin/header.css";

const AdminHeader = () => {
  const { darkMode } = useTheme();
  const { user, logout } = useAuth();
  const { ta } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    unreadCount,
    fetchNotifications,
  } = useNotificationStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);

  const fullName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || ta('Admin User');
  const firstInitial = String(user?.first_name || '').trim().charAt(0).toUpperCase();
  const lastInitial = String(user?.last_name || '').trim().charAt(0).toUpperCase();
  const avatarInitials = (firstInitial + lastInitial) || String(fullName).trim().charAt(0).toUpperCase() || 'A';

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsProfileOpen(false);
    fetchNotifications(true);
    navigate('/admin/notifications');
  };

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(ta('Are you sure want to logout?'));
    if (!confirmed) return;
    await logout();
    navigate('/auth/login', { replace: true });
    setIsProfileOpen(false);
  };

  return (
    <header className={`admin-header ${darkMode ? 'dark-mode' : ''}`}>
      <div className="header-controls">
        <div className="dropdown-wrapper">
          <button
            className={`header-icon-btn ${location.pathname.startsWith('/admin/notifications') ? 'active' : ''}`}
            onClick={handleBellClick}
            title={ta('Notifications')}
          >
            <BellOutlined />
            {unreadCount > 0 && (
              <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
        </div>

        <div className="dropdown-wrapper">
          <button ref={profileButtonRef} className="profile-btn" onClick={handleProfileClick}>
            {user?.avatar ? (
              <img src={user.avatar} alt="profile" className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">{avatarInitials}</div>
            )}
            <div className="profile-info">
              <span className="profile-name">{fullName}</span>
              <span className="profile-role">{user?.role || ta('Administrator')}</span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="dropdown-menu profile-dropdown" ref={profileRef}>
              <div className="profile-header">
                {user?.avatar ? (
                  <img src={user.avatar} alt="profile" className="profile-large" />
                ) : (
                  <div className="profile-large profile-avatar-fallback">{avatarInitials}</div>
                )}
                <div className="profile-details">
                  <h4>{fullName}</h4>
                  <p>{user?.email || 'admin@example.com'}</p>
                </div>
              </div>

              <div className="dropdown-list">
                <button className="dropdown-item-btn" onClick={() => navigate('/admin/profile')}>
                  <UserOutlined /> {ta('My Profile')}
                </button>
                <button className="dropdown-item-btn" onClick={() => navigate('/admin/settings')}>
                  <span className="icon">{ta('Settings')}</span>
                </button>
              </div>

              <div className="dropdown-footer">
                <button className="logout-btn" onClick={handleLogout}>
                  {ta('Sign Out')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
