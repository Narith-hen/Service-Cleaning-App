import React, { useState, useEffect } from 'react';
import { Button, Space, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

const AnnouncementBar = ({ darkMode = false }) => {
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  const announcements = [
    { text: '🎁 Free RGB Kit on orders > $800', color: '#10b981' },
    { text: '🔧 Free PC Diagnostic This Month!', color: '#dc2626' },
    { text: '🔥 15% OFF First Repair Service', color: '#f59e0b' },
    { text: '⚡ Expert PC Building Service', color: '#3b82f6' },
  ];

  useEffect(() => {
    if (!announcementVisible) return;
    const timer = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcementVisible]);

  if (!announcementVisible) return null;

  return (
    <div
      style={{
        background: '#dc2626',
        color: '#ffffff',
        padding: '6px 0',
        position: 'relative',
      }}
    >
      <div style={{ 
        maxWidth: 1440, 
        margin: '0 auto', 
        padding: '0 16px',
        position: 'relative'
      }}>
        <Space 
          align="center" 
          size={8}
          style={{ 
            width: '100%', 
            justifyContent: 'center',
            paddingRight: 24
          }}
        >
          <span style={{ 
            fontSize: 16,
            animation: 'bounce 2s infinite'
          }}>
            {announcements[currentAnnouncement]?.text.includes('🎁') && '🎁'}
            {announcements[currentAnnouncement]?.text.includes('🔧') && '🔧'}
            {announcements[currentAnnouncement]?.text.includes('🔥') && '🔥'}
            {announcements[currentAnnouncement]?.text.includes('⚡') && '⚡'}
          </span>
          <Text strong style={{ 
            fontSize: 12.5,
            fontWeight: 600,
            textAlign: 'center',
            color:'white'
          }}>
            {announcements[currentAnnouncement]?.text}
          </Text>
        </Space>
      </div>
    </div>
  );
};

export default AnnouncementBar;