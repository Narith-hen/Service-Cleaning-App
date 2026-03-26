import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../contexts/translation_context';
import {
  DashboardOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ToolOutlined,
  StarOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  CloseOutlined
} from '@ant-design/icons';
import logoSomaet from '../../../assets/Logo_somaet.png';
import '../../../styles/admin/sidebar.css';

const AdminSidebar = ({ isCompact = false, isOpen = true, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { ta } = useTranslation();

  const menuSections = [
    {
      title: null,
      items: [
        { icon: <DashboardOutlined />, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: <CalendarOutlined />, label: 'Bookings', path: '/admin/bookings' },
        { icon: <SafetyCertificateOutlined />, label: 'Cleaners', path: '/admin/cleaners' },
        { icon: <TeamOutlined />, label: 'Customers', path: '/admin/customers' },
      ]
    },
    {
      title: null,
      items: [
        { icon: <ToolOutlined />, label: 'Services', path: '/admin/services' },
        { icon: <StarOutlined />, label: 'Reviews', path: '/admin/reviews' },
      ]
    },
    {
      title: null,
      items: [
        { icon: <BarChartOutlined />, label: 'Revenue Analysis', path: '/admin/reports/revenue' },
      ]
    }
  ];

  const handleLogout = async () => {
    const confirmed = window.confirm(ta('Are you sure want to logout?'));
    if (!confirmed) return;
    await logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className={`admin-sidebar ${isCompact ? 'compact' : ''} ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-top">
        {/* Logo Section */}
        <div className="sidebar-logo">
          <img className="sidebar-brand-logo" src={logoSomaet} alt="Somaet logo" />
          <div className="logo-text">
            <h2>Somaet Admin</h2>
            <p>{ta('Enterprise Edition')}</p>
          </div>
        </div>
        {isCompact && (
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <CloseOutlined />
          </button>
        )}
      </div>

      {/* Navigation Menu with Sections */}
      <nav className="sidebar-nav">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="nav-section">
            {section.title && (
              <div className="section-title">{section.title}</div>
            )}
            {section.items.map((item, itemIndex) => (
              <NavLink
                key={itemIndex}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => isCompact && onClose()}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{ta(item.label)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="sidebar-footer">
        <NavLink to="/admin/settings" className="nav-item" onClick={() => isCompact && onClose()}>
          <span className="nav-icon"><SettingOutlined /></span>
          <span className="nav-label">{ta('Settings')}</span>
        </NavLink>
        
        <button className="logout-btn" onClick={() => { if (isCompact) onClose(); handleLogout(); }}>
          <LogoutOutlined className="nav-icon" />
          <span>{ta('Logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;

