import React from 'react';
import { Card, Form, Input, Switch, Button, Tabs } from 'antd';

const SettingsPage = () => {
  const [form] = Form.useForm();

  return (
    <Card title="System Settings">
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="General" key="1">
          <Form form={form} layout="vertical">
            <Form.Item label="Site Name" name="siteName">
              <Input placeholder="Somaet Cleaning" />
            </Form.Item>
            <Form.Item label="Contact Email" name="email">
              <Input placeholder="admin@somaet.com" />
            </Form.Item>
            <Form.Item label="Maintenance Mode" name="maintenance">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary">Save Changes</Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Payment" key="2">
          <p>Payment settings coming soon...</p>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Notifications" key="3">
          <p>Notification settings coming soon...</p>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
};

export default SettingsPage;