import React from 'react';
import { Space, Divider, Button, Typography } from 'antd';
import {
  HomeOutlined, 
  InfoCircleOutlined, 
  AppstoreOutlined, 
  CalendarOutlined,
  BellOutlined,
  PhoneOutlined,
  CloseOutlined,
  FacebookOutlined,
  HistoryOutlined,
  MessageOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  WhatsAppOutlined,
  UserAddOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import logoSomaet from '../../../assets/Logo_somaet.png';
import { useAuth } from '../../../hooks/useAuth';

const { Text } = Typography;

const Sidebar = ({ 
  onClose, 
  currentPath, 
  onNavigate
}) => {
  const { user, logout } = useAuth();
  const isCustomerArea = currentPath?.startsWith('/customer');
  
  // Navigation menu items
  const menuItems = isCustomerArea
    ? [
      {
        key: 'home',
        label: 'My Home',
        icon: <HomeOutlined />,
        path: '/customer/dashboard',
        description: 'Customer dashboard'
      },
      {
        key: 'services',
        label: 'Service',
        icon: <AppstoreOutlined />,
        path: '/customer/services',
        description: 'Customer services'
      },
      {
        key: 'about',
        label: 'About Us',
        icon: <InfoCircleOutlined />,
        path: '/customer/about',
        description: 'Learn about Somaet'
      },
      {
        key: 'messages',
        label: 'Messages',
        icon: <MessageOutlined />,
        path: '/customer/messages',
        description: 'Open your conversations'
      },
      {
        key: 'history',
        label: 'History',
        icon: <HistoryOutlined />,
        path: '/customer/history',
        description: 'See past cleaner bookings'
      },
      {
        key: 'notifications',
        label: 'Notifications',
        icon: <BellOutlined />,
        path: '/customer/notifications',
        description: 'View booking alerts'
      },
      {
        key: 'booking',
        label: 'Booking Now',
        icon: <CalendarOutlined />,
        path: '/customer/bookings',
        description: 'Book your cleaning'
      }
    ]
    : [
      {
        key: 'home',
        label: 'Home',
        icon: <HomeOutlined />,
        path: '/',
        description: 'Welcome to SEVANOW'
      },
      {
        key: 'about',
        label: 'About Us',
        icon: <InfoCircleOutlined />,
        path: '/about',
        description: 'Learn about our company'
      },
      {
        key: 'services',
        label: 'Services',
        icon: <AppstoreOutlined />,
        path: '/services',
        description: 'Our comprehensive solutions'
      },
      {
        key: 'contact',
        label: 'Contact',
        icon: <PhoneOutlined />,
        path: '/contact',
        description: 'Get in touch with us'
      }
    ];

  const handleItemClick = (path) => {
    onNavigate(path);
    onClose();
  };

  const handleSocialClick = (url) => {
    window.open(url, '_blank');
  };

  const handleCallClick = () => {
    window.open('tel:0968812310');
    onClose();
  };

  const handleAuthAction = async () => {
    if (user) {
      const confirmed = window.confirm('Are you sure want to logout?');
      if (!confirmed) return;
      await logout();
      onNavigate('/auth/login');
      onClose();
      return;
    }

    onNavigate('/auth/register');
    onClose();
  };

  const authItem = user
    ? {
      key: 'logout',
      label: 'Log out',
      description: 'Sign out of your account',
      icon: <LogoutOutlined />,
      color: '#dc2626',
      cardBg: 'rgba(220, 38, 38, 0.06)',
      cardBorder: 'rgba(220, 38, 38, 0.2)',
      iconBg: '#dc2626'
    }
    : {
      key: 'register',
      label: 'Register',
      description: 'Create a new account',
      icon: <UserAddOutlined />,
      color: 'green',
      cardBg: 'rgba(15, 118, 110, 0.08)',
      cardBorder: 'rgba(15, 118, 110, 0.2)',
      iconBg: 'green'
    };

  return (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.08)',
      width: '100%', // Ensure full width
      maxWidth: '400px', // Limit maximum width
      overflow: 'hidden' // Prevent any overflow
    }}>
      
      {/* Sidebar Header */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box' // Include padding in width calculation
      }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <Space style={{ flexShrink: 0 }}>
            <img
              src={logoSomaet}
              alt="Somaet logo"
              style={{
                width: 44,
                height: 44,
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            <div style={{ overflow: 'hidden' }}>
              <Text strong style={{ 
                fontSize: 18, 
                color: '#0f172a',
                display: 'block',
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Somaet
              </Text>
            </div>
          </Space>
          
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{
              color: '#64748b',
              fontSize: 18,
              width: 36,
              height: 36,
              minWidth: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f1f5f9',
              borderRadius: 3,
              transition: 'all 0.2s ease',
              flexShrink: 0,
              ':hover': {
                background: '#e2e8f0',
                color: '#0f172a'
              }
            }}
          />
        </Space>
      </div>

      {/* Scrollable Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        overflowX: 'hidden', // Prevent horizontal scroll
        paddingBottom: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* Navigation Menu */}
        <div style={{ padding: '24px 24px 0' }}>
          <Text strong style={{ 
            fontSize: 11,
            color: 'green',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 16,
            display: 'block',
            fontWeight: 700
          }}>
            Navigation
          </Text>
          
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => handleItemClick(item.path)}
              style={{
                padding: '14px 16px',
                marginBottom: 8,
                borderRadius: 3,
                background: currentPath === item.path
                  ? 'rgba(15, 118, 110, 0.08)'
                  : '#ffffff',
                border: `1px solid ${currentPath === item.path
                  ? 'rgba(15, 118, 110, 0.2)'
                  : '#f1f5f9'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: currentPath === item.path 
                  ? '0 4px 12px rgba(15, 118, 110, 0.1)' 
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
                ':hover': {
                  background: '#f8fafc',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                  transform: 'translateX(2px)'
                }
              }}
            >
              <Space size={14} align="center" style={{ width: '100%' }}>
                <div style={{
                  padding: '8px',
                  background: currentPath === item.path
                    ? 'linear-gradient(135deg, green 0%, green 100%)'
                    : '#f1f5f9',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: currentPath === item.path 
                    ? '0 2px 8px rgba(15, 118, 110, 0.3)' 
                    : '0 1px 3px rgba(0, 0, 0, 0.08)',
                  flexShrink: 0
                }}>
                  {React.cloneElement(item.icon, {
                    style: {
                      fontSize: 16,
                      color: currentPath === item.path ? '#ffffff' : '#64748b'
                    }
                  })}
                </div>
                <div style={{ 
                  flex: 1,
                  minWidth: 0, // Allow text truncation
                  overflow: 'hidden'
                }}>
                  <Text strong style={{ 
                    fontSize: 14, 
                    color: currentPath === item.path ? 'green' : '#0f172a',
                    display: 'block',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.label}
                  </Text>
                  <Text style={{ 
                    fontSize: 11, 
                    color: currentPath === item.path ? 'green' : '#64748b',
                    marginTop: 2,
                    display: 'block',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.description}
                  </Text>
                </div>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: currentPath === item.path ? 'green' : 'transparent',
                  flexShrink: 0
                }} />
              </Space>
            </div>
          ))}
        </div>

        <Divider style={{ 
          margin: '24px',
          borderColor: '#f1f5f9'
        }} />

        <div style={{ padding: '0 24px 0' }}>
          <Text strong style={{ 
            fontSize: 11,
            color: 'green',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 16,
            display: 'block',
            fontWeight: 700
          }}>
            Account
          </Text>

          <div
            onClick={handleAuthAction}
            style={{
              padding: '14px 16px',
              marginBottom: 8,
              borderRadius: 3,
              background: authItem.cardBg,
              border: `1px solid ${authItem.cardBorder}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            <Space size={14} align="center" style={{ width: '100%' }}>
              <div style={{
                padding: '8px',
                background: authItem.iconBg,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${authItem.cardBorder}`,
                flexShrink: 0
              }}>
                {React.cloneElement(authItem.icon, {
                  style: {
                    fontSize: 16,
                    color: '#ffffff'
                  }
                })}
              </div>
              <div style={{ 
                flex: 1,
                minWidth: 0,
                overflow: 'hidden'
              }}>
                <Text strong style={{ 
                  fontSize: 14, 
                  color: authItem.color,
                  display: 'block',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {authItem.label}
                </Text>
                <Text style={{ 
                  fontSize: 11, 
                  color: '#64748b',
                  marginTop: 2,
                  display: 'block',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {authItem.description}
                </Text>
              </div>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: authItem.color,
                flexShrink: 0
              }} />
            </Space>
          </div>
        </div>

        
        <Text style={{ 
          fontSize: 11,
          color: '#64748b',
          textAlign: 'center',
          display: 'block',
          marginTop: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          Available 8AM - 6PM, Monday to Saturday
        </Text>
      </div>
    </div>
  );
};

export default Sidebar;
