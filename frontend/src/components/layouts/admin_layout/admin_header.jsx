import React, { useEffect, useState, useRef } from "react";
import {
    BellOutlined,
    MessageOutlined,
    SunOutlined,
    MoonOutlined,
    CheckOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useTheme } from "../../../contexts/theme_context";
import { useTranslation } from "../../../contexts/translation_context";
import { useAuth } from "../../../hooks/useAuth";
import { useNotificationStore } from "../../../features/admin/stores/notification.store"; 
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import "../../../styles/admin/header.css";

const AdminHeader = () => {
    const { darkMode, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useTranslation();
    const { user } = useAuth();
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

    // Mock unread messages count - replace with actual message store
    const [unreadMessages, setUnreadMessages] = useState(3);
    
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isMessageOpen, setIsMessageOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const notificationRef = useRef(null);
    const messageRef = useRef(null);
    const profileRef = useRef(null);
    const notificationButtonRef = useRef(null);
    const messageButtonRef = useRef(null);
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
            
            // Messages dropdown
            if (messageRef.current && !messageRef.current.contains(event.target) &&
                messageButtonRef.current && !messageButtonRef.current.contains(event.target)) {
                setIsMessageOpen(false);
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
        setIsMessageOpen(false);
        setIsProfileOpen(false);
        if (!isNotificationOpen) {
            fetchNotifications(true);
        }
    };

    const handleMessageClick = () => {
        setIsMessageOpen(!isMessageOpen);
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
    };

    const handleProfileClick = () => {
        setIsProfileOpen(!isProfileOpen);
        setIsNotificationOpen(false);
        setIsMessageOpen(false);
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

    const flagImage = language === "en"
        ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6Q2KLUgSM9mNbXrJDXuCuv7nfyekk4s0z8A&s"
        : "https://media.istockphoto.com/id/2032575722/vector/cambodia-flag-flag-icon-standard-color-circle-icon-flag-computer-illustration-digital.jpg?s=612x612&w=0&k=20&c=2jTISkPiDs4E7JtZxC5-5N-06kU_rDMkoNvkQ234gdA=";

    // Mock messages data
    const messages = [
        { id: 1, sender: 'John Smith', message: 'When will my cleaning start?', time: '5 min ago', unread: true },
        { id: 2, sender: 'Maria Garcia', message: 'I need to reschedule', time: '1 hour ago', unread: true },
        { id: 3, sender: 'Support Team', message: 'Your ticket has been resolved', time: '3 hours ago', unread: true },
        { id: 4, sender: 'Admin', message: 'System update tomorrow', time: '1 day ago', unread: false },
    ];

    return (
        <header className={`admin-header ${darkMode ? 'dark-mode' : ''}`}>
            <div className="header-controls">
                {/* Theme Toggle */}
                <button className="header-icon-btn" onClick={toggleTheme} title={darkMode ? 'Light mode' : 'Dark mode'}>
                    {darkMode ? <SunOutlined /> : <MoonOutlined />}
                </button>

                {/* Language Toggle */}
                <button className="header-icon-btn" onClick={toggleLanguage} title="Change language">
                    <img src={flagImage} alt={language} className="language-flag" />
                </button>

                {/* Messages Dropdown */}
                <div className="dropdown-wrapper">
                    <button 
                        ref={messageButtonRef}
                        className={`header-icon-btn ${isMessageOpen ? 'active' : ''}`}
                        onClick={handleMessageClick}
                        title="Messages"
                    >
                        <MessageOutlined />
                        {unreadMessages > 0 && (
                            <span className="badge">{unreadMessages}</span>
                        )}
                    </button>

                    {isMessageOpen && (
                        <div className="dropdown-menu messages-dropdown" ref={messageRef}>
                            <div className="dropdown-header">
                                <h3>Messages</h3>
                                <button className="view-all-btn" onClick={() => navigate('/messages')}>
                                    View all
                                </button>
                            </div>
                            
                            <div className="dropdown-list">
                                {messages.map(msg => (
                                    <div 
                                        key={msg.id} 
                                        className={`dropdown-item ${msg.unread ? 'unread' : ''}`}
                                        onClick={() => {
                                            navigate('/messages');
                                            setIsMessageOpen(false);
                                        }}
                                    >
                                        <div className="item-avatar">
                                            <UserOutlined />
                                        </div>
                                        <div className="item-content">
                                            <div className="item-header">
                                                <span className="item-title">{msg.sender}</span>
                                                <span className="item-time">{msg.time}</span>
                                            </div>
                                            <p className="item-preview">{msg.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="dropdown-footer">
                                <button onClick={() => navigate('/messages/new')}>
                                    New Message
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
                            src={user?.avatar || 'https://via.placeholder.com/32'} 
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
                                    src={user?.avatar || 'https://via.placeholder.com/48'} 
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
                                <button className="logout-btn" onClick={() => navigate('/')}>
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