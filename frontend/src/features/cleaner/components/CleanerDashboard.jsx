import { Row, Col, Card, Statistic, List, Avatar, Tag, Progress, Button } from 'antd';
import { 
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const CleanerDashboard = () => {
  // Mock data
  const todaysJobs = [
    { id: 1, time: '10:00 AM', customer: 'Alice Brown', address: '123 Main St', duration: '2 hrs' },
    { id: 2, time: '1:00 PM', customer: 'Bob Wilson', address: '456 Oak Ave', duration: '3 hrs' },
    { id: 3, time: '4:00 PM', customer: 'Carol Davis', address: '789 Pine Rd', duration: '2 hrs' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {/* Welcome */}
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <h2>Welcome back, Sarah! 🧹</h2>
                <p style={{ color: '#666' }}>You have 3 jobs scheduled for today</p>
              </Col>
              <Col>
                <Button type="primary" icon={<CalendarOutlined />}>
                  Update Availability
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Stats */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Today's Earnings" 
              value={185} 
              prefix={<DollarOutlined />} 
              suffix="USD"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Weekly Total" 
              value={1240} 
              prefix={<DollarOutlined />} 
              suffix="USD"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Completed Jobs" 
              value={127} 
              prefix={<CheckCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Rating" 
              value={4.9} 
              prefix={<StarOutlined />} 
              suffix="/5"
            />
          </Card>
        </Col>

        {/* Today's Schedule */}
        <Col xs={24} md={16}>
          <Card 
            title="Today's Schedule" 
            extra={<Link to="/cleaner/schedule">View Full Schedule</Link>}
          >
            <List
              itemLayout="horizontal"
              dataSource={todaysJobs}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{item.time}</Avatar>}
                    title={item.customer}
                    description={
                      <>
                        <EnvironmentOutlined /> {item.address} • {item.duration}
                      </>
                    }
                  />
                  <Tag color="blue">Upcoming</Tag>
                  <Button type="link" style={{ marginLeft: 8 }}>Details</Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Performance */}
        <Col xs={24} md={8}>
          <Card title="Performance">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Completion Rate</span>
                <span>98%</span>
              </div>
              <Progress percent={98} status="active" showInfo={false} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>On-Time Rate</span>
                <span>95%</span>
              </div>
              <Progress percent={95} status="active" showInfo={false} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Customer Satisfaction</span>
                <span>4.9/5</span>
              </div>
              <Progress percent={98} status="active" showInfo={false} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CleanerDashboard;