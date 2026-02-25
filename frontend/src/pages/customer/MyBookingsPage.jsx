import React from 'react';
import { Card, Tabs, List, Tag, Button, Space } from 'antd';
import { Link } from 'react-router-dom';

const { TabPane } = Tabs;

const MyBookingsPage = () => {
  // Mock data
  const bookings = {
    upcoming: [
      { id: 1, cleaner: 'Sarah Johnson', date: '2026-03-01', time: '10:00 AM', status: 'confirmed', total: 89 },
      { id: 2, cleaner: 'Mike Smith', date: '2026-03-05', time: '2:00 PM', status: 'pending', total: 129 },
    ],
    completed: [
      { id: 3, cleaner: 'Emma Wilson', date: '2026-02-20', time: '1:00 PM', status: 'completed', total: 79 },
      { id: 4, cleaner: 'Tom Harris', date: '2026-02-15', time: '9:00 AM', status: 'completed', total: 99 },
    ],
    cancelled: [
      { id: 5, cleaner: 'Lisa Brown', date: '2026-02-10', time: '3:00 PM', status: 'cancelled', total: 59 },
    ]
  };

  const renderBookingItem = (booking) => (
    <List.Item>
      <List.Item.Meta
        title={`${booking.cleaner} - ${booking.date} at ${booking.time}`}
        description={`Total: $${booking.total}`}
      />
      <Space>
        <Tag color={
          booking.status === 'confirmed' ? 'green' :
          booking.status === 'pending' ? 'orange' :
          booking.status === 'completed' ? 'blue' : 'red'
        }>
          {booking.status.toUpperCase()}
        </Tag>
        <Link to={`/customer/bookings/${booking.id}`}>
          <Button size="small">View Details</Button>
        </Link>
      </Space>
    </List.Item>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Card title="My Bookings">
        <Tabs defaultActiveKey="1">
          <TabPane tab="Upcoming" key="1">
            <List
              dataSource={bookings.upcoming}
              renderItem={renderBookingItem}
            />
          </TabPane>
          <TabPane tab="Completed" key="2">
            <List
              dataSource={bookings.completed}
              renderItem={renderBookingItem}
            />
          </TabPane>
          <TabPane tab="Cancelled" key="3">
            <List
              dataSource={bookings.cancelled}
              renderItem={renderBookingItem}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default MyBookingsPage;