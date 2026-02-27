import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Divider, Form, Input, Typography } from "antd";
import { GoogleOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
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

const buildUsername = (firstName, lastName) => {
  const normalized = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, "");
  const suffix = Date.now().toString().slice(-5);
  return `${normalized}_${suffix}`;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: buildUsername(values.firstName, values.lastName),
          email: values.email,
          password: values.password,
          phone_number: values.phone,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || "Registration failed. Please try again.");
      }

      const userData = result.data;
      const role = normalizeRole(userData.role?.role_name || userData.role || userData.role_name);

      login(userData, role);
      navigate(getRedirectPath(role), { replace: true });
    } catch (err) {
      setError(err.message || "Unable to register right now.");
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
          overflow: "auto",
        }}
      >
        <Card
          style={{
            width: 480,
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
              Create Account
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Join Somaet today
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

          <Form name="register" onFinish={onFinish} layout="vertical" size="large">
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
                placeholder="Email"
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: "Please enter your phone number" },
                { pattern: /^[+]?[(]?[0-9\s-]{7,20}$/, message: "Please enter a valid phone number" },
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Phone number"
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Password"
                disabled={loading}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Confirm password"
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
                  background: "linear-gradient(135deg, #2dae48 0%, #32c753 100%)",
                  border: "none",
                  fontWeight: 500,
                  fontSize: 16,
                }}
              >
                Sign Up
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
              disabled
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
              <Text type="secondary">Already have an account? </Text>
              <Link to="/login" style={{ color: "#2dae48", fontWeight: 500 }}>
                Log in
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
          <Title level={1} style={{ color: "white", marginBottom: 20, fontWeight: 700 }}>
            ✨Start Your Journey
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
            Join thousands of satisfied customers who trust Somaet for their cleaning
            needs.
          </Text>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
              marginTop: 30,
            }}
          >
            {[
              "Free estimate",
              "Insured and bonded",
              "Eco-friendly products",
              "100% satisfaction",
            ].map((benefit) => (
              <div
                key={benefit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 16,
                  color: "rgba(255,255,255,0.95)",
                  background: "rgba(255,255,255,0.1)",
                  padding: "12px 16px",
                  borderRadius: 8,
                  backdropFilter: "blur(10px)",
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>*</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

