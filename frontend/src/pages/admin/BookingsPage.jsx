import React from 'react';
import { Card, Table, Tag, Button } from 'antd';

const BookingsPage = () => {
  const columns = [
    { title: 'Booking ID', dataIndex: 'id', key: 'id' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Cleaner', dataIndex: 'cleaner', key: 'cleaner' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'blue'}>{status}</Tag>
      )
    },
    { title: 'Actions', key: 'actions', render: () => <Button size="small">View</Button> }
  ];

  return (
    <Card title="All Bookings">
      <Table columns={columns} dataSource={[]} />
    </Card>
  );
};

export default BookingsPage;