import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Divider } from 'antd';
import { LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Login:', values);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock login - redirect based on role
      if (values.email === 'demo@example.com' && values.password === 'password') {
        navigate('/customer');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    // Implement Google login logic here
    console.log('Google login');
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ 
      display: 'flex',
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* Left Side - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#ffffff',
        padding: '20px'
      }}>
        <Card style={{ 
          width: 420, 
          padding: '32px 24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          borderRadius: 12,
          border: 'none'
        }}>
          {/* Logo/Icon */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>S</span>
            </div>
            <Title level={2} style={{ marginBottom: 8, fontWeight: 600 }}>Welcome Back</Title>
            <Text type="secondary" style={{ fontSize: 15 }}>Login to your Somaet account</Text>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
              closable
              onClose={() => setError('')}
            />
          )}

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            initialValues={{ remember: true }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder="Email address" 
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder="Password" 
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 24 
            }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox disabled={loading}>Remember me</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" style={{ color: '#667eea' }}>
                Forgot password?
              </Link>
            </div>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block
                loading={loading}
                style={{ 
                  borderRadius: 8,
                  height: 48,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 16
                }}
              >
                Log In
              </Button>
            </Form.Item>

            <Divider style={{ margin: '16px 0' }}>
              <Text type="secondary" style={{ fontSize: 14 }}>OR</Text>
            </Divider>

            <Button 
              icon={<GoogleOutlined />} 
              size="large" 
              block
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ 
                borderRadius: 8,
                height: 48,
                marginBottom: 24,
                borderColor: '#d9d9d9'
              }}
            >
              Continue with Google
            </Button>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Don't have an account? </Text>
              <Link to="/register" style={{ color: '#667eea', fontWeight: 500 }}>
                Sign up
              </Link>
            </div>
          </Form>
        </Card>
      </div>

      {/* Right Side - Image/Content */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        
        {/* Main content */}
        <div style={{
          maxWidth: 500,
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Icon/Illustration */}
          <div style={{
            fontSize: 120,
            marginBottom: 30,
            opacity: 0.9
          }}>
            🧹
          </div>
          
          <Title level={1} style={{ color: 'white', marginBottom: 20, fontWeight: 700 }}>
            Somaet Cleaning
          </Title>
          
          <Text style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: 18,
            display: 'block',
            marginBottom: 30,
            lineHeight: 1.6
          }}>
            Professional cleaning services at your fingertips. 
            Book trusted cleaners for your home or office with just a few clicks.
          </Text>
          
          {/* Features list */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 15,
            alignItems: 'flex-start',
            marginTop: 30
          }}>
            {[
              '✓ Professional & vetted cleaners',
              '✓ Flexible scheduling',
              '✓ Secure payments',
              '✓ Satisfaction guaranteed'
            ].map((feature, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 16,
                color: 'rgba(255,255,255,0.95)'
              }}>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: 50,
            width: '100%'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>10K+</div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>Happy Customers</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>5K+</div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>Cleanings Done</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>4.9</div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;