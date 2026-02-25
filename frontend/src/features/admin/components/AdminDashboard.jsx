import { Row, Col, Card, Statistic, Table, Tag, Button, Space, Progress } from 'antd';
import { 
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShopOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  // Mock data
  const recentBookings = [
    { id: '#1234', customer: 'John Doe', cleaner: 'Sarah Johnson', date: '2026-02-23', status: 'pending', amount: 89 },
    { id: '#1235', customer: 'Jane Smith', cleaner: 'Mike Smith', date: '2026-02-23', status: 'confirmed', amount: 129 },
    { id: '#1236', customer: 'Bob Wilson', cleaner: 'Emma Davis', date: '2026-02-22', status: 'completed', amount: 79 },
    { id: '#1237', customer: 'Alice Brown', cleaner: 'Tom Harris', date: '2026-02-22', status: 'completed', amount: 99 },
  ];

  const columns = [
    { title: 'Order ID', dataIndex: 'id', key: 'id' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Cleaner', dataIndex: 'cleaner', key: 'cleaner' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'orange',
          confirmed: 'blue',
          completed: 'green',
          cancelled: 'red'
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (amount) => `$${amount}`
    },
  ];

  // Chart data
  const data = [
    { month: 'Jan', bookings: 145 },
    { month: 'Feb', bookings: 168 },
    { month: 'Mar', bookings: 189 },
    { month: 'Apr', bookings: 220 },
    { month: 'May', bookings: 278 },
    { month: 'Jun', bookings: 310 },
  ];

  const config = {
    data,
    xField: 'month',
    yField: 'bookings',
    point: {
      size: 5,
      shape: 'diamond',
    },
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {/* Stats Cards */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Users" 
              value={12453} 
              prefix={<UserOutlined />} 
              suffix={
                <small style={{ color: '#3f8600', marginLeft: 8 }}>
                  <ArrowUpOutlined /> 12.5%
                </small>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Active Cleaners" 
              value={534} 
              prefix={<ShopOutlined />} 
              suffix={
                <small style={{ color: '#3f8600', marginLeft: 8 }}>
                  <ArrowUpOutlined /> 8.2%
                </small>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Bookings" 
              value={8764} 
              prefix={<CalendarOutlined />} 
              suffix={
                <small style={{ color: '#3f8600', marginLeft: 8 }}>
                  <ArrowUpOutlined /> 18.3%
                </small>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Revenue (MTD)" 
              value={89420} 
              prefix={<DollarOutlined />} 
              precision={2}
              suffix={
                <small style={{ color: '#cf1322', marginLeft: 8 }}>
                  <ArrowDownOutlined /> 2.4%
                </small>
              }
            />
          </Card>
        </Col>

        {/* Chart */}
        <Col xs={24} md={16}>
          <Card title="Booking Trends">
            <Line {...config} />
          </Card>
        </Col>

        {/* Pie Chart */}
        <Col xs={24} md={8}>
          <Card title="Service Distribution">
            <div style={{ textAlign: 'center' }}>
              <Progress 
                type="circle" 
                percent={45} 
                format={() => 'Home'} 
                width={80}
                strokeColor="#1890ff"
              />
              <Progress 
                type="circle" 
                percent={25} 
                format={() => 'Office'} 
                width={80}
                strokeColor="#52c41a"
              />
              <Progress 
                type="circle" 
                percent={20} 
                format={() => 'Deep'} 
                width={80}
                strokeColor="#722ed1"
              />
              <Progress 
                type="circle" 
                percent={10} 
                format={() => 'Move'} 
                width={80}
                strokeColor="#fa8c16"
              />
            </div>
          </Card>
        </Col>

        {/* Recent Bookings */}
        <Col span={24}>
          <Card 
            title="Recent Bookings" 
            extra={<Link to="/admin/bookings">View All</Link>}
          >
            <Table 
              columns={columns} 
              dataSource={recentBookings}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col span={24}>
          <Card title="Quick Actions">
            <Space size="middle" wrap>
              <Button type="primary" icon={<UserOutlined />}>
                Approve New Cleaners (12)
              </Button>
              <Button icon={<CalendarOutlined />}>
                Pending Bookings (8)
              </Button>
              <Button icon={<DollarOutlined />}>
                Process Payments
              </Button>
              <Button icon={<ShopOutlined />}>
                Manage Services
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;