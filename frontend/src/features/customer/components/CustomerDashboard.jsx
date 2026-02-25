import { Row, Col, Card, Statistic, List, Avatar, Button, Calendar, Badge } from 'antd';
import { 
  CalendarOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const CustomerDashboard = () => {
  // Mock data
  const upcomingBookings = [
    { id: 1, date: '2026-03-01', time: '10:00 AM', cleaner: 'Sarah Johnson', status: 'confirmed' },
    { id: 2, date: '2026-03-05', time: '2:00 PM', cleaner: 'Mike Smith', status: 'pending' },
  ];

  const recentCleaners = [
    { id: 1, name: 'Sarah Johnson', rating: 4.8, jobs: 127, image: 'https://i.pravatar.cc/150?u=1' },
    { id: 2, name: 'Mike Smith', rating: 4.9, jobs: 89, image: 'https://i.pravatar.cc/150?u=2' },
    { id: 3, name: 'Emma Wilson', rating: 5.0, jobs: 203, image: 'https://i.pravatar.cc/150?u=3' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {/* Welcome Section */}
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <h2>Welcome back, John! 👋</h2>
                <p style={{ color: '#666' }}>Ready to book your next cleaning?</p>
              </Col>
              <Col>
                <Link to="/customer/search">
                  <Button type="primary" size="large">
                    Book a Cleaner
                  </Button>
                </Link>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Stats Cards */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Bookings" 
              value={24} 
              prefix={<CalendarOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Completed" 
              value={18} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Upcoming" 
              value={6} 
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Favorites" 
              value={8} 
              prefix={<StarOutlined style={{ color: '#fadb14' }} />} 
            />
          </Card>
        </Col>

        {/* Upcoming Bookings */}
        <Col xs={24} md={12}>
          <Card 
            title="Upcoming Bookings" 
            extra={<Link to="/customer/bookings">View All</Link>}
          >
            <List
              itemLayout="horizontal"
              dataSource={upcomingBookings}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Badge status={item.status === 'confirmed' ? 'success' : 'processing'} />}
                    title={item.cleaner}
                    description={`${item.date} at ${item.time}`}
                  />
                  <Link to={`/customer/bookings/${item.id}`}>
                    <Button type="link">View</Button>
                  </Link>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Recent Cleaners */}
        <Col xs={24} md={12}>
          <Card 
            title="Recently Used Cleaners" 
            extra={<Link to="/customer/favorites">View All</Link>}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentCleaners}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={item.image} size={48} />}
                    title={item.name}
                    description={
                      <>
                        <StarOutlined style={{ color: '#fadb14' }} /> {item.rating} • {item.jobs} jobs
                      </>
                    }
                  />
                  <Link to={`/customer/book/${item.id}`}>
                    <Button type="primary" size="small">Book Again</Button>
                  </Link>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Calendar View */}
        <Col span={24}>
          <Card title="Your Schedule">
            <Calendar fullscreen={false} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerDashboard;