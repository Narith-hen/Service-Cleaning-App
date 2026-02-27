import React from 'react';
import { Space, Divider, Button, Typography, Avatar } from 'antd';
import { 
  HomeOutlined, 
  InfoCircleOutlined, 
  AppstoreOutlined, 
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CloseOutlined,
  FacebookOutlined,
  MessageOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const Sidebar = ({ 
  isOpen, 
  onClose, 
  currentPath, 
  onNavigate,
  darkMode,
  onContactClick 
}) => {
  
  // Navigation menu items
  const menuItems = [
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

  // Contact information
  const contactInfo = [
    { icon: <PhoneOutlined />, text: '096 881 2310', type: 'phone', color: '#0f766e' },
    { icon: <PhoneOutlined />, text: '099 918 215', type: 'phone', color: '#0f766e' },
    { icon: <MailOutlined />, text: 'info@sevanow.com', type: 'email', color: '#dc2626' },
    { icon: <ClockCircleOutlined />, text: '8AM - 6PM, Mon - Sat', type: 'hours', color: '#0f766e' },
    { icon: <EnvironmentOutlined />, text: 'Phnom Penh, Cambodia', type: 'location', color: '#dc2626' }
  ];

  // Social media links
  const socialLinks = [
    { icon: <FacebookOutlined />, label: 'Facebook', url: '#', color: '#0f766e' },
    { icon: <MessageOutlined />, label: 'Messenger', url: '#', color: '#0f766e' },
    { icon: <WhatsAppOutlined />, label: 'WhatsApp', url: '#', color: '#25D366' },
    { icon: <YoutubeOutlined />, label: 'YouTube', url: '#', color: '#dc2626' }
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
            <div style={{
              padding: '6px',
              background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)',
              flexShrink: 0
            }}>
              <Avatar
                size={36}
                style={{
                  background: '#ffffff',
                  fontWeight: 800,
                  fontSize: 16,
                  color: '#0f766e',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                S
              </Avatar>
            </div>
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
                សម្អាត
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

        {/* Contact Information */}
        {/* <div style={{ padding: '0 24px 20px', width: '100%', boxSizing: 'border-box' }}>
          <Text strong style={{ 
            fontSize: 11,
            color: 'green',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 16,
            display: 'block',
            fontWeight: 700
          }}>
            Contact Info
          </Text>
          
          {contactInfo.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                if (item.type === 'phone') window.open(`tel:${item.text.replace(/\s/g, '')}`);
                if (item.type === 'email') window.open(`mailto:${item.text}`);
              }}
              style={{
                padding: '12px 14px',
                marginBottom: 8,
                borderRadius: 3,
                background: '#ffffff',
                border: '1px solid #f1f5f9',
                cursor: item.type === 'phone' || item.type === 'email' ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
                ':hover': item.type === 'phone' || item.type === 'email' ? {
                  background: '#f8fafc',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                  transform: 'translateX(2px)'
                } : {}
              }}
            >
              <Space size={12} align="center" style={{ width: '100%' }}>
                <div style={{
                  padding: '6px',
                  background: item.color,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 2px 8px ${item.color}30`,
                  flexShrink: 0
                }}>
                  {React.cloneElement(item.icon, {
                    style: {
                      fontSize: 14,
                      color: '#ffffff'
                    }
                  })}
                </div>
                <div style={{ 
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <Text style={{ 
                    fontSize: 13,
                    color: '#374151',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.text}
                  </Text>
                </div>
                {item.type === 'phone' || item.type === 'email' ? (
                  <div style={{ marginLeft: 'auto', opacity: 0.6, flexShrink: 0 }}>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>
                      Tap to {item.type}
                    </Text>
                  </div>
                ) : null}
              </Space>
            </div>
          ))}
        </div> */}

        <Divider style={{ 
          margin: '16px 24px',
          borderColor: '#f1f5f9'
        }} />

        {/* Social Media */}
        {/* <div style={{ padding: '0 24px 20px', width: '100%', boxSizing: 'border-box' }}>
          <Text strong style={{ 
            fontSize: 11,
            color: 'green',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 16,
            display: 'block',
            fontWeight: 700
          }}>
            Connect With Us
          </Text>
          
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            width: '100%'
          }}>
            {socialLinks.map((social, index) => (
              <Button
                key={index}
                type="text"
                icon={React.cloneElement(social.icon, { style: { fontSize: 18 } })}
                onClick={() => handleSocialClick(social.url)}
                style={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  border: `1px solid ${social.color}20`,
                  borderRadius: 3,
                  color: social.color,
                  transition: 'all 0.2s ease',
                  boxShadow: `0 3px 10px ${social.color}15`,
                  flexShrink: 0,
                  ':hover': {
                    background: `${social.color}08`,
                    borderColor: `${social.color}40`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 16px ${social.color}20`
                  }
                }}
              />
            ))}
          </div>
        </div> */}
      </div>

      {/* Call to Action Footer */}
      <div style={{ 
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
        borderTop: '1px solid #f1f5f9',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* <Button
          type="primary"
          icon={<PhoneOutlined />}
          onClick={handleCallClick}
          style={{
            width: '100%',
            height: 48,
            background: 'linear-gradient(135deg, green 0%, green 100%)',
            border: 'none',
            borderRadius: 3,
            fontSize: 15,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(15, 118, 110, 0.3)',
            transition: 'all 0.3s ease',
            ':hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(15, 118, 110, 0.4)'
            }
          }}
        >
          Call Now
        </Button> */}
        
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