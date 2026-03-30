import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Grid } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import logoSomaet from '../../../assets/Logo_somaet.png';
import imgRegister from '../../../assets/imgRegister.png';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const screens = useBreakpoint();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onFinish = async (values) => {
        setLoading(true);
        setError('');

        try {
            const result = await login(values.email, values.password);
            
            if (result.success) {
                 // Redirect based on role
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
                setError(result?.error || 'Invalid email or password');
             }
        } catch {
             setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isCompactAuth = !screens.md;
    const controlHeight = isCompactAuth ? 38 : 40;
    const buttonFontSize = isCompactAuth ? 14 : 15;
    const helperFontSize = isCompactAuth ? 12 : 13;
    const cardWidth = screens.xl ? '400px' : screens.lg ? '378px' : screens.md ? '360px' : 'min(92vw, 360px)';

    return (
        <div style={{
            display: 'flex',
            width: '100%',
            minHeight: '100dvh',
            margin: 0,
            padding: screens.lg ? '8px 0' : '10px 0',
            overflowX: 'hidden',
            overflowY: screens.lg ? 'hidden' : 'auto',
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
                padding: isCompactAuth ? '10px' : '8px',
                overflowY: 'auto',
                position: 'relative',
                zIndex: 1
            }}>
                <Card style={{
                    width: `min(92vw, ${cardWidth})`,
                    padding: isCompactAuth ? '10px' : '14px clamp(10px, 2vw, 14px)',
                    boxShadow: isCompactAuth ? '0 18px 42px rgba(8, 12, 28, 0.42)' : '0 24px 70px rgba(8, 12, 28, 0.48)',
                    borderRadius: isCompactAuth ? 14 : 16,
                    border: '1px solid rgba(255,255,255,0.22)',
                    background: 'linear-gradient(145deg, rgba(35, 40, 58, 0.62), rgba(26, 31, 48, 0.50))',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)'
                }}>
                    {/* Logo/Icon */}
                    <div style={{ textAlign: 'center', marginBottom: isCompactAuth ? 10 : 12 }}>
                        <img
                            src={logoSomaet}
                            alt="Somaet logo"
                            onClick={() => navigate('/')}
                            style={{
                                width: isCompactAuth ? '54px' : 'clamp(52px, 10vw, 66px)',
                                height: isCompactAuth ? '54px' : 'clamp(52px, 10vw, 66px)',
                                objectFit: 'contain',
                                margin: '0 auto 8px',
                                display: 'block',
                                cursor: 'pointer'
                            }}
                        />
                        <Title level={2} style={{ marginBottom: 2, fontWeight: 600, fontSize: isCompactAuth ? '22px' : 'clamp(20px, 3vw, 30px)', color: '#f8fafc' }}>Welcome Back</Title>
                        <Text style={{ fontSize: helperFontSize, color: '#dbe4f0' }}>Login to your Somaet account</Text>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            style={{ marginBottom: isCompactAuth ? 14 : 24, fontSize: helperFontSize }}
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
                                style={{ borderRadius: 24, height: controlHeight, fontSize: buttonFontSize, background: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.30)', color: '#f8fafc' }}
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
                                style={{ borderRadius: 24, height: controlHeight, fontSize: buttonFontSize, background: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.30)', color: '#f8fafc' }}
                            />
                        </Form.Item>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            marginBottom: isCompactAuth ? 10 : 12,
                            gap: 8
                        }}>
                        </div>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                block
                                loading={loading}
                                style={{
                                    borderRadius: 24,
                                    height: controlHeight,
                                    background: 'linear-gradient(135deg, #49C15D 0%, #3c9c4c 100%)',
                                    border: 'none',
                                    fontWeight: 500,
                                    fontSize: buttonFontSize
                                }}
                            >
                                Log In
                            </Button>
                        </Form.Item>

                        <div style={{ textAlign: 'center', marginBottom: isCompactAuth ? 8 : 10 }}>
                            <Text style={{ color: '#dbe4f0', fontSize: helperFontSize }}>Don't have an account? </Text>
                            <Link to="/auth/register" style={{ color: '#32c753', fontWeight: 500, fontSize: helperFontSize }}>
                                Sign up
                            </Link>
                        </div>

                        <Button
                            type="text"
                            size="large"
                            block
                            onClick={() => navigate('/')}
                            style={{
                                borderRadius: 24,
                                height: controlHeight,
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                fontWeight: 500,
                                fontSize: buttonFontSize,
                                color: '#f8fafc'
                                
                            }}
                        >
                            {'Back to Home'}
                        </Button>
                    </Form>
                </Card>
            </div>
            <style>
                {`
                    .login-glass-form .ant-input,
                    .login-glass-form .ant-input-password input {
                        color: #f8fafc !important;
                        font-size: ${buttonFontSize}px !important;
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
                        margin-bottom: ${isCompactAuth ? 10 : 12}px !important;
                    }
                    .login-glass-form .ant-form-item-label {
                        padding-bottom: 4px !important;
                    }
                    .login-glass-form .ant-form-item-label > label,
                    .login-glass-form .ant-btn,
                    .login-glass-form .ant-checkbox-wrapper {
                        font-size: ${buttonFontSize}px !important;
                    }
                `}
            </style>
        </div>
    );
};

export default LoginPage;
