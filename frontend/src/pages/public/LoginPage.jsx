import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, Divider } from 'antd';
import { MailOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);

    // Mock login flow. Replace with API call when backend auth is ready.
    setTimeout(() => {
      const userData = { name: 'Alex Johnson', email: 'alex.j@cleanpro.com' };
      const userRole = 'customer';
      login(userData, userRole);
      setLoading(false);
      navigate(`/${userRole}`);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <Card
        style={{
          width: 480,
          maxWidth: '100%',
          padding: '32px 24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          borderRadius: 12,
          border: 'none'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #32C753 0%, #28A745 100%)',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>S</span>
          </div>
          <Title level={2} style={{ marginBottom: 8, fontWeight: 600 }}>
            Welcome Back
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Log in to Somaet
          </Text>
        </div>

        <Form name="login" layout="vertical" size="large" onFinish={onFinish}>
          <Form.Item
            name="email"
            rules={[
              { required: false, message: 'Please enter your email' },
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
            rules={[{ required: false, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Password"
              disabled={loading}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}
          >
            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox disabled={loading}>Remember me</Checkbox>
            </Form.Item>
            <Link to="#" style={{ color: '#32C753', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>

          <Form.Item style={{ marginTop: 8 }}>
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
                fontWeight: 600,
                fontSize: 16
              }}
            >
              Sign In
            </Button>
          </Form.Item>

          <Divider style={{ margin: '16px 0' }}>
            <Text type="secondary" style={{ fontSize: 14 }}>
              OR
            </Text>
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
            Sign in with Google
          </Button>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Don&apos;t have an account? </Text>
            <Link to="/register" style={{ color: '#32C753', fontWeight: 500 }}>
              Sign up
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
