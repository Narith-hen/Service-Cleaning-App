import React from 'react';
import { Row, Col, Card, Statistic, Table, DatePicker, Progress } from 'antd';
import { DollarOutlined, CalendarOutlined, RiseOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const EarningsPage = () => {
  // Mock data
  const earningsData = [
    { date: '2026-02-23', customer: 'John Doe', job: 'Home Cleaning', amount: 89, status: 'paid' },
    { date: '2026-02-22', customer: 'Jane Smith', job: 'Deep Cleaning', amount: 129, status: 'paid' },
    { date: '2026-02-21', customer: 'Bob Wilson', job: 'Office Cleaning', amount: 159, status: 'pending' },
    { date: '2026-02-20', customer: 'Alice Brown', job: 'Home Cleaning', amount: 79, status: 'paid' },
  ];

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Job', dataIndex: 'job', key: 'job' },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (amount) => `$${amount}`
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
  ];

  const totalEarnings = earningsData.reduce((sum, item) => sum + item.amount, 0);
  const paidEarnings = earningsData.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div style={{ padding: 24 }}>
      <h1>Earnings</h1>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic 
              title="Total Earnings" 
              value={totalEarnings} 
              prefix={<DollarOutlined />} 
              suffix="USD"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic 
              title="Paid Out" 
              value={paidEarnings} 
              prefix={<DollarOutlined />} 
              suffix="USD"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic 
              title="Pending" 
              value={totalEarnings - paidEarnings} 
              prefix={<DollarOutlined />} 
              suffix="USD"
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card 
            title="Earnings History"
            extra={<RangePicker />}
          >
            <Table columns={columns} dataSource={earningsData} rowKey="date" />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Monthly Performance">
            <Row gutter={16}>
              <Col span={6}>
                <Progress type="dashboard" percent={75} format={() => '$2,450'} />
                <div style={{ textAlign: 'center' }}>This Month</div>
              </Col>
              <Col span={6}>
                <Progress type="dashboard" percent={85} format={() => '$2,890'} />
                <div style={{ textAlign: 'center' }}>Last Month</div>
              </Col>
              <Col span={6}>
                <Progress type="dashboard" percent={15} format={() => '+15%'} status="active" />
                <div style={{ textAlign: 'center' }}>Growth</div>
              </Col>
              <Col span={6}>
                <Progress type="dashboard" percent={92} format={() => '4.9★'} />
                <div style={{ textAlign: 'center' }}>Rating</div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EarningsPage;