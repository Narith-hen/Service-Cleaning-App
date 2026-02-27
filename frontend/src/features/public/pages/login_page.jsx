import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Divider } from 'antd';
import { LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
<<<<<<< HEAD
import '../../../styles/public/login.scss';
=======
>>>>>>> master

const { Title, Text } = Typography;

const LoginPage = () => {
<<<<<<< HEAD
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
=======
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
                // Redirect based on role
                console.log(result); 
                switch(result.user.role) {
                    
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
                padding: '20px',
                overflowY: 'auto'
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
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '50%',
                            margin: '0 auto 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }} onClick={() => navigate('/')}>
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
                            label="Email"
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="Enter your email"
                                disabled={loading}
                                style={{ borderRadius: 8 }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="Enter your password"
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

                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <Text type="secondary">Don't have an account? </Text>
                            <Link to="/auth/register" style={{ color: '#667eea', fontWeight: 500 }}>
                                Sign up
                            </Link>
                        </div>

                        <Button
                            type="text"
                            size="large"
                            block
                            onClick={() => navigate('/')}
                            style={{
                                borderRadius: 8,
                                height: 48,
                                border: '1px solid #d9d9d9',
                                fontWeight: 500,
                                fontSize: 16
                            }}
                        >
                            ← Back to Home
                        </Button>
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
                        opacity: 0.9,
                        cursor: 'pointer'
                    }} onClick={() => navigate('/')}>
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
>>>>>>> master
