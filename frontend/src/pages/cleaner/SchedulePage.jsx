import React from 'react';
import { Card, Calendar, Badge, Row, Col, List, Tag } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';

const SchedulePage = () => {
  // Mock data
  const jobs = [
    { date: '2026-02-24', time: '10:00 AM', customer: 'John Doe', address: '123 Main St', duration: '2 hrs', status: 'confirmed' },
    { date: '2026-02-24', time: '2:00 PM', customer: 'Jane Smith', address: '456 Oak Ave', duration: '3 hrs', status: 'confirmed' },
    { date: '2026-02-25', time: '9:00 AM', customer: 'Bob Wilson', address: '789 Pine Rd', duration: '4 hrs', status: 'pending' },
  ];

  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    return jobs.filter(job => job.date === dateStr);
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {listData.map(item => (
          <li key={item.time}>
            <Badge status={item.status === 'confirmed' ? 'success' : 'processing'} text={`${item.time} - ${item.customer}`} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="My Schedule">
            <Calendar dateCellRender={dateCellRender} />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Upcoming Jobs">
            <List
              dataSource={jobs}
              renderItem={job => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ClockCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={`${job.customer} - ${job.date} at ${job.time}`}
                    description={
                      <>
                        <EnvironmentOutlined /> {job.address} • {job.duration}
                      </>
                    }
                  />
                  <Tag color={job.status === 'confirmed' ? 'green' : 'orange'}>
                    {job.status.toUpperCase()}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SchedulePage;