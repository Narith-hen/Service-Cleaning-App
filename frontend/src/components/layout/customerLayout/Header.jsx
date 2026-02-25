import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space, Row, Col } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  DashboardOutlined,
  CalendarOutlined,
  ShopOutlined,
  StarOutlined,
  PhoneOutlined,
  GlobalOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Header } = Layout;

const CombinedNavbar = ({ darkMode, setDarkMode, navigate, scrolled, setMobileOpen }) => {
  const menuItems = [
    {
      key: '/customer',
      icon: <DashboardOutlined />,
      label: <Link to="/customer">Dashboard</Link>
    },
    {
      key: '/services',
      icon: <ShopOutlined />,
      label: <Link to="/services">Services</Link>
    },
    {
      key: '/customer/bookings',
      icon: <CalendarOutlined />,
      label: <Link to="/customer/bookings">My Bookings</Link>
    },
    {
      key: '/customer/favorites',
      icon: <StarOutlined />,
      label: <Link to="/customer/favorites">Favorites</Link>
    },
    {
      key: '/customer/profile',
      icon: <UserOutlined />,
      label: <Link to="/customer/profile">Profile</Link>
    },
  ];

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => navigate('/customer/profile'),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: () => navigate('/login'),
        danger: true,
      },
    ],
  };

  return (
    <>
      {/* Top Bar - Like the image */}
      <div style={{ 
        background: '#001529', 
        color: 'white', 
        padding: '8px 50px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <span style={{ fontSize: 20, fontWeight: 'bold' }}>SEVANOW</span>
              <Space>
                <PhoneOutlined />
                <span>096 881 2310</span>
              </Space>
              <Space>
                <PhoneOutlined />
                <span>099 918 215</span>
              </Space>
            </Space>
          </Col>
          <Col>
            <Space>
              <GlobalOutlined />
              <span>KH</span>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Navigation Header */}
      <Header style={{ 
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
        position: 'sticky',
        top: 0,
        zIndex: 9,
        width: '100%',
        padding: '0 50px',
        height: 64,
        lineHeight: '64px'
      }}>
        {/* Mobile Menu Button */}
        <Button
          className="mobile-menu-btn"
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileOpen(true)}
          style={{ display: 'none', fontSize: '18px' }}
        />
        
        <Menu
          mode="horizontal"
          items={menuItems}
          style={{ flex: 1, border: 'none', background: 'transparent' }}
          selectedKeys={[location?.pathname]}
        />
        
        <Space size="middle">
          <Badge count={3} size="small">
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </Badge>
          
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#667eea' }} icon={<UserOutlined />} />
              <span>Customer</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>
    </>
  );
};

export default CombinedNavbar;