import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import '../../../styles/public/register.scss';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');

    try {
      console.log('Registration values:', values);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigate('/auth/login');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setLoading(true);
    console.log('Google sign up');
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const heroImage =
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80';

  return (
    <div className="auth-page register-page">
      <div className="auth-shell">
        <aside className="auth-visual-panel">
          <img src={heroImage} alt="Cleaner working in a modern home" className="auth-visual-image" />
          <div className="auth-visual-overlay" />
          <div className="auth-visual-content">
            <span className="auth-chip">Join Today</span>
            <Title level={1}>Create Account</Title>
            <Text>Start booking trusted cleaners in your area with a quick and simple signup process.</Text>
            <div className="auth-points">
              <p><i className="bi bi-check-circle-fill" /> Fast onboarding</p>
              <p><i className="bi bi-check-circle-fill" /> Trusted service teams</p>
              <p><i className="bi bi-check-circle-fill" /> Satisfaction guaranteed</p>
            </div>
          </div>
        </aside>

        <section className="auth-form-panel">
          <Card className="auth-card" bordered={false}>
            <div className="auth-header">
              <button type="button" className="auth-logo-btn" onClick={() => navigate('/')}>
                <i className="bi bi-stars" />
              </button>
              <Title level={2}>Join Somaet</Title>
              <Text>Create your account in a minute</Text>
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

            <Form name="register" onFinish={onFinish} layout="vertical" size="large" className="auth-form">
              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Full Name" disabled={loading} />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" disabled={loading} />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter your password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" disabled={loading} />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    }
                  })
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" disabled={loading} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  className="auth-btn auth-btn-primary"
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
                className="auth-btn auth-btn-secondary"
              >
                Sign up with Google
              </Button>

              <div className="auth-footer">
                <Text type="secondary">Already have an account?</Text>
                <Link to="/auth/login" className="auth-link">
                  Log in
                </Link>
              </div>

              <div className="auth-terms">
                By signing up, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
              </div>
            </Form>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;

