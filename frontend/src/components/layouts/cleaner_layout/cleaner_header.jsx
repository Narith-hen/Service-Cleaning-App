import React, { useEffect, useRef, useState } from "react";
import {
  BellOutlined,
  UserOutlined,
  EditOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useAuth } from "../../../hooks/useAuth";
import { useNotificationStore } from "../../../features/cleaner/stores/useNotification.store";
import { useLocation, useNavigate } from "react-router-dom";
import "../../../styles/cleaner/cleaner_header.css";

const CleanerHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    unreadCount,
    fetchNotifications,
  } = useNotificationStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);
  const toastTimerRef = useRef(null);

  const displayName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Cleaner User';
  const firstInitial = String(user?.first_name || '').trim().charAt(0).toUpperCase();
  const lastInitial = String(user?.last_name || '').trim().charAt(0).toUpperCase();
  const avatarInitials = (firstInitial + lastInitial) || String(displayName).trim().charAt(0).toUpperCase() || 'C';
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatar]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!user) return undefined;

    const intervalId = window.setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, fetchNotifications]);

  useEffect(() => {
    const syncNotifications = () => {
      fetchNotifications(true);
    };

    window.addEventListener('storage', syncNotifications);
    window.addEventListener('cleaner-notifications-updated', syncNotifications);
    return () => {
      window.removeEventListener('storage', syncNotifications);
      window.removeEventListener('cleaner-notifications-updated', syncNotifications);
    };
  }, [fetchNotifications]);

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

  useEffect(() => {
    const handleNavbarMessage = (event) => {
      const detail = event?.detail || {};
      if (!detail.text) return;
      setToast({ text: detail.text, type: detail.type || 'success' });
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => setToast(null), detail.duration || 3000);
    };

    window.addEventListener('cleaner:navbar-message', handleNavbarMessage);
    return () => {
      window.removeEventListener('cleaner:navbar-message', handleNavbarMessage);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleBellClick = () => {
    setIsProfileOpen(false);
    fetchNotifications(true);
    navigate('/cleaner/notifications');
  };

  const handleProfileClick = () => {
    setIsProfileOpen(false);
    navigate('/cleaner/settings');
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure want to logout?');
    if (!confirmed) return;
    await logout();
    navigate('/auth/login', { replace: true });
    setIsProfileOpen(false);
  };

  return (
    <>
      <header className="admin-header">
      {toast && (
        <div className={`header-toast ${toast.type}`}>
          <span>{toast.text}</span>
        </div>
      )}
      <div className="header-controls">
        <div className="dropdown-wrapper">
          <button
            className={`header-icon-btn ${location.pathname.startsWith('/cleaner/notifications') ? 'active' : ''}`}
            onClick={handleBellClick}
            title="Notifications"
          >
            <BellOutlined />
            {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
        </div>

        <div className="dropdown-wrapper">
          <button ref={profileButtonRef} className="profile-btn" onClick={handleProfileClick}>
            {user?.avatar && !avatarFailed ? (
              <img
                src={user.avatar}
                alt="profile"
                className="profile-avatar"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">{avatarInitials}</div>
            )}
            <div className="profile-info">
              <span className="profile-name">{displayName}</span>
              <span className="profile-role">{user?.role || 'cleaner'}</span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="dropdown-menu profile-dropdown" ref={profileRef}>
              <div className="profile-header">
                {user?.avatar && !avatarFailed ? (
                  <img
                    src={user.avatar}
                    alt="profile"
                    className="profile-large"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <div className="profile-large profile-avatar-fallback">{avatarInitials}</div>
                )}
                <div className="profile-details">
                  <h4>{displayName}</h4>
                  <p>{user?.email || 'cleaner@example.com'}</p>
                </div>
              </div>

              <div className="dropdown-list">
                <button
                  className="dropdown-item-btn"
                  onClick={() => {
                    navigate('/cleaner/settings');
                    setIsProfileOpen(false);
                  }}
                >
                  <UserOutlined /> View Profile
                </button>
                <button
                  className="dropdown-item-btn"
                  onClick={() => {
                    navigate('/cleaner/settings');
                    setIsProfileOpen(false);
                  }}
                >
                  <EditOutlined /> Edit Profile
                </button>
              </div>

              <div className="dropdown-footer">
                <button className="logout-btn" onClick={handleLogout}>
                  <LogoutOutlined /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </header>
    </>
  );
};

export default CleanerHeader;
