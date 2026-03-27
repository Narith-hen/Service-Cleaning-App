import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Grid, Input, Steps, Typography } from "antd";
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import imgRegister from "../../../assets/imgRegister.png";
import logoSomaet from "../../../assets/Logo_somaet.png";
import "./register_page.css";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const CUSTOMER_ROLE_ID = 2;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const firstStepFields = ["firstName", "lastName", "email", "phone"];
  const isCompactAuth = !screens.md;
  const controlHeight = isCompactAuth ? 38 : 40;
  const buttonFontSize = isCompactAuth ? 14 : 15;
  const helperFontSize = isCompactAuth ? 12 : 13;
  const heroTitleSize = screens.lg ? "clamp(32px, 3.2vw, 44px)" : screens.md ? "30px" : "26px";
  const cardWidth = screens.xl ? "452px" : screens.lg ? "420px" : screens.md ? "392px" : "min(92vw, 372px)";

  const onFinish = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const allValues = form.getFieldsValue(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: allValues.firstName,
          last_name: allValues.lastName,
          email: allValues.email,
          password: allValues.password,
          phone_number: allValues.phone,
          role_id: CUSTOMER_ROLE_ID,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Registration failed. Please try again.");
      }

      setSuccess("Registration successful. Redirecting to login...");
      setTimeout(() => {
        navigate("/auth/login", { replace: true });
      }, 1200);
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
        width: "100%",
        minHeight: "100dvh",
        margin: 0,
        padding: screens.lg ? "0" : "10px 0",
        overflowX: "hidden",
        overflowY: screens.lg ? "hidden" : "auto",
        flexDirection: screens.lg ? "row" : "column",
        backgroundImage: `linear-gradient(rgba(18, 11, 28, 0.58), rgba(6, 17, 33, 0.68)), url(${imgRegister})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          flex: screens.lg ? "0 0 44%" : 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "transparent",
          padding: screens.lg ? "8px 12px" : "10px",
          overflow: screens.lg ? "hidden" : "auto",
          borderRight: "none",
        }}
      >
        <Card
          className="register-form-card"
          style={{
            width: `min(92vw, ${cardWidth})`,
            padding: isCompactAuth ? "10px" : "14px clamp(10px, 2.2vw, 14px)",
            margin: screens.lg ? "6px 0" : "10px 0",
            boxShadow: isCompactAuth ? "0 18px 42px rgba(8, 12, 28, 0.42)" : "0 24px 70px rgba(8, 12, 28, 0.48)",
            borderRadius: isCompactAuth ? 14 : 16,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "linear-gradient(145deg, rgba(35, 40, 58, 0.62), rgba(26, 31, 48, 0.50))",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <img
              src={logoSomaet}
              alt="Somaet logo"
              style={{
                width: isCompactAuth ? "56px" : "clamp(54px, 10vw, 68px)",
                height: isCompactAuth ? "56px" : "clamp(54px, 10vw, 68px)",
                objectFit: "contain",
                margin: "0 auto 8px",
                display: "block",
              }}
            />
            <Title level={2} style={{ marginBottom: 2, fontWeight: 600, fontSize: isCompactAuth ? "22px" : "clamp(20px, 3vw, 30px)", color: "#f8fafc" }}>Create Account</Title>
            <Text style={{ fontSize: helperFontSize, color: "#dbe4f0" }}>Join Somaet today</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16, fontSize: helperFontSize }} closable onClose={() => setError("")} />}
          {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16, fontSize: helperFontSize }} />}

          <Steps
            className="register-glass-steps"
            current={currentStep}
            size="small"
            items={[{ title: "Details" }, { title: "Security" }]}
            style={{ marginBottom: 10 }}
          />

          <Form className="register-glass-form" form={form} name="register" onFinish={onFinish} layout="vertical" size="middle">
            {currentStep === 0 && (
              <>
                <div style={{ display: "flex", gap: 12, flexDirection: screens.sm ? "row" : "column" }}>
                  <Form.Item
                    style={{ flex: 1, marginBottom: screens.sm ? 24 : 0 }}
                    label={<span style={{ color: "#e2e8f0" }}>First name</span>}
                    name="firstName"
                    rules={[{ required: true, message: "Please enter your first name" }]}
                  >
                    <Input prefix={<UserOutlined style={{ color: "#cbd5e1", height: 22 }} />} placeholder="First name" disabled={loading} style={{ borderRadius: 24, height: controlHeight, fontSize: buttonFontSize, background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.30)", color: "#f8fafc" }} />
                  </Form.Item>
                  <Form.Item
                    style={{ flex: 1 }}
                    label={<span style={{ color: "#e2e8f0" }}>Last name</span>}
                    name="lastName"
                    rules={[{ required: true, message: "Please enter your last name" }]}
                  >
                    <Input prefix={<UserOutlined style={{ color: "#cbd5e1", height: 22 }} />} placeholder="Last name" disabled={loading} style={{ borderRadius: 24, height: controlHeight, fontSize: buttonFontSize, background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.30)", color: "#f8fafc" }} />
                  </Form.Item>
                </div>
                <Form.Item label={<span style={{ color: "#e2e8f0" }}>Email</span>} name="email" rules={[{ required: true, message: "Please enter your email" }, { type: "email", message: "Please enter a valid email" }]}>
                  <Input prefix={<MailOutlined style={{ color: "#cbd5e1", height: 22 }} />} placeholder="Email" disabled={loading} style={{ borderRadius: 24, height: controlHeight, fontSize: buttonFontSize, background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.30)", color: "#f8fafc" }} />
                </Form.Item>
                {/* <Form.Item label={<span style={{ color: "#e2e8f0" }}>Phone number</span>} name="phone" rules={[{ required: true, message: "Please enter your phone number" }, { pattern: /^[+]?[(]?[0-9\s-]{7,20}$/, message: "Please enter a valid phone number" }]}>
                  <Input prefix={<PhoneOutlined style={{ color: "#cbd5e1", height: 22 }} />} placeholder="Phone number" disabled={loading} style={{ borderRadius: 24, height: controlHeight, fontSize: buttonFontSize, background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.30)", color: "#f8fafc" }} />
                </Form.Item> */}
              </>
            )}

            {currentStep === 1 && (
              <>
                <Form.Item label={<span style={{ color: "#e2e8f0" }}>Password</span>} name="password" rules={[{ required: true, message: "Please enter your password" }, { min: 6, message: "Password must be at least 6 characters" }]}>
                  <Input.Password prefix={<LockOutlined style={{ color: "#cbd5e1", height: 22 }} />} placeholder="Password" disabled={loading} style={{ borderRadius: 24, height: controlHeight, fontSize: buttonFontSize, background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.30)", color: "#f8fafc" }} />
                </Form.Item>
                <Form.Item label={<span style={{ color: "#e2e8f0" }}>Confirm password</span>} name="confirmPassword" dependencies={["password"]} rules={[{ required: true, message: "Please confirm your password" }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue("password") === value ? Promise.resolve() : Promise.reject(new Error("Passwords do not match")); } })]}>
                  <Input.Password prefix={<LockOutlined style={{ color: "#cbd5e1", height: 22 }} />} placeholder="Confirm password" disabled={loading} style={{ borderRadius: 24, height: controlHeight, fontSize: buttonFontSize, background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.30)", color: "#f8fafc" }} />
                </Form.Item>
              </>
            )}

            {currentStep === 0 ? (
              <Form.Item style={{ marginTop: 8, marginBottom: 6 }}>
                <Button type="primary" block size="large" onClick={handleNext} disabled={loading} style={{ borderRadius: 24, height: controlHeight, background: "linear-gradient(135deg, #2dae48 0%, #32c753 100%)", border: "none", fontWeight: 500, fontSize: buttonFontSize }}>
                  Next
                </Button>
              </Form.Item>
            ) : (
              <Form.Item style={{ marginTop: 8, marginBottom: 6 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Button size="large" onClick={() => setCurrentStep(0)} disabled={loading} style={{ borderRadius: 24, height: controlHeight, fontSize: buttonFontSize, border: "1px solid rgba(226, 232, 240, 0.8)", color: "#f8fafc", background: "transparent" }}>
                    Back
                  </Button>
                  <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ borderRadius: 24, height: controlHeight, background: "linear-gradient(135deg, #2dae48 0%, #32c753 100%)", border: "none", fontWeight: 500, fontSize: buttonFontSize }}>
                    Sign Up
                  </Button>
                </div>
              </Form.Item>
            )}

            <div style={{ textAlign: "center" }}>
              <Text style={{ color: "#dbe4f0", fontSize: helperFontSize }}>Already have an account? </Text>
              <Link to="/auth/login" style={{ color: "#46BA5A", fontWeight: 500, fontSize: helperFontSize }}>Log in</Link>
            </div>

            <Button
              type="text"
              size="large"
              block
              onClick={() => navigate("/")}
              style={{
                borderRadius: 24,
                height: controlHeight,
                border: "1px solid rgba(226, 232, 240, 0.8)",
                fontWeight: 500,
                fontSize: buttonFontSize,
                color: "#f8fafc",
                marginTop: 10,
              }}
            >
              {"Back to Home"}
            </Button>
          </Form>
        </Card>
      </div>

      <div
        style={{
          flex: screens.lg ? "1 1 56%" : "none",
          minHeight: screens.lg ? "100%" : 360,
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: screens.lg ? "28px" : screens.md ? "22px 18px" : "16px 14px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div className="register-hero-content" style={{ maxWidth: 450, textAlign: "center", color: "white", position: "relative", zIndex: 1 }}>
          <Title level={2} style={{ color: "white", marginBottom: 14, fontWeight: 700, fontSize: heroTitleSize }}>Start Your Journey</Title>
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: screens.md ? 15 : 13, display: "block", marginBottom: 20, lineHeight: 1.45 }}>
            Join thousands of satisfied customers who trust Somaet for their cleaning needs.
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: screens.md ? "repeat(2, 1fr)" : "1fr", gap: 12, marginTop: 16 }}>
            {["Free estimate", "Insured and bonded", "Eco-friendly products", "100% satisfaction"].map((benefit, index) => (
              <div className="register-benefit-pill" key={benefit} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: isCompactAuth ? 12 : 14, color: "rgba(255,255,255,0.95)", background: "rgba(255,255,255,0.18)", padding: isCompactAuth ? "9px 11px" : "10px 12px", borderRadius: 24, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", animationDelay: `${0.35 + index * 0.12}s` }}>
                <span aria-hidden="true" style={{ fontSize: isCompactAuth ? 16 : 18, fontWeight: 700, lineHeight: 1 }}>*</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>
        {`
          .register-glass-form .ant-input,
          .register-glass-form .ant-input-password input {
            color: #f8fafc !important;
            font-size: ${buttonFontSize}px !important;
          }
          .register-glass-form .ant-input::placeholder,
          .register-glass-form .ant-input-password input::placeholder {
            color: rgba(226, 232, 240, 0.78) !important;
          }
          .register-glass-form .ant-input-prefix,
          .register-glass-form .ant-input-password-icon {
            color: #cbd5e1 !important;
          }
          .register-glass-form .ant-input-password-icon:hover {
            color: #f8fafc !important;
          }
          .register-glass-form .ant-form-item .ant-form-item-label > label.ant-form-item-required::before {
            color: #46ba5a !important;
          }
          .register-glass-form .ant-form-item {
            margin-bottom: ${isCompactAuth ? 10 : 12}px !important;
          }
          .register-glass-form .ant-form-item-label {
            padding-bottom: 4px !important;
          }
          .register-glass-steps .ant-steps-item-title {
            color: #dbe4f0 !important;
            font-size: ${helperFontSize}px !important;
          }
          .register-glass-steps .ant-steps-item-tail::after {
            background-color: #ffffff !important;
          }
          .register-glass-steps .ant-steps-item-title::after {
            background-color: #ffffff !important;
          }
          .register-glass-steps .ant-steps-item-process .ant-steps-item-icon {
            background-color: #46ba5a !important;
            border-color: #46ba5a !important;
          }
          .register-glass-steps .ant-steps-item-finish .ant-steps-item-icon {
            border-color: #46ba5a !important;
          }
          .register-glass-steps .ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon {
            color: #46ba5a !important;
          }
          .register-glass-form .ant-form-item-label > label,
          .register-glass-form .ant-btn {
            font-size: ${buttonFontSize}px !important;
          }
        `}
      </style>
    </div>
  );
}
