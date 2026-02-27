import React, { useState, useEffect } from 'react';
import { Row, Col, Space, Avatar, Typography, Button, Menu, Dropdown } from 'antd';
import {
  PhoneOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  MenuOutlined,
  SunOutlined,
  MoonOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TikTokOutlined,
  UserOutlined,
  LoginOutlined,
  UserAddOutlined,
  DownOutlined
} from '@ant-design/icons';

import { MessageOutlined } from '@ant-design/icons'; // For Telegram alternative

const { Text } = Typography;

const ModernResponsiveNavbar = ({ darkMode, setDarkMode, navigate, scrolled, setMobileOpen }) => {
  const [breakpoint, setBreakpoint] = useState('lg');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Change this based on auth state

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 576) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 992) setBreakpoint('md');
      else if (width < 1200) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive values
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl';

  // Navigation items
  const navItems = [
    { key: 'home', label: 'ទំព័រដើម', path: '/' },
    { key: 'services', label: 'សេវាកម្ម', path: '/services' },
    { key: 'about', label: 'អំពីយើង', path: '/about' },
    { key: 'contact', label: 'ទំនាក់ទំនង', path: '/contact' },
  ];

  // User menu for logged in users
  const userMenu = (
    <Menu
      items={[
        { key: 'profile', label: 'ប្រវត្តិរូប', onClick: () => navigate('/customer/profile') },
        { key: 'bookings', label: 'ការកក់របស់ខ្ញុំ', onClick: () => navigate('/customer/bookings') },
        { key: 'settings', label: 'ការកំណត់', onClick: () => navigate('/customer/settings') },
        { type: 'divider' },
        { key: 'logout', label: 'ចាកចេញ', danger: true, onClick: () => setIsLoggedIn(false) }
      ]}
    />
  );

  // Social media configuration
  const socialMedia = [
    {
      icon: <FacebookOutlined />,
      color: '#1877F2',
      label: 'Facebook',
      url: 'https://facebook.com/sevanow'
    },
    {
      icon: <InstagramOutlined />,
      color: '#E4405F',
      label: 'Instagram',
      url: 'https://instagram.com/sevanow'
    },
    {
      icon: <MessageOutlined />,
      color: '#26A5E4',
      label: 'Telegram',
      url: 'https://t.me/sevanow'
    },
    {
      icon: <TikTokOutlined />,
      color: '#000000',
      label: 'TikTok',
      url: 'https://tiktok.com/@sevanow'
    }
  ];

  const handleMenuClick = () => {
    if (setMobileOpen && typeof setMobileOpen === 'function') {
      setMobileOpen(true);
    }
  };

  const handleSocialClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(20px) saturate(180%)',
        background: darkMode
          ? 'rgba(15, 23, 42, 0.95)'
          : 'rgba(255, 255, 255, 0.98)',
        borderBottom: scrolled
          ? `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 118, 110, 0.1)'}`
          : 'none',
        padding: isMobile ? '8px 0' : '12px 0',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '0 16px' : '0 24px'
      }}>
        <Row align="middle" justify="space-between" wrap={false} gutter={[16, 0]}>
          {/* Logo */}
          <Col xs={10} sm={8} md={6} lg={4} xl={4}>
            <Space
              align="center"
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            >
              <div style={{
                padding: isMobile ? 4 : 6,
                background: darkMode
                  ? 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)'
                  : 'linear-gradient(135deg, #0f766e 0%, #dc2626 100%)',
                borderRadius: 3,
              }}>
                <Avatar
                  size={isMobile ? 28 : 32}
                  style={{
                    background: '#ffffff',
                    fontWeight: 800,
                    fontSize: isMobile ? 14 : 16,
                    color: darkMode ? '#0f766e' : '#dc2626',
                  }}
                >
                  S
                </Avatar>
              </div>
              <div style={{ marginLeft: isMobile ? 4 : 8 }}>
                <Text
                  strong
                  style={{
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 800,
                    color: "green",
                    fontFamily: "'Battambang', 'Khmer OS', sans-serif"
                  }}
                >
                  សម្អាត
                </Text>
              </div>
            </Space>
          </Col>

          {/* Desktop Navigation Items - Hidden on mobile */}
          {!isMobile && !isTablet && (
            <Col lg={12} xl={10}>
              <Space size="large" style={{ justifyContent: 'center', width: '100%' }}>
                {navItems.map(item => (
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

          {/* Right Side Actions */}
          <Col xs={14} sm={16} md={18} lg={8} xl={10}>
            <Row justify="end" align="middle" wrap={false} gutter={[isMobile ? 4 : 12, 0]}>

              {/* Language Selector - Desktop only */}
              {!isMobile && (
                <Col>
                  <Button
                    type="text"
                    size="small"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: darkMode ? '#e5e7eb' : '#374151'
                    }}
                    icon={<GlobalOutlined />}
                  >
                    <span>🇰🇭 KH</span>
                  </Button>
                </Col>
              )}

              {/* Dark Mode Toggle */}
              <Col>
                <Button
                  type="text"
                  shape="circle"
                  onClick={() => setDarkMode(!darkMode)}
                  icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                  style={{
                    color: darkMode ? '#fbbf24' : '#0f766e',
                  }}
                />
              </Col>

              {/* Login/Register or User Menu */}
              <Col>
                {isLoggedIn ? (
                  <Dropdown overlay={userMenu} placement="bottomRight">
                    <Button
                      type="primary"
                      style={{
                        background: 'green',
                        borderColor: 'green',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <UserOutlined />
                      {!isMobile && <span>គណនី</span>}
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
                      {!isMobile && <span>ចូល</span>}
                    </Button>
                    {!isMobile && (
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
                        <span>ចុះឈ្មោះ</span>
                      </Button>
                    )}
                  </Space>
                )}
              </Col>

              {/* Mobile Menu Button */}
              {isMobile && (
                <Col>
                  <Button
                    type="primary"
                    icon={<MenuOutlined />}
                    onClick={handleMenuClick}
                    style={{
                      background: "green",
                      borderColor: "green"
                    }}
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