import React, { useEffect, useState, useRef } from "react";
import {
    BellOutlined,
    CheckOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useTheme } from "../../../contexts/theme_context";
import { useAuth } from "../../../hooks/useAuth";
import { useNotificationStore } from "../../../features/admin/stores/notification.store"; 
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import profileAdmin from "../../../assets/profileAdmin.png";
import "../../../styles/admin/header.css";

const AdminHeader = () => {
    const { darkMode } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Notification store
    const { 
        notifications, 
        unreadCount, 
        loading,
        fetchNotifications, 
        markAsRead, 
        markAllAsRead,
        deleteNotification
    } = useNotificationStore();

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const notificationRef = useRef(null);
    const profileRef = useRef(null);
    const notificationButtonRef = useRef(null);
    const profileButtonRef = useRef(null);

    // Fetch notifications on mount
    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    // Handle click outside for all dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Notifications dropdown
            if (notificationRef.current && !notificationRef.current.contains(event.target) &&
                notificationButtonRef.current && !notificationButtonRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
            
            // Profile dropdown
            if (profileRef.current && !profileRef.current.contains(event.target) &&
                profileButtonRef.current && !profileButtonRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
        setIsNotificationOpen(false);
    };

    const handleBellClick = () => {
        setIsNotificationOpen(!isNotificationOpen);
        setIsProfileOpen(false);
        if (!isNotificationOpen) {
            fetchNotifications(true);
        }
    };

    const handleProfileClick = () => {
        setIsProfileOpen(!isProfileOpen);
        setIsNotificationOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/auth/login', { replace: true });
        setIsProfileOpen(false);
    };

    const handleMarkAllAsRead = (e) => {
        e.stopPropagation();
        markAllAsRead();
    };

    const handleDeleteNotification = (e, id) => {
        e.stopPropagation();
        deleteNotification(id);
    };

    const getNotificationIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'success':
                return <CheckCircleOutlined style={{ color: '#10b981' }} />;
            case 'error':
                return <CloseCircleOutlined style={{ color: '#ef4444' }} />;
            case 'warning':
                return <WarningOutlined style={{ color: '#f59e0b' }} />;
            case 'info':
            default:
                return <InfoCircleOutlined style={{ color: '#3b82f6' }} />;
        }
    };

    const formatTime = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return '';
        }
    };

    return (
        <header className={`admin-header ${darkMode ? 'dark-mode' : ''}`}>
            <div className="header-controls">
                {/* Notifications Dropdown */}
                <div className="dropdown-wrapper">
                    <button 
                        ref={notificationButtonRef}
                        className={`header-icon-btn ${isNotificationOpen ? 'active' : ''}`}
                        onClick={handleBellClick}
                        title="Notifications"
                    >
                        <BellOutlined />
                        {unreadCount > 0 && (
                            <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                    </button>

                    {isNotificationOpen && (
                        <div className="dropdown-menu notifications-dropdown" ref={notificationRef}>
                            <div className="dropdown-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button className="mark-read-btn" onClick={handleMarkAllAsRead}>
                                        <CheckOutlined /> Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="dropdown-list">
                                {loading ? (
                                    <div className="dropdown-empty">Loading...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="dropdown-empty">
                                        <BellOutlined />
                                        <p>No notifications</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 5).map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`dropdown-item ${!notification.is_read ? 'unread' : ''}`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="item-icon">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="item-content">
                                                <div className="item-header">
                                                    <span className="item-title">{notification.title}</span>
                                                    <span className="item-time">
                                                        {formatTime(notification.created_at)}
                                                    </span>
                                                </div>
                                                <p className="item-preview">{notification.message}</p>
                                            </div>
                                            <button 
                                                className="item-delete"
                                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="dropdown-footer">
                                    <button onClick={() => {
                                        navigate('/notifications');
                                        setIsNotificationOpen(false);
                                    }}>
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="dropdown-wrapper">
                    <button 
                        ref={profileButtonRef}
                        className="profile-btn"
                        onClick={handleProfileClick}
                    >
                        <img 
                            src={user?.avatar || profileAdmin} 
                            alt="profile"
                            className="profile-avatar"
                        />
                        <div className="profile-info">
                            <span className="profile-name">{user?.name || 'Admin User'}</span>
                            <span className="profile-role">{user?.role || 'Administrator'}</span>
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className="dropdown-menu profile-dropdown" ref={profileRef}>
                            <div className="profile-header">
                                <img 
                                    src={user?.avatar || profileAdmin} 
                                    alt="profile"
                                    className="profile-large"
                                />
                                <div className="profile-details">
                                    <h4>{user?.name || 'Admin User'}</h4>
                                    <p>{user?.email || 'admin@example.com'}</p>
                                </div>
                            </div>
                            
                            <div className="dropdown-list">
                                <button className="dropdown-item-btn" onClick={() => navigate('/profile')}>
                                    <UserOutlined /> My Profile
                                </button>
                                <button className="dropdown-item-btn" onClick={() => navigate('/settings')}>
                                    <span className="icon">⚙️</span> Settings
                                </button>
                            </div>
                            
                            <div className="dropdown-footer">
                                <button className="logout-btn" onClick={handleLogout}>
                                    Sign Out
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
