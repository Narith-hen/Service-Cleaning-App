import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Checkbox, Divider, Form, Input, Typography } from "antd";
import { GoogleOutlined, LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";

const { Title, Text } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const normalizeRole = (roleValue) => {
  if (!roleValue) return "customer";

  if (typeof roleValue === "string") {
    return roleValue.toLowerCase();
  }

  if (typeof roleValue === "object" && roleValue.role_name) {
    return String(roleValue.role_name).toLowerCase();
  }

  return "customer";
};

const getRedirectPath = (role) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "cleaner":
      return "/cleaner";
    case "customer":
    default:
      return "/customer";
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || "Invalid email or password");
      }

      const userData = result.data;
      const role = normalizeRole(userData.role?.role_name || userData.role || userData.role_name);

      login(userData, role);
      navigate(getRedirectPath(role), { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#ffffff",
          padding: "20px",
        }}
      >
        <Card
          style={{
            width: 420,
            padding: "32px 24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            borderRadius: 12,
            border: "none",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: "linear-gradient(135deg, #2dae48 0%, #32c753 100%)",
                borderRadius: "50%",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: 32, fontWeight: "bold" }}>S</span>
            </div>
            <Title level={2} style={{ marginBottom: 8, fontWeight: 600 }}>
              Welcome Back
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Login to your Somaet account
            </Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
              closable
              onClose={() => setError("")}
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
              name="firstName"
              rules={[{ required: true, message: "Please enter your first name" }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="First name"
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="lastName"
              rules={[{ required: true, message: "Please enter your last name" }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Last name"
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Email address"
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Password"
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox disabled={loading}>Remember me</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" style={{ color: "#2dae48" }}>
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
                  background: "linear-gradient(135deg, #2dae48 0%, #32c753 100%)",
                  border: "none",
                  fontWeight: 500,
                  fontSize: 16,
                }}
              >
                Log In
              </Button>
            </Form.Item>

            <Divider style={{ margin: "16px 0" }}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                OR
              </Text>
            </Divider>

            <Button
              icon={<GoogleOutlined />}
              size="large"
              block
              disabled={loading}
              style={{
                borderRadius: 8,
                height: 48,
                marginBottom: 24,
                borderColor: "#d9d9d9",
              }}
            >
              Continue with Google
            </Button>

            <div style={{ textAlign: "center" }}>
              <Text type="secondary">Don&apos;t have an account? </Text>
              <Link to="/register" style={{ color: "#2dae48", fontWeight: 500 }}>
                Sign up
              </Link>
            </div>
          </Form>
        </Card>
      </div>

      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #2dae48 0%, #32c753 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 500,
            textAlign: "center",
            color: "white",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 96,
              marginBottom: 20,
              opacity: 0.92,
              fontWeight: 700,
            }}
          >
          ✨Somaet
          </div>

          <Title level={1} style={{ color: "white", marginBottom: 20, fontWeight: 700 }}>
            Somaet Cleaning
          </Title>

          <Text
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 18,
              display: "block",
              marginBottom: 30,
              lineHeight: 1.6,
            }}
          >
            Professional cleaning services at your fingertips. Book trusted cleaners
            for your home or office with just a few clicks.
          </Text>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "flex-start",
              marginTop: 30,
            }}
          >
            {["Professional and vetted cleaners", "Flexible scheduling", "Secure payments", "Satisfaction guaranteed"].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 16,
                    color: "rgba(255,255,255,0.95)",
                  }}
                >
                  <span>* {feature}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

