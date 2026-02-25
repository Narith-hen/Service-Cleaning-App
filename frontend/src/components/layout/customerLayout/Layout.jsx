import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Space, Row, Col, Drawer, Button } from 'antd';
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
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const { Header, Content, Footer } = Layout;

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { key: '/customer', icon: <DashboardOutlined />, label: <Link to="/customer">Dashboard</Link> },
    { key: '/services', icon: <ShopOutlined />, label: <Link to="/services">Services</Link> },
    { key: '/customer/bookings', icon: <CalendarOutlined />, label: <Link to="/customer/bookings">My Bookings</Link> },
    { key: '/customer/favorites', icon: <StarOutlined />, label: <Link to="/customer/favorites">Favorites</Link> },
    { key: '/customer/profile', icon: <UserOutlined />, label: <Link to="/customer/profile">Profile</Link> },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile', onClick: () => navigate('/customer/profile') },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout, danger: true },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Top Info Bar */}
      <div
        style={{
          background: '#001529',
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
              <span style={{ fontSize: 18, fontWeight: 'bold' }}>SEVANOW</span>
              <Space size="small">
                <PhoneOutlined /> <span>096 881 2310</span>
              </Space>
              <Space size="small">
                <PhoneOutlined /> <span>099 918 215</span>
              </Space>
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
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Row justify="space-between" align="middle">
          {/* Desktop Menu */}
          <Col flex="auto" className="desktop-menu" style={{ display: 'none' }}>
            <Menu
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              style={{ border: 'none' }}
            />
          </Col>

          {/* Mobile Drawer Button */}
          <Col flex="none" className="mobile-menu" style={{ display: 'block' }}>
            <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} />
          </Col>

          {/* Right Side Icons */}
          <Col>
            <Space size="middle">
              <Badge count={3} size="small">
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
              </Badge>
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar style={{ backgroundColor: '#667eea' }} icon={<UserOutlined />} />
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
          visible={drawerVisible}
          bodyStyle={{ padding: 0 }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={() => setDrawerVisible(false)}
          />
        </Drawer>
      </Header>

      {/* Content */}
      <Content style={{ padding: '24px 20px', background: '#f0f2f5' }}>
        <div style={{ padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </div>
      </Content>

      {/* Footer */}
      <Footer style={{ textAlign: 'center', background: '#f5f5f5', borderTop: '1px solid #e8e8e8', padding: '24px 20px' }}>
        <span style={{ color: '#999' }}>© 2026 Somaet. All rights reserved.</span>
      </Footer>
    </Layout>
  );
};

export default CustomerLayout;