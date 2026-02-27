import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Space, Row, Col, Drawer, Button, ConfigProvider } from 'antd';
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
  MenuOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import logoSomaet from '../../../assets/Logo_somaet.png';

const { Header, Content, Footer } = Layout;

const CustomerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { key: '/customer', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/services', icon: <ShopOutlined />, label: 'Services' },
    { key: '/customer/bookings', icon: <CalendarOutlined />, label: 'My Bookings' },
    { key: '/customer/favorites', icon: <StarOutlined />, label: 'Favorites' },
    { key: '/customer/profile', icon: <UserOutlined />, label: 'Profile' },
  ];

  const handleMenuClick = ({ key }) => {
    setDrawerVisible(false);
    navigate(key);
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile', onClick: () => navigate('/customer/profile') },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout, danger: true },
    ],
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#32C753',
          colorLink: '#32C753',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
      {/* Top Info Bar */}
      <div
        style={{
          background: '#16385E',
          color: 'white',
          padding: '8px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          zIndex: 11,
        }}
      >
        <Row justify="space-between" align="middle" wrap>
          <Col xs={24} sm={16}>
            <Space direction="vertical" size={4}>
              <img src={logoSomaet} alt="Somaet logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </Space>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right', marginTop: 4 }}>
            <Space>
              <GlobalOutlined /> <span>KH</span>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Navigation Header */}
      <Header
        style={{
          background: '#fff',
          padding: '0 20px',
          boxShadow: '0 1px 8px rgba(22,56,94,0.12)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Row justify="space-between" align="middle">
          {/* Desktop Menu */}
          <Col flex="auto" xs={0} md={12} lg={14}>
            <Menu
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ border: 'none' }}
            />
          </Col>

          {/* Mobile Drawer Button */}
          <Col flex="none" xs={24} md={0}>
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: '#16385E' }} />}
              onClick={() => setDrawerVisible(true)}
            />
          </Col>

          {/* Right Side Icons */}
          <Col>
            <Space size="middle">
              <Badge count={3} size="small">
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#16385E' }} />
              </Badge>
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar style={{ backgroundColor: '#32C753' }} icon={<UserOutlined />} />
                  <span>{user?.name || 'Customer'}</span>
                </Space>
              </Dropdown>
            </Space>
          </Col>
        </Row>

        {/* Mobile Drawer */}
        <Drawer
          title="Navigation"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ padding: 0 }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Drawer>
      </Header>

      {/* Content */}
      <Content style={{ padding: '24px 20px', background: '#F3F8F5' }}>
        <div style={{ padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          {children || <Outlet />}
        </div>
      </Content>

      {/* Footer */}
      <Footer style={{ textAlign: 'center', background: '#EEF2F6', borderTop: '1px solid #D8E2ED', padding: '24px 20px' }}>
        <span style={{ color: '#16385E' }}>© 2026 Somaet. All rights reserved.</span>
      </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default CustomerLayout;

