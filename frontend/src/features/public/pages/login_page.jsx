import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Divider } from 'antd';
import { LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import logoSomaet from '../../../assets/Logo_somaet.png';
import imgRegister from '../../../assets/imgRegister.png';

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
                        navigate('/customer/dashboard');
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
        } catch {
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
            width: '100%',
            minHeight: '100dvh',
            margin: 0,
            padding: '8px 0',
            overflowX: 'hidden',
            overflowY: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundImage: `linear-gradient(rgba(18, 11, 28, 0.58), rgba(6, 17, 33, 0.68)), url(${imgRegister})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}>
            {/* Left Side - Login Form */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px',
                overflowY: 'hidden',
                position: 'relative',
                zIndex: 1
            }}>
                <Card style={{
                    width: 'min(92vw, 400px)',
                    padding: '14px clamp(10px, 2vw, 14px)',
                    boxShadow: '0 24px 70px rgba(8, 12, 28, 0.48)',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.22)',
                    background: 'linear-gradient(145deg, rgba(35, 40, 58, 0.62), rgba(26, 31, 48, 0.50))',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)'
                }}>
                    {/* Logo/Icon */}
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <img
                            src={logoSomaet}
                            alt="Somaet logo"
                            onClick={() => navigate('/')}
                            style={{
                                width: 'clamp(52px, 10vw, 66px)',
                                height: 'clamp(52px, 10vw, 66px)',
                                objectFit: 'contain',
                                margin: '0 auto 8px',
                                display: 'block',
                                cursor: 'pointer'
                            }}
                        />
                        <Title level={2} style={{ marginBottom: 2, fontWeight: 600, fontSize: 'clamp(20px, 3vw, 30px)', color: '#f8fafc' }}>Welcome Back</Title>
                        <Text style={{ fontSize: 13, color: '#dbe4f0' }}>Login to your Somaet account</Text>
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
                        className="login-glass-form"
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                        size="middle"
                        initialValues={{ remember: true }}
                    >
                        <Form.Item
                            name="email"
                            label={<span style={{ color: '#e2e8f0' }}>Email</span>}
                            rules={[
                                { required: true, message: 'Please enter your email' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: '#cbd5e1', height: 22}} />}
                                placeholder="Enter your email"
                                disabled={loading}
                                style={{ borderRadius: 8, height: 40, background: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.30)', color: '#f8fafc' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span style={{ color: '#e2e8f0' }}>Password</span>}
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#cbd5e1', height: 22}} />}
                                placeholder="Enter your password"
                                disabled={loading}
                                style={{ borderRadius: 8, height: 40, background: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.30)', color: '#f8fafc' }}
                            />
                        </Form.Item>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12,
                            gap: 8
                        }}>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox disabled={loading} style={{ color: '#e2e8f0' }}>Remember me</Checkbox>
                            </Form.Item>
                            <Link to="/forgot-password" style={{ color: '#46BA5A' }}>
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
                                    height: 40,
                                    background: 'linear-gradient(135deg, #49C15D 0%, #3c9c4c 100%)',
                                    border: 'none',
                                    fontWeight: 500,
                                    fontSize: 15
                                }}
                            >
                                Log In
                            </Button>
                        </Form.Item>

                        <Divider style={{ margin: '10px 0', borderColor: 'rgba(255,255,255,0.22)' }}>
                            <Text style={{ fontSize: 14, color: '#cbd5e1' }}>OR</Text>
                        </Divider>

                        <Button
                            className="google-login-btn"
                            icon={<GoogleOutlined />}
                            size="large"
                            block
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            style={{
                                borderRadius: 8,
                                height: 40,
                                marginBottom: 10,
                                borderColor: '#d9d9d9'
                            }}
                        >
                            Continue with Google
                        </Button>

                        <div style={{ textAlign: 'center', marginBottom: 10 }}>
                            <Text style={{ color: '#dbe4f0' }}>Don't have an account? </Text>
                            <Link to="/auth/register" style={{ color: '#32c753', fontWeight: 500 }}>
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
                                height: 40,
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                fontWeight: 500,
                                fontSize: 15,
                                color: '#f8fafc'
                                
                            }}
                        >
                            {'< Back to Home'}
                        </Button>
                    </Form>
                </Card>
            </div>
            <style>
                {`
                    .login-glass-form .ant-input,
                    .login-glass-form .ant-input-password input {
                        color: #f8fafc !important;
                    }
                    .login-glass-form .ant-input::placeholder,
                    .login-glass-form .ant-input-password input::placeholder {
                        color: rgba(226, 232, 240, 0.78) !important;
                    }
                    .login-glass-form .ant-input-prefix,
                    .login-glass-form .ant-input-password-icon {
                        color: #cbd5e1 !important;
                    }
                    .login-glass-form .ant-input-password-icon:hover {
                        color: #f8fafc !important;
                    }
                    .google-login-btn:hover,
                    .google-login-btn:focus,
                    .google-login-btn:active {
                        color: #008000 !important;
                    }
                    .google-login-btn:hover .anticon,
                    .google-login-btn:focus .anticon,
                    .google-login-btn:active .anticon {
                        color: #008000 !important;
                    }
                    .login-glass-form .ant-checkbox-checked .ant-checkbox-inner {
                        background-color: #46BA5A !important;
                        border-color: #46BA5A !important;
                    }
                    .login-glass-form .ant-checkbox-wrapper:hover .ant-checkbox-inner,
                    .login-glass-form .ant-checkbox:hover .ant-checkbox-inner,
                    .login-glass-form .ant-checkbox-input:focus + .ant-checkbox-inner {
                        border-color: #46BA5A !important;
                    }
                    .login-glass-form .ant-form-item .ant-form-item-label > label.ant-form-item-required::before {
                        color: #46BA5A !important;
                    }
                    .login-glass-form .ant-form-item {
                        margin-bottom: 12px !important;
                    }
                    .login-glass-form .ant-form-item-label {
                        padding-bottom: 4px !important;
                    }
                `}
            </style>
        </div>
    );
};

export default LoginPage;
