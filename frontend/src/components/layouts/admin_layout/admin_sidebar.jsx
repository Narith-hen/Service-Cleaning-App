import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  DashboardOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ToolOutlined,
  GiftOutlined,
  StarOutlined,
  BarChartOutlined,
  LineChartOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import '../../../styles/admin/sidebar.css';

const AdminSidebar = () => {
  const navigate = useNavigate();

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
        { icon: <GiftOutlined />, label: 'Promotions', path: '/admin/promotions' },
        { icon: <StarOutlined />, label: 'Reviews', path: '/admin/reviews' },
      ]
    },
    {
      title: null,
      items: [
        { icon: <BarChartOutlined />, label: 'Revenue Analysis', path: '/admin/reports/revenue' },
        { icon: <LineChartOutlined />, label: 'Performance', path: '/admin/reports/performance' },
      ]
    }
  ];

  const handleLogout = () => {
    // Add logout logic
    navigate('/');
  };

  return (
    <div className="admin-sidebar">
      {/* Logo Section */}
      <div className="sidebar-logo">
        <div className="logo-circle">AP</div>
        <div className="logo-text">
          <h2>CleanPro Admin</h2>
          <p>Enterprise Edition</p>
        </div>
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
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="sidebar-footer">
        <NavLink to="/admin/settings" className="nav-item">
          <span className="nav-icon"><SettingOutlined /></span>
          <span className="nav-label">Settings</span>
        </NavLink>
        
        <button className="logout-btn" onClick={handleLogout}>
          <LogoutOutlined className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;