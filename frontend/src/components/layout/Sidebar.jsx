import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  ShopOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  StarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => {
  const { role } = useAuth();
  const location = useLocation();

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
          { key: '/admin/cleaners', icon: <UserOutlined />, label: 'Cleaners' },
          { key: '/admin/bookings', icon: <FileTextOutlined />, label: 'Bookings' },
          { key: '/admin/reports', icon: <DollarOutlined />, label: 'Reports' },
          { key: '/admin/settings', icon: <SettingOutlined />, label: 'Settings' },
        ];
      
      default:
        return [];
    }
  };

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={collapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div style={{ 
        height: 64, 
        margin: 16, 
        background: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8
      }}>
        {!collapsed ? (
          <span style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            Somaet {role}
          </span>
        ) : (
          <span style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Somaet</span>
        )}
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
  );
};

export default Sidebar;