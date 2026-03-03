import React, { useState, useEffect } from 'react';
import { Row, Col, Space, Typography, Button, Dropdown } from 'antd';
import { useLocation } from 'react-router-dom';
import {
  MenuOutlined,
  SunOutlined,
  MoonOutlined,
  UserOutlined,
  LoginOutlined,
  UserAddOutlined,
  DownOutlined,
  LogoutOutlined,
  EditOutlined
} from '@ant-design/icons';
import logoSomaet from '../../../assets/Logo_somaet.png';
import { useAuth } from '../../../hooks/useAuth';

const { Text } = Typography;
const TARGET_SCREEN_BREAKPOINT = 1280;
const TARGET_SCREEN_CONTAINER_WIDTH = 1280;

const ModernResponsiveNavbar = ({ darkMode, setDarkMode, navigate, scrolled, setMobileOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [breakpoint, setBreakpoint] = useState('lg');

  const isCustomerArea = location.pathname.startsWith('/customer');
  const isCustomerUser = user?.role === 'customer' || isCustomerArea;
  const isCustomerDashboard =
    location.pathname === '/customer/dashboard' || location.pathname === '/customer/home';
  const displayName = user?.name || user?.first_name || 'Customer';
  const avatarSrc = user?.avatar || 'https://i.pravatar.cc/64?img=12';

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 576) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 992) setBreakpoint('md');
      else if (width <= TARGET_SCREEN_BREAKPOINT) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isLaptopL = breakpoint === 'lg';
  const isCompactNav = isMobile || isTablet || isLaptopL;

  const navItems = [
    { key: 'home', label: 'My Home', path: isCustomerArea ? '/customer/dashboard' : '/' },
    { key: 'services', label: 'Services', path: '/services' },
    { key: 'about', label: 'About Us', path: '/about' },
    { key: 'contact', label: 'Contact Us', path: '/contact' }
  ];

  const handleMenuClick = () => {
    if (setMobileOpen && typeof setMobileOpen === 'function') {
      setMobileOpen(true);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };
  const showDarkModeToggle = location.pathname !== '/';

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const profileMenu = {
    items: [
      {
        key: 'view-profile',
        icon: <UserOutlined />,
        label: 'View Profile'
      },
      {
        key: 'update-info',
        icon: <EditOutlined />,
        label: 'Update Info'
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        danger: true
      }
    ],
    onClick: ({ key }) => {
      if (key === 'view-profile') navigate('/customer/profile');
      if (key === 'update-info') navigate('/customer/profile/edit');
      if (key === 'logout') handleLogout();
    }
  };

  return (
    <nav
      style={{
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(20px) saturate(180%)',
        background: darkMode
          ? 'rgba(15, 23, 42, 0.95)'
          : 'rgba(255, 255, 255, 0.98)',
        borderBottom: scrolled
          ? `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 118, 110, 0.1)'}`
          : 'none',
        padding: isMobile ? '8px 0' : '12px 0',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      <div
        style={{
          maxWidth: `${TARGET_SCREEN_CONTAINER_WIDTH}px`,
          margin: '0 auto',
          padding: isMobile ? '0 16px' : '0 24px'
        }}
      >
        <Row align="middle" justify="space-between" wrap={false} gutter={[16, 0]}>
          <Col xs={10} sm={8} md={6} lg={4} xl={4}>
            <Space align="center" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <img
                src={logoSomaet}
                alt="Somaet logo"
                style={{
                  width: isMobile ? 42 : 50,
                  height: isMobile ? 42 : 50,
                  objectFit: 'contain',
                  flexShrink: 0
                }}
              />
              <div style={{ marginLeft: isMobile ? 4 : 8 }}>
                <Text
                  strong
                  style={{
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 800,
                    color: 'green',
                    fontFamily: "'Battambang', 'Khmer OS', sans-serif"
                  }}
                >
                  Somaet
                </Text>
              </div>
            </Space>
          </Col>

          {!isCompactNav && (
            <Col lg={12} xl={10}>
              <Space size="large" style={{ justifyContent: 'center', width: '100%' }}>
                {navItems.map((item) => (
                  <Button
                    key={item.key}
                    type="text"
                    onClick={() => handleNavigation(item.path)}
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: darkMode ? '#e5e7eb' : '#374151',
                      padding: '8px 16px',
                      height: 'auto',
                      fontFamily: "'Battambang', 'Khmer OS', sans-serif",
                      borderBottom: location.pathname === item.path ? '2px solid green' : 'none',
                      borderRadius: 0
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Space>
            </Col>
          )}

          <Col xs={14} sm={16} md={18} lg={8} xl={10}>
            <Row justify="end" align="middle" wrap={false} gutter={[isMobile ? 4 : 12, 0]}>
              {showDarkModeToggle && (
                <Col>
                  <Button
                    type="text"
                    shape="circle"
                    onClick={() => setDarkMode(!darkMode)}
                    icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                    style={{
                      color: darkMode ? '#fbbf24' : '#0f766e'
                    }}
                  />
                </Col>
              )}

              <Col>
                {isCustomerUser && isCustomerDashboard ? (
                  <Dropdown menu={profileMenu} placement="bottomRight">
                    <Button
                      style={{
                        background: '#f6f7fb',
                        borderColor: '#d7dbe7',
                        color: '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        height: 42,
                        borderRadius: 999,
                        paddingInline: 10
                      }}
                    >
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid #d1d5db'
                        }}
                      />
                      {!isCompactNav && (
                        <span style={{ fontWeight: 600, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayName}
                        </span>
                      )}
                      <DownOutlined />
                    </Button>
                  </Dropdown>
                ) : (
                  <Space size={4}>
                    <Button
                      type="primary"
                      onClick={() => navigate('/auth/login')}
                      style={{
                        background: 'green',
                        borderColor: 'green',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <LoginOutlined />
                      {!isCompactNav && <span>Login</span>}
                    </Button>
                    {!isCompactNav && (
                      <Button
                        onClick={() => navigate('/auth/register')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          borderColor: 'green',
                          color: 'green'
                        }}
                      >
                        <UserAddOutlined />
                        <span>Register</span>
                      </Button>
                    )}
                  </Space>
                )}
              </Col>

              {isCompactNav && (
                <Col>
                  <Button
                    type="primary"
                    icon={<MenuOutlined />}
                    onClick={handleMenuClick}
                    style={{ background: 'green', borderColor: 'green' }}
                  />
                </Col>
              )}
            </Row>
          </Col>
        </Row>
      </div>
    </nav>
  );
};

export default ModernResponsiveNavbar;
