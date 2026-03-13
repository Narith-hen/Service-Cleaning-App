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
  LogoutOutlined
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
  const showCustomerProfileMenu = isCustomerArea && isCustomerUser;
  const displayName = user?.name || user?.first_name || 'Customer';
  const avatarSrc = user?.avatar || '';
  const firstInitial = String(user?.first_name || '').trim().charAt(0).toUpperCase();
  const lastInitial = String(user?.last_name || '').trim().charAt(0).toUpperCase();
  const fallbackInitials = (firstInitial + lastInitial) || String(displayName).trim().charAt(0).toUpperCase() || 'C';

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
  const navLinkGap = isCustomerArea ? 26 : 18;
  const leftColProps = isCompactNav
    ? { xs: 10, sm: 8, md: 6, lg: 4, xl: 4 }
    : { flex: 'none' };
  const rightColProps = isCompactNav
    ? { xs: 14, sm: 16, md: 18, lg: 8, xl: 10 }
    : { flex: 'none' };

  const navItems = isCustomerArea
    ? [
      { key: 'home', label: 'My Home', path: '/customer/dashboard' },
      { key: 'services', label: 'Service', path: '/customer/services' },
      { key: 'messages', label: 'Messages', path: '/customer/messages' },
      { key: 'contact', label: 'Contact', path: '/customer/contact' }
    ]
    : [
      { key: 'home', label: 'Home', path: '/' },
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
  const showDarkModeToggle = true;

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
          <Col {...leftColProps}>
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
                    fontFamily: "'Noto Sans', sans-serif"
                  }}
                >
                  Somaet
                </Text>
              </div>
            </Space>
          </Col>

          {!isCompactNav && (
            <Col flex="auto" style={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
              <Space size={isCustomerArea ? 18 : 'large'} align="center" style={{ justifyContent: 'center', width: '100%' }}>
                <Space size={navLinkGap} align="center">
                  {navItems.map((item) => (
                    <Button
                      key={item.key}
                      type="text"
                      onClick={() => handleNavigation(item.path)}
                      style={{
                        fontSize: 16,
                        fontWeight: 500,
                        color: darkMode ? '#e5e7eb' : '#374151',
                        padding: '8px 12px',
                        height: 'auto',
                        fontFamily: "'Noto Sans', sans-serif",
                        borderBottom: location.pathname === item.path ? '2px solid green' : 'none',
                        borderRadius: 0
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Space>
              </Space>
            </Col>
          )}

          {isCustomerArea && !isMobile && (
                <Col>
                  <Button
                    type="primary"
                    onClick={() => handleNavigation('/customer/bookings')}
                    style={{
                      background: '#008000',
                      borderColor: '#008000',
                      borderRadius: 24,
                      height: 40,
                      paddingInline: isCompactNav ? 12 : 18,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "'Noto Sans', sans-serif"
                    }}
                  >
                    Booking Now
                  </Button>
                </Col>
              )}


          <Col {...rightColProps}>
            <Row
              justify="end"
              align="middle"
              wrap={false}
              gutter={[isMobile ? 4 : 12, 0]}
              style={{ direction: 'ltr' }}
            >
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
                {showCustomerProfileMenu ? (
                  <Dropdown menu={profileMenu} placement="bottomRight">
                    <Button
                      type="text"
                      style={{
                        background: '#f8fafc',
                        border: 'none',
                        borderColor: 'transparent',
                        outline: 'none',
                        color: '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        height: 40,
                        borderRadius: 999,
                        paddingInline: isCompactNav ? 8 : 13,
                        boxShadow: 'none',
                        // backgroundColor: '#fff9c3',
                      }}
                    >
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={displayName}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: darkMode ? 'none' : '1px solid #cbd5e1'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            border: darkMode ? 'none' : '1.5px solid #008000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#e2e8f0',
                            color: '#111827',
                            fontSize: 11,
                            fontWeight: 600,
                            lineHeight: 1
                          }}
                        >
                          {fallbackInitials}
                        </div>
                      )}
                      {!isCompactNav && (
                        <span style={{ fontWeight: 700, fontSize: 14, maxWidth: 128, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayName}
                        </span>
                      )}
                      <DownOutlined style={{ fontSize: 14 }} />
                    </Button>
                  </Dropdown>
                ) : (
                  <Space size={isCompactNav ? 6 : 4}>
                    <Button
                      type="primary"
                      onClick={() => navigate('/auth/login')}
                      style={{
                        background: 'green',
                        borderColor: 'green',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: isCompactNav ? 0 : '18px 16px',
                        borderRadius: 24,
                        ...(isCompactNav
                          ? {
                            width: 36,
                            height: 36
                          }
                          : {})
                      }}
                    >
                      <LoginOutlined />
                      {!isCompactNav && <span>Login</span>}
                    </Button>
                    <Button
                      onClick={() => navigate('/auth/register')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        borderColor: 'green',
                        color: 'green',
                        padding: isCompactNav ? 0 : '18px 14px',
                        borderRadius: 24,
                        ...(isCompactNav
                          ? {
                            width: 36,
                            height: 36
                          }
                          : {})
                      }}
                    >
                      <UserAddOutlined />
                      {!isCompactNav && <span>Register</span>}
                    </Button>
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
