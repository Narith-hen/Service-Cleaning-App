import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  DashboardOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  StarOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import '../../../styles/cleaner/sidebar.css';

const CleanerSidebar = ({ darkMode }) => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: <DashboardOutlined />, label: 'Dashboard', path: '/cleaner/dashboard' },
    { icon: <CalendarOutlined />, label: 'Job Requests', path: '/cleaner/job-requests' },
    { icon: <CheckSquareOutlined />, label: 'My Jobs', path: '/cleaner/my-jobs' },
    { icon: <DollarOutlined />, label: 'Earnings', path: '/cleaner/earnings' },
    { icon: <StarOutlined />, label: 'Reviews', path: '/cleaner/reviews' },
    { icon: <SettingOutlined />, label: 'Settings', path: '/cleaner/settings' },
  ];

  const handleLogout = () => {
    // Add logout logic
    navigate('/');
  };

  return (
    <div className={`cleaner-sidebar ${darkMode ? 'dark' : ''}`}>
      {/* Logo Section */}
      <div className="sidebar-logo">
        <div className="logo-circle">CP</div>
        <div className="logo-text">
          <h2>CleanPro</h2>
          <p>CLEANER PORTAL</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogoutOutlined className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default CleanerSidebar;