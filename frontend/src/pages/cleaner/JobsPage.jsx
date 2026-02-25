import React from 'react';
import { Card, Table, Tag, Button, Space } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const JobsPage = () => {
  const columns = [
    { title: 'Job ID', dataIndex: 'id', key: 'id' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Duration', dataIndex: 'duration', key: 'duration' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => (
        <Tag icon={status === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />} 
             color={status === 'completed' ? 'success' : 'processing'}>
          {status}
        </Tag>
      )
    },
    { title: 'Actions', key: 'actions', render: () => <Button size="small">View Details</Button> }
  ];

  return (
    <Card title="My Jobs">
      <Table columns={columns} dataSource={[]} />
    </Card>
  );
};

export default JobsPage;