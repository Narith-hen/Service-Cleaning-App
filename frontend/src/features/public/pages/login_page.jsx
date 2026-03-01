import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Divider } from 'antd';
import { LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import logoSomaet from '../../../assets/Logo_somaet.png';

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
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #1d8f45 0%, #32c753 48%, #6fdd8f 100%)',
        }}>
            <div style={{
                position: 'absolute',
                top: '-120px',
                left: '-120px',
                width: 360,
                height: 360,
                borderRadius: 32,
                background: 'rgba(255, 255, 255, 0.12)',
                transform: 'rotate(-32deg)'
            }} />
            <div style={{
                position: 'absolute',
                right: '-140px',
                top: '18%',
                width: 420,
                height: 420,
                borderRadius: 36,
                background: 'rgba(20, 83, 45, 0.18)',
                transform: 'rotate(-28deg)'
            }} />
            <div style={{
                position: 'absolute',
                left: '28%',
                bottom: '-200px',
                width: 520,
                height: 420,
                borderRadius: 40,
                background: 'rgba(255, 255, 255, 0.08)',
                transform: 'rotate(34deg)'
            }} />
            {/* Left Side - Login Form */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                overflowY: 'auto',
                position: 'relative',
                zIndex: 1
            }}>
                <Card style={{
                    width: 480,
                    padding: '32px 24px',
                    boxShadow: '0 18px 50px rgba(11, 50, 25, 0.28)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.55)',
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(6px)'
                }}>
                    {/* Logo/Icon */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <img
                            src={logoSomaet}
                            alt="Somaet logo"
                            onClick={() => navigate('/')}
                            style={{
                                width: 112,
                                height: 112,
                                objectFit: 'contain',
                                margin: '0 auto 20px',
                                display: 'block',
                                cursor: 'pointer'
                            }}
                        />
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
                            <Link to="/forgot-password" style={{ color: '#1f82cd' }}>
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
                                    background: 'linear-gradient(135deg, #49C15D 0%, #3c9c4c 100%)',
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
                            <Link to="/auth/register" style={{ color: '#1959c1', fontWeight: 500 }}>
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
                            {'< Back to Home'}
                        </Button>
                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
