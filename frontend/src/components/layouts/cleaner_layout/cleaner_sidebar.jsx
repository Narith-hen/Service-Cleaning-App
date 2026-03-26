import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  MessageOutlined,
  DollarOutlined,
  StarOutlined,
  SettingOutlined,
  LogoutOutlined,
  CloseOutlined
} from '@ant-design/icons';
import logoSomaet from '../../../assets/Logo_somaet.png';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/cleaner/sidebar.css';

const CleanerSidebar = ({ darkMode, isCompact = false, isOpen = true, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { icon: <DashboardOutlined />, label: 'Dashboard', path: '/cleaner/dashboard' },
    { icon: <CalendarOutlined />, label: 'Job Requests', path: '/cleaner/tasks' },
    { icon: <CheckSquareOutlined />, label: 'My Jobs', path: '/cleaner/my-jobs' },
    { icon: <MessageOutlined />, label: 'Messages', path: '/cleaner/messages' },
    { icon: <DollarOutlined />, label: 'Earnings', path: '/cleaner/earnings' },
    { icon: <StarOutlined />, label: 'Reviews', path: '/cleaner/reviews' },
    { icon: <SettingOutlined />, label: 'Settings', path: '/cleaner/settings' },
  ];

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure want to logout?');
    if (!confirmed) return;
    await logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className={`cleaner-sidebar ${darkMode ? 'dark' : ''} ${isCompact ? 'compact' : ''} ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-top">
        {/* Logo Section */}
        <div className="sidebar-logo">
          <img className="sidebar-brand-logo" src={logoSomaet} alt="Somaet logo" />
          <div className="logo-text">
            <h2>Somaet</h2>
            <p>CLEANER PORTAL</p>
          </div>
        </div>
        {isCompact && (
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <CloseOutlined />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => isCompact && onClose()}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={async () => { if (isCompact) onClose(); await handleLogout(); }}>
          <LogoutOutlined className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default CleanerSidebar;

