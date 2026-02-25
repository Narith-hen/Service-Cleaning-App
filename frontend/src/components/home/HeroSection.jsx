import { Row, Col, Input, Button, Card, Statistic } from 'antd';
import { 
  SearchOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const [service, setService] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate(`/search?service=${service}&location=${location}`);
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '80px 24px',
      borderRadius: '0 0 50% 50% / 20px',
      marginBottom: 48
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} md={12}>
            <h1 style={{ 
              fontSize: 'clamp(32px, 5vw, 48px)', 
              color: 'white',
              marginBottom: 16,
              fontWeight: 'bold'
            }}>
              Professional Cleaning <br />
              <span style={{ color: '#ffd700' }}>At Your Doorstep</span>
            </h1>
            
            <p style={{ 
              fontSize: 18, 
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 32
            }}>
              Book trusted, vetted, and insured cleaners in minutes. 
              Satisfaction guaranteed or we'll clean again for free.
            </p>

            <Card style={{ borderRadius: 12, padding: 8 }}>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Input
                    placeholder="What service?"
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    style={{ height: 48, borderRadius: 8 }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Input
                    placeholder="Your location"
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ height: 48, borderRadius: 8 }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    style={{ width: '100%', height: 48 }}
                  >
                    Find Cleaners
                  </Button>
                </Col>
              </Row>
            </Card>

            <Row gutter={32} style={{ marginTop: 48 }}>
              <Col span={8}>
                <Statistic 
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Happy Customers</span>}
                  value="10K+"
                  valueStyle={{ color: 'white', fontSize: 24 }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Cleaners</span>}
                  value="500+"
                  valueStyle={{ color: 'white', fontSize: 24 }}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Avg Response</span>}
                  value="15 min"
                  valueStyle={{ color: 'white', fontSize: 24 }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>
          </Col>
          
          <Col xs={24} md={12}>
            <img 
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              alt="Cleaning Service"
              style={{ 
                width: '100%', 
                borderRadius: 24,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HeroSection;