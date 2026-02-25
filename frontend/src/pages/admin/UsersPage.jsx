import React from 'react';
import { Card, Table, Button, Space, Tag, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const UsersPage = () => {
  const columns = [
    { title: 'User', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Actions', key: 'actions', render: () => <Button size="small">Edit</Button> }
  ];

  return (
    <Card title="User Management">
      <Table columns={columns} dataSource={[]} />
    </Card>
  );
};

export default UsersPage;