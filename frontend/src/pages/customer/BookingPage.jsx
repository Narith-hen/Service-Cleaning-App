import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Row, Col, Card, Form, Input, DatePicker, TimePicker, 
  Select, Button, Steps, Typography, Divider, Statistic 
} from 'antd';
import { 
  HomeOutlined, 
  CalendarOutlined, 
  CreditCardOutlined, 
  CheckCircleOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const BookingPage = () => {
  const { cleanerId } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  // Mock cleaner data
  const cleaner = {
    id: cleanerId,
    name: 'Sarah Johnson',
    rating: 4.8,
    price: 45,
    image: 'https://i.pravatar.cc/150?u=1',
    jobs: 127
  };

  const steps = [
    {
      title: 'Service Details',
      icon: <HomeOutlined />,
    },
    {
      title: 'Schedule',
      icon: <CalendarOutlined />,
    },
    {
      title: 'Payment',
      icon: <CreditCardOutlined />,
    },
    {
      title: 'Confirmation',
      icon: <CheckCircleOutlined />,
    },
  ];

  const handleNext = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    console.log('Booking submitted:', form.getFieldsValue());
    setCurrentStep(3);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <div style={{ padding: '24px 0' }}>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Form.Item
                  name="serviceType"
                  label="Service Type"
                  rules={[{ required: true, message: 'Please select service type' }]}
                >
                  <Select placeholder="Select service" size="large">
                    <Option value="home">Home Cleaning</Option>
                    <Option value="deep">Deep Cleaning</Option>
                    <Option value="office">Office Cleaning</Option>
                    <Option value="carpet">Carpet Cleaning</Option>
                    <Option value="window">Window Cleaning</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="bedrooms"
                  label="Bedrooms"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Number of bedrooms" size="large">
                    {[1, 2, 3, 4, 5].map(num => (
                      <Option key={num} value={num}>{num} {num === 1 ? 'Bedroom' : 'Bedrooms'}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="bathrooms"
                  label="Bathrooms"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Number of bathrooms" size="large">
                    {[1, 2, 3, 4].map(num => (
                      <Option key={num} value={num}>{num} {num === 1 ? 'Bathroom' : 'Bathrooms'}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="address"
                  label="Service Address"
                  rules={[{ required: true, message: 'Please enter your address' }]}
                >
                  <Input 
                    placeholder="Enter your full address" 
                    size="large"
                    prefix={<EnvironmentOutlined />}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="instructions"
                  label="Special Instructions"
                >
                  <TextArea 
                    rows={4} 
                    placeholder="Any special instructions for the cleaner? (e.g., gate code, parking info, etc.)"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 1:
        return (
          <div style={{ padding: '24px 0' }}>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Form.Item
                  name="date"
                  label="Select Date"
                  rules={[{ required: true, message: 'Please select a date' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    size="large"
                    disabledDate={(current) => current && current < new Date()}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="time"
                  label="Select Time"
                  rules={[{ required: true, message: 'Please select a time' }]}
                >
                  <TimePicker 
                    style={{ width: '100%' }} 
                    size="large"
                    format="HH:mm"
                    minuteStep={30}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="duration"
                  label="Duration"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="How many hours?" size="large">
                    <Option value="2">2 hours</Option>
                    <Option value="3">3 hours</Option>
                    <Option value="4">4 hours</Option>
                    <Option value="6">6 hours</Option>
                    <Option value="8">8 hours</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={24}>
                <Card style={{ background: '#f5f5f5' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic 
                        title="Rate per hour" 
                        value={`$${cleaner.price}`} 
                        prefix={<DollarOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="Hours" 
                        value={form.getFieldValue('duration') || 2} 
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="Total" 
                        value={`$${cleaner.price * (form.getFieldValue('duration') || 2)}`}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </div>
        );

      case 2:
        return (
          <div style={{ padding: '24px 0' }}>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Form.Item
                  name="cardNumber"
                  label="Card Number"
                  rules={[{ required: true, message: 'Please enter card number' }]}
                >
                  <Input 
                    placeholder="1234 5678 9012 3456" 
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="expiry"
                  label="Expiry Date"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="MM/YY" size="large" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="cvv"
                  label="CVV"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="123" size="large" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="nameOnCard"
                  label="Name on Card"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="John Doe" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 3:
        return (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a', marginBottom: 24 }} />
            <Title level={2}>Booking Confirmed!</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Your booking has been successfully confirmed.
            </Text>
            
            <Card style={{ maxWidth: 400, margin: '32px auto', textAlign: 'left' }}>
              <p><strong>Booking ID:</strong> #BKG-2026-{Math.floor(Math.random() * 10000)}</p>
              <p><strong>Cleaner:</strong> {cleaner.name}</p>
              <p><strong>Date:</strong> {form.getFieldValue('date')?.format('YYYY-MM-DD')}</p>
              <p><strong>Time:</strong> {form.getFieldValue('time')?.format('HH:mm')}</p>
              <p><strong>Total:</strong> ${cleaner.price * (form.getFieldValue('duration') || 2)}</p>
            </Card>

            <Button type="primary" size="large" href="/customer/bookings">
              View My Bookings
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Book {cleaner.name}</Title>
          <Text type="secondary">Complete the steps below to book your cleaning</Text>
        </div>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map(step => (
            <Step key={step.title} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          initialValues={{ duration: 2 }}
        >
          {getStepContent(currentStep)}

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {currentStep > 0 && currentStep < 3 && (
              <Button onClick={handlePrev} size="large">
                Previous
              </Button>
            )}
            
            {currentStep < 2 && (
              <Button type="primary" onClick={handleNext} size="large" style={{ marginLeft: 'auto' }}>
                Next
              </Button>
            )}
            
            {currentStep === 2 && (
              <Button type="primary" onClick={handleSubmit} size="large" style={{ marginLeft: 'auto' }}>
                Confirm Booking
              </Button>
            )}

            {currentStep === 3 && (
              <Button type="primary" href="/customer" size="large" style={{ marginLeft: 'auto' }}>
                Back to Dashboard
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default BookingPage;