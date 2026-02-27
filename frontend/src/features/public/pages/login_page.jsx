import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Divider } from 'antd';
import { LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/public/login.scss';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');

    try {
      const result = await login(values.email, values.password);

      if (result.success) {
        switch (result.user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'customer':
            navigate('/customer/home');
            break;
          case 'cleaner':
            navigate('/cleaner/dashboard');
            break;
          default:
            navigate('/');
        }
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
    console.log('Google login');
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const heroImage =
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1400&q=80';

  return (
    <div className="auth-page login-page">
      <div className="auth-shell">
        <aside className="auth-visual-panel">
          <img src={heroImage} alt="Cleaning supplies and workspace" className="auth-visual-image" />
          <div className="auth-visual-overlay" />
          <div className="auth-visual-content">
            <span className="auth-chip">Premium Home Care</span>
            <Title level={1}>Somaet Cleaning</Title>
            <Text>
              Reliable cleaners, flexible schedules, and transparent pricing for a spotless home every time.
            </Text>
            <div className="auth-points">
              <p><i className="bi bi-check-circle-fill" /> Verified professionals</p>
              <p><i className="bi bi-check-circle-fill" /> Easy booking flow</p>
              <p><i className="bi bi-check-circle-fill" /> Safe and secure payments</p>
            </div>
          </div>
        </aside>

        <section className="auth-form-panel">
          <Card className="auth-card" bordered={false}>
            <div className="auth-header">
              <button type="button" className="auth-logo-btn" onClick={() => navigate('/')}>
                <i className="bi bi-stars" />
              </button>
              <Title level={2}>Welcome Back</Title>
              <Text>Login to your Somaet account</Text>
            </div>

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
              className="auth-form"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Enter your email" disabled={loading} />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </Form.Item>

              <div className="auth-row">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox disabled={loading}>Remember me</Checkbox>
                </Form.Item>
                <Link to="/auth/forgot-password" className="auth-link">
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
                  className="auth-btn auth-btn-primary"
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
                className="auth-btn auth-btn-secondary"
              >
                Continue with Google
              </Button>

              <div className="auth-footer">
                <Text type="secondary">Do not have an account?</Text>
                <Link to="/auth/register" className="auth-link">
                  Sign up
                </Link>
              </div>
            </Form>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
