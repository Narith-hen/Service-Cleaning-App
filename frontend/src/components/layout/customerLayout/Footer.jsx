import React from 'react';
import { Layout, Row, Col, Typography, Space } from 'antd';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Footer } = Layout;
const { Title, Text } = Typography;

const AppFooter = () => {
  return (
    <Footer style={{ 
      background: '#001529',
      color: 'white',
      padding: '48px 50px 24px'
    }}>
      <Row gutter={[48, 32]} justify="center">
        <Col xs={24} md={8}>
          <Title level={4} style={{ color: 'white', marginBottom: 20 }}>SEVANOW</Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
            Your trusted partner for tech solutions and services.
          </Text>
        </Col>
        
        <Col xs={24} md={8}>
          <Title level={4} style={{ color: 'white', marginBottom: 20 }}>Quick Links</Title>
          <Space direction="vertical">
            <Link to="/about" style={{ color: 'rgba(255,255,255,0.7)' }}>About Us</Link>
            <Link to="/services" style={{ color: 'rgba(255,255,255,0.7)' }}>Services</Link>
            <Link to="/contact" style={{ color: 'rgba(255,255,255,0.7)' }}>Contact</Link>
          </Space>
        </Col>
        
        <Col xs={24} md={8}>
          <Title level={4} style={{ color: 'white', marginBottom: 20 }}>Contact Info</Title>
          <Space direction="vertical">
            <Space>
              <PhoneOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>096 881 2310</Text>
            </Space>
            <Space>
              <PhoneOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>099 918 215</Text>
            </Space>
            <Space>
              <MailOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>info@sevanow.com</Text>
            </Space>
            <Space>
              <EnvironmentOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Phnom Penh, Cambodia</Text>
            </Space>
          </Space>
        </Col>
      </Row>
      
      <div style={{ 
        textAlign: 'center', 
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
          © 2026 SEVANOW. All rights reserved.
        </Text>
      </div>
    </Footer>
  );
};

export default AppFooter;