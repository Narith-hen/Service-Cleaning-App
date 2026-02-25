import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  DashboardOutlined,
  CalendarOutlined,
  ShopOutlined,
  StarOutlined,
  DollarOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    switch(role) {
      case 'customer':
        return [
          { key: '/customer', icon: <DashboardOutlined />, label: 'Dashboard' },
          { key: '/customer/search', icon: <ShopOutlined />, label: 'Find Cleaners' },
          { key: '/customer/bookings', icon: <CalendarOutlined />, label: 'My Bookings' },
          { key: '/customer/favorites', icon: <StarOutlined />, label: 'Favorites' },
          { key: '/customer/profile', icon: <UserOutlined />, label: 'Profile' },
        ];
      case 'cleaner':
        return [
          { key: '/cleaner', icon: <DashboardOutlined />, label: 'Dashboard' },
          { key: '/cleaner/jobs', icon: <CalendarOutlined />, label: 'My Jobs' },
          { key: '/cleaner/schedule', icon: <ClockCircleOutlined />, label: 'Schedule' },
          { key: '/cleaner/earnings', icon: <DollarOutlined />, label: 'Earnings' },
          { key: '/cleaner/profile', icon: <UserOutlined />, label: 'Profile' },
        ];
      case 'admin':
        return [
          { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
          { key: '/admin/users', icon: <TeamOutlined />, label: 'Users' },
          { key: '/admin/bookings', icon: <FileTextOutlined />, label: 'Bookings' },
          { key: '/admin/reports', icon: <DollarOutlined />, label: 'Reports' },
          { key: '/admin/settings', icon: <SettingOutlined />, label: 'Settings' },
        ];
      default:
        return [];
    }
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => navigate(`/${role}/profile`),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: handleLogout,
        danger: true,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="dark"
        width={200}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          color: 'white',
          fontSize: collapsed ? 20 : 18,
          fontWeight: 'bold'
        }}>
          {collapsed ? 'S' : 'Somaet'}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems().map(item => ({
            ...item,
            label: <Link to={item.key}>{item.label}</Link>
          }))}
        />
      </Sider>
      
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 200,
        transition: 'all 0.2s'
      }}>
        <Header style={{ 
          padding: 0, 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <Space size="middle" style={{ marginRight: 24 }}>
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#667eea' }} icon={<UserOutlined />} />
                <span>{user?.name || role}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{
          margin: '24px 16px',
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          minHeight: 280,
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;