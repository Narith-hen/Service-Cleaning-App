import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, Layout, Menu, Space, Avatar } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  LoginOutlined, 
  UserAddOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  StarOutlined,
  TeamOutlined,
  TrophyOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const AboutPage = () => {
  const { user, role } = useAuth();

  const team = [
    { name: 'Sarah Johnson', role: 'CEO & Founder', image: 'https://i.pravatar.cc/150?u=1' },
    { name: 'Michael Chen', role: 'Operations Manager', image: 'https://i.pravatar.cc/150?u=2' },
    { name: 'Emma Wilson', role: 'Customer Success', image: 'https://i.pravatar.cc/150?u=3' },
    { name: 'David Brown', role: 'Training Manager', image: 'https://i.pravatar.cc/150?u=4' }
  ];

  const values = [
    {
      icon: <StarOutlined style={{ fontSize: 32 }} />,
      title: 'Quality',
      description: 'We never compromise on quality. Every cleaning is done to the highest standards.'
    },
    {
      icon: <TeamOutlined style={{ fontSize: 32 }} />,
      title: 'Trust',
      description: 'All our cleaners are thoroughly vetted, trained, and insured for your peace of mind.'
    },
    {
      icon: <HeartOutlined style={{ fontSize: 32 }} />,
      title: 'Care',
      description: 'We care about your home as much as you do. Attention to detail in every clean.'
    },
    {
      icon: <TrophyOutlined style={{ fontSize: 32 }} />,
      title: 'Excellence',
      description: 'Striving for excellence in everything we do, from booking to cleaning.'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Navigation Header - same as ServicesPage */}
      <Header style={{ 
        position: 'fixed', 
        zIndex: 1, 
        width: '100%', 
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 50px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 15,
            color: 'white',
            fontWeight: 'bold',
            fontSize: 20
          }}>
            S
          </div>
          <Title level={3} style={{ margin: 0, color: '#333' }}>Somaet</Title>
        </div>
        
        <Menu mode="horizontal" style={{ border: 'none', flex: 1, justifyContent: 'center' }}>
          <Menu.Item key="home" icon={<HomeOutlined />}>
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="services" icon={<AppstoreOutlined />}>
            <Link to="/services">Services</Link>
          </Menu.Item>
          <Menu.Item key="about" icon={<InfoCircleOutlined />}>
            <Link to="/about">About</Link>
          </Menu.Item>
          <Menu.Item key="contact" icon={<PhoneOutlined />}>
            <Link to="/contact">Contact</Link>
          </Menu.Item>
        </Menu>

        <Space>
          {user ? (
            <Link to={`/${role}`}>
              <Button type="primary" icon={<UserOutlined />}>
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button icon={<LoginOutlined />}>Log In</Button>
              </Link>
              <Link to="/register">
                <Button type="primary" icon={<UserAddOutlined />}>
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </Space>
      </Header>

      <Content style={{ marginTop: 64 }}>
        {/* Hero Section */}
        <section style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <Title style={{ color: 'white', fontSize: 48, marginBottom: 20 }}>
            About Somaet
          </Title>
          <Paragraph style={{ color: 'white', fontSize: 20, maxWidth: 600, margin: '0 auto' }}>
            We're on a mission to make professional cleaning accessible to everyone
          </Paragraph>
        </section>

        {/* Story Section */}
        <section style={{ padding: '80px 50px', maxWidth: 1000, margin: '0 auto' }}>
          <Row gutter={[50, 50]} align="middle">
            <Col xs={24} md={12}>
              <Title level={2}>Our Story</Title>
              <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
                Founded in 2020, Somaet started with a simple idea: make it easy for people 
                to find trusted, professional cleaners. What began as a small local service 
                has grown into a platform connecting thousands of satisfied customers with 
                vetted cleaning professionals.
              </Paragraph>
              <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
                Today, we're proud to serve customers across the country, maintaining the 
                same commitment to quality and customer satisfaction that defined our early days.
              </Paragraph>
            </Col>
            <Col xs={24} md={12}>
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Cleaning team"
                style={{ width: '100%', borderRadius: 12 }}
              />
            </Col>
          </Row>
        </section>

        {/* Values Section */}
        <section style={{ background: '#f9f9f9', padding: '80px 50px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 50 }}>
              Our Core Values
            </Title>
            <Row gutter={[32, 32]}>
              {values.map((value, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <div style={{ color: '#667eea', marginBottom: 20 }}>
                      {value.icon}
                    </div>
                    <Title level={4}>{value.title}</Title>
                    <Text type="secondary">{value.description}</Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* Team Section */}
        <section style={{ padding: '80px 50px', maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 20 }}>
            Meet Our Team
          </Title>
          <Paragraph style={{ textAlign: 'center', fontSize: 18, color: '#666', marginBottom: 50 }}>
            The passionate people behind Somaet
          </Paragraph>
          <Row gutter={[32, 32]}>
            {team.map((member, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card style={{ textAlign: 'center' }}>
                  <Avatar src={member.image} size={100} style={{ marginBottom: 20 }} />
                  <Title level={4}>{member.name}</Title>
                  <Text type="secondary">{member.role}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        {/* Same footer as ServicesPage */}
        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} md={6}>
            <Title level={4}>Somaet</Title>
            <Text type="secondary">Professional cleaning services at your fingertips</Text>
          </Col>
          <Col xs={24} md={6}>
            <Title level={4}>Quick Links</Title>
            <div><Link to="/about">About Us</Link></div>
            <div><Link to="/services">Services</Link></div>
            <div><Link to="/contact">Contact</Link></div>
          </Col>
          <Col xs={24} md={6}>
            <Title level={4}>Legal</Title>
            <div><Link to="/terms">Terms of Service</Link></div>
            <div><Link to="/privacy">Privacy Policy</Link></div>
          </Col>
        </Row>
        <div style={{ marginTop: 40 }}>
          <Text type="secondary">© 2026 Somaet. All rights reserved.</Text>
        </div>
      </Footer>
    </Layout>
  );
};

export default AboutPage;