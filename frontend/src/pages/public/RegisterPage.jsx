import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Registration values:', values);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock registration - redirect to login
      navigate('/login');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setLoading(true);
    // Implement Google sign-up logic here
    console.log('Google sign up');
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
      {/* Left Side - Registration Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#ffffff',
        padding: '20px',
        overflow: 'auto'
      }}>
        <Card style={{ 
          width: 480, 
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
              background: 'linear-gradient(135deg, #32C753 0%, #28A745 100%)',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>S</span>
            </div>
            <Title level={2} style={{ marginBottom: 8, fontWeight: 600 }}>Create Account</Title>
            <Text type="secondary" style={{ fontSize: 15 }}>Join Somaet today</Text>
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
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder="Full Name" 
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder="Email" 
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder="Password" 
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder="Confirm Password" 
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large"
                loading={loading}
                style={{ 
                  borderRadius: 8,
                  height: 48,
                  background: 'linear-gradient(135deg, #32C753 0%, #28A745 100%)',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 16
                }}
              >
                Sign Up
              </Button>
            </Form.Item>

            <Divider style={{ margin: '16px 0' }}>
              <Text type="secondary" style={{ fontSize: 14 }}>OR</Text>
            </Divider>

            <Button 
              icon={<GoogleOutlined />} 
              size="large" 
              block
              onClick={handleGoogleSignUp}
              disabled={loading}
              style={{ 
                borderRadius: 8,
                height: 48,
                marginBottom: 24,
                borderColor: '#d9d9d9'
              }}
            >
              Sign up with Google
            </Button>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Already have an account? </Text>
              <Link to="/login" style={{ color: '#32C753', fontWeight: 500 }}>
                Log in
              </Link>
            </div>

            {/* Terms and Conditions */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: 16,
              fontSize: 12,
              color: '#999'
            }}>
              By signing up, you agree to our{' '}
              <Link to="/terms" style={{ color: '#32C753' }}>Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy" style={{ color: '#32C753' }}>Privacy Policy</Link>
            </div>
          </Form>
        </Card>
      </div>

      {/* Right Side - Image/Content */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #32C753 0%, #28A745 100%)',
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
            opacity: 0.9,
            animation: 'float 3s ease-in-out infinite'
          }}>
            ✨
          </div>
          
          <Title level={1} style={{ color: 'white', marginBottom: 20, fontWeight: 700 }}>
            Start Your Journey
          </Title>
          
          <Text style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: 18,
            display: 'block',
            marginBottom: 30,
            lineHeight: 1.6
          }}>
            Join thousands of satisfied customers who trust Somaet 
            for their cleaning needs. Experience the difference today!
          </Text>
          
          {/* Benefits */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
            marginTop: 30
          }}>
            {[
              { icon: '✓', text: 'Free estimate' },
              { icon: '✓', text: 'Insured & bonded' },
              { icon: '✓', text: 'Eco-friendly products' },
              { icon: '✓', text: '100% satisfaction' }
            ].map((benefit, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 16,
                color: 'rgba(255,255,255,0.95)',
                background: 'rgba(255,255,255,0.1)',
                padding: '12px 16px',
                borderRadius: 8,
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ fontSize: 20 }}>{benefit.icon}</span>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{
            marginTop: 40,
            padding: '20px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            backdropFilter: 'blur(10px)'
          }}>
            <Text style={{ color: 'white', fontStyle: 'italic', fontSize: 16 }}>
              "Somaet made booking cleaners so easy! The service was professional 
              and my home has never looked better."
            </Text>
            <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.8)' }}>
              — Sarah Johnson, Verified Customer
            </div>
          </div>

          {/* Add CSS animation */}
          <style>
            {`
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
                100% { transform: translateY(0px); }
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
