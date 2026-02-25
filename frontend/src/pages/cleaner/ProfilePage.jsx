import React, { useState } from 'react';
import { 
  Card, Form, Input, Button, Avatar, Tabs, Row, Col, 
  Select, Switch, Upload, message, Descriptions, Tag 
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  EnvironmentOutlined,
  UploadOutlined,
  BankOutlined,
  SafetyOutlined,
  EditOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const CleanerProfilePage = () => {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  // Mock cleaner data
  const cleanerData = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 234 567 8900',
    address: '123 Main St, New York, NY 10001',
    bio: 'Professional cleaner with 5+ years of experience. Specialized in deep cleaning and eco-friendly products.',
    experience: '5+ years',
    services: ['Home Cleaning', 'Deep Cleaning', 'Office Cleaning'],
    rate: 45,
    verified: true,
    completedJobs: 127,
    rating: 4.8,
    availability: 'Full-time',
    emergency: true,
    insurance: true
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      console.log('Updated profile:', values);
      message.success('Profile updated successfully!');
      setEditing(false);
    });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1>My Profile</h1>
          {!editing ? (
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <div>
              <Button onClick={() => setEditing(false)} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <Row gutter={[24, 24]}>
          <Col span={6} style={{ textAlign: 'center' }}>
            <Avatar 
              size={120} 
              src="https://i.pravatar.cc/150?u=1"
              icon={<UserOutlined />}
            />
            
            {editing && (
              <div style={{ marginTop: 16 }}>
                <Upload>
                  <Button icon={<UploadOutlined />}>Change Photo</Button>
                </Upload>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Tag color="green">Verified Cleaner</Tag>
              <Tag color="blue">ID: CL-2026-001</Tag>
            </div>

            <Descriptions column={1} style={{ marginTop: 16 }}>
              <Descriptions.Item label="Completed Jobs">
                {cleanerData.completedJobs}
              </Descriptions.Item>
              <Descriptions.Item label="Rating">
                {cleanerData.rating} / 5
              </Descriptions.Item>
              <Descriptions.Item label="Member Since">
                Jan 2025
              </Descriptions.Item>
            </Descriptions>
          </Col>

          <Col span={18}>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Personal Info" key="1">
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={cleanerData}
                  disabled={!editing}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[{ required: true }]}
                      >
                        <Input prefix={<UserOutlined />} />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email' }]}
                      >
                        <Input prefix={<MailOutlined />} />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        name="phone"
                        label="Phone Number"
                        rules={[{ required: true }]}
                      >
                        <Input prefix={<PhoneOutlined />} />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        name="address"
                        label="Address"
                        rules={[{ required: true }]}
                      >
                        <Input prefix={<EnvironmentOutlined />} />
                      </Form.Item>
                    </Col>

                    <Col span={24}>
                      <Form.Item
                        name="bio"
                        label="Bio"
                        rules={[{ required: true }]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        name="experience"
                        label="Years of Experience"
                      >
                        <Select>
                          <Option value="<1">Less than 1 year</Option>
                          <Option value="1-3">1-3 years</Option>
                          <Option value="3-5">3-5 years</Option>
                          <Option value="5+">5+ years</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        name="rate"
                        label="Hourly Rate ($)"
                        rules={[{ required: true }]}
                      >
                        <Input type="number" prefix="$" />
                      </Form.Item>
                    </Col>

                    <Col span={24}>
                      <Form.Item
                        name="services"
                        label="Services Offered"
                      >
                        <Select mode="multiple">
                          <Option value="Home Cleaning">Home Cleaning</Option>
                          <Option value="Deep Cleaning">Deep Cleaning</Option>
                          <Option value="Office Cleaning">Office Cleaning</Option>
                          <Option value="Carpet Cleaning">Carpet Cleaning</Option>
                          <Option value="Window Cleaning">Window Cleaning</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </TabPane>

              <TabPane tab="Availability" key="2">
                <Form layout="vertical" disabled={!editing}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Availability Type">
                        <Select defaultValue="full-time">
                          <Option value="full-time">Full Time</Option>
                          <Option value="part-time">Part Time</Option>
                          <Option value="weekends">Weekends Only</Option>
                          <Option value="custom">Custom Schedule</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Emergency Jobs">
                        <Switch defaultChecked={cleanerData.emergency} />
                      </Form.Item>
                    </Col>

                    <Col span={24}>
                      <Card title="Working Hours">
                        <Row gutter={16}>
                          <Col span={8}>Monday: 9:00 AM - 5:00 PM</Col>
                          <Col span={8}>Tuesday: 9:00 AM - 5:00 PM</Col>
                          <Col span={8}>Wednesday: 9:00 AM - 5:00 PM</Col>
                          <Col span={8}>Thursday: 9:00 AM - 5:00 PM</Col>
                          <Col span={8}>Friday: 9:00 AM - 5:00 PM</Col>
                          <Col span={8}>Saturday: 10:00 AM - 2:00 PM</Col>
                          <Col span={8}>Sunday: Closed</Col>
                        </Row>
                      </Card>
                    </Col>
                  </Row>
                </Form>
              </TabPane>

              <TabPane tab="Verification & Documents" key="3">
                <Card>
                  <Descriptions column={1}>
                    <Descriptions.Item label="ID Verification">
                      <Tag color="green">Verified</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Background Check">
                      <Tag color="green">Completed</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Insurance">
                      <Tag color="green">Active</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tax Information">
                      <Tag color="orange">Pending</Tag>
                    </Descriptions.Item>
                  </Descriptions>

                  {editing && (
                    <div style={{ marginTop: 16 }}>
                      <Button icon={<UploadOutlined />}>Upload Documents</Button>
                    </div>
                  )}
                </Card>
              </TabPane>

              <TabPane tab="Payment Settings" key="4">
                <Card>
                  <Form layout="vertical" disabled={!editing}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Bank Name">
                          <Input prefix={<BankOutlined />} defaultValue="Chase Bank" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Account Number">
                          <Input.Password placeholder="**** **** **** 1234" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Routing Number">
                          <Input placeholder="021000021" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Tax ID / SSN">
                          <Input.Password placeholder="***-**-1234" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              </TabPane>
            </Tabs>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CleanerProfilePage;