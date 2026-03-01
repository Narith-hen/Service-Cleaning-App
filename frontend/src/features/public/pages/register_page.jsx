import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Divider, Form, Grid, Input, Steps, Typography } from "antd";
import { GoogleOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../../hooks/useAuth";
import imgRegister from "../../../assets/imgRegister.png";
import logoSomaet from "../../../assets/Logo_somaet.png";
import "./register_page.css";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const normalizeRole = (roleValue) => {
  if (!roleValue) return "customer";
  if (typeof roleValue === "string") return roleValue.toLowerCase();
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
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const firstStepFields = ["firstName", "lastName", "email", "phone"];

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleNext = async () => {
    try {
      await form.validateFields(firstStepFields);
      setCurrentStep(1);
    } catch {
      // Validation errors are displayed by Form.Item automatically.
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
        flexDirection: screens.lg ? "row" : "column",
      }}
    >
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", background: "#ffffff", padding: "20px", overflow: "auto" }}>
        <Card className="register-form-card" style={{ width: 480, padding: "32px 24px", margin: "30px 0px", boxShadow: "0 18px 50px rgba(11, 50, 25, 0.28)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.55)", background: "rgba(255, 255, 255, 0.94)", backdropFilter: "blur(6px)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img
              src={logoSomaet}
              alt="Somaet logo"
              style={{ width: 112, height: 112, objectFit: "contain", margin: "0 auto 20px", display: "block" }}
            />
            <Title level={2} style={{ marginBottom: 8, fontWeight: 600 }}>Create Account</Title>
            <Text type="secondary" style={{ fontSize: 15 }}>Join Somaet today</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} closable onClose={() => setError("")} />}

          <Steps
            current={currentStep}
            size="small"
            items={[{ title: "Details" }, { title: "Security" }]}
            style={{ marginBottom: 20 }}
          />

          <Form form={form} name="register" onFinish={onFinish} layout="vertical" size="large">
            {currentStep === 0 && (
              <>
                <Form.Item name="firstName" rules={[{ required: true, message: "Please enter your first name" }]}>
                  <Input prefix={<UserOutlined style={{ color: "#bfbfbf" }} />} placeholder="First name" disabled={loading} style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item name="lastName" rules={[{ required: true, message: "Please enter your last name" }]}>
                  <Input prefix={<UserOutlined style={{ color: "#bfbfbf" }} />} placeholder="Last name" disabled={loading} style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item name="email" rules={[{ required: true, message: "Please enter your email" }, { type: "email", message: "Please enter a valid email" }]}>
                  <Input prefix={<MailOutlined style={{ color: "#bfbfbf" }} />} placeholder="Email" disabled={loading} style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item name="phone" rules={[{ required: true, message: "Please enter your phone number" }, { pattern: /^[+]?[(]?[0-9\s-]{7,20}$/, message: "Please enter a valid phone number" }]}>
                  <Input prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />} placeholder="Phone number" disabled={loading} style={{ borderRadius: 8 }} />
                </Form.Item>
              </>
            )}

            {currentStep === 1 && (
              <>
                <Form.Item name="password" rules={[{ required: true, message: "Please enter your password" }, { min: 6, message: "Password must be at least 6 characters" }]}>
                  <Input.Password prefix={<LockOutlined style={{ color: "#bfbfbf" }} />} placeholder="Password" disabled={loading} style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item name="confirmPassword" dependencies={["password"]} rules={[{ required: true, message: "Please confirm your password" }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue("password") === value ? Promise.resolve() : Promise.reject(new Error("Passwords do not match")); } })]}>
                  <Input.Password prefix={<LockOutlined style={{ color: "#bfbfbf" }} />} placeholder="Confirm password" disabled={loading} style={{ borderRadius: 8 }} />
                </Form.Item>
              </>
            )}

            {currentStep === 0 ? (
              <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
                <Button type="primary" block size="large" onClick={handleNext} disabled={loading} style={{ borderRadius: 8, height: 48, background: "linear-gradient(135deg, #2dae48 0%, #32c753 100%)", border: "none", fontWeight: 500, fontSize: 16 }}>
                  Next
                </Button>
              </Form.Item>
            ) : (
              <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Button size="large" onClick={() => setCurrentStep(0)} disabled={loading} style={{ borderRadius: 8, height: 48 }}>
                    Back
                  </Button>
                  <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ borderRadius: 8, height: 48, background: "linear-gradient(135deg, #2dae48 0%, #32c753 100%)", border: "none", fontWeight: 500, fontSize: 16 }}>
                    Sign Up
                  </Button>
                </div>
              </Form.Item>
            )}

            <Divider style={{ margin: "16px 0" }}><Text type="secondary" style={{ fontSize: 14 }}>OR</Text></Divider>
            <Button icon={<GoogleOutlined />} size="large" block disabled style={{ borderRadius: 8, height: 48, marginBottom: 24, borderColor: "#d9d9d9" }}>
              Continue with Google
            </Button>

            <div style={{ textAlign: "center" }}>
              <Text type="secondary">Already have an account? </Text>
              <Link to="/auth/login" style={{ color: "#2d5aae", fontWeight: 500 }}>Log in</Link>
            </div>
          </Form>
        </Card>
      </div>

      <div
        style={{
          flex: screens.lg ? 1 : "none",
          minHeight: screens.lg ? "100%" : 360,
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.42)), url(${imgRegister})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: screens.md ? "40px" : "24px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div className="register-hero-content" style={{ maxWidth: 500, textAlign: "center", color: "white", position: "relative", zIndex: 1 }}>
          <Title level={1} style={{ color: "white", marginBottom: 20, fontWeight: 700 }}>Start Your Journey</Title>
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, display: "block", marginBottom: 30, lineHeight: 1.6 }}>
            Join thousands of satisfied customers who trust Somaet for their cleaning needs.
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: screens.md ? "repeat(2, 1fr)" : "1fr", gap: 20, marginTop: 30 }}>
            {["Free estimate", "Insured and bonded", "Eco-friendly products", "100% satisfaction"].map((benefit, index) => (
              <div className="register-benefit-pill" key={benefit} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, color: "rgba(255,255,255,0.95)", background: "rgba(255,255,255,0.18)", padding: "12px 16px", borderRadius: 8, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", animationDelay: `${0.35 + index * 0.12}s` }}>
                <span aria-hidden="true" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>*</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
