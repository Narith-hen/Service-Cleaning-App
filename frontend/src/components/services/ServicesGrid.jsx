import { Row, Col, Card, Button } from 'antd';
import { 
  HomeOutlined,
  ApartmentOutlined,
  MedicineBoxOutlined,
  CarOutlined,
  CloudOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const services = [
  {
    id: 1,
    title: 'Home Cleaning',
    description: 'Regular cleaning for your home',
    icon: <HomeOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    price: '$49/hr',
    color: '#e6f7ff',
    border: '#91d5ff'
  },
  {
    id: 2,
    title: 'Office Cleaning',
    description: 'Commercial & office spaces',
    icon: <ApartmentOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    price: '$59/hr',
    color: '#f6ffed',
    border: '#b7eb8f'
  },
  {
    id: 3,
    title: 'Deep Cleaning',
    description: 'Thorough deep cleaning service',
    icon: <MedicineBoxOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    price: '$79/hr',
    color: '#f9f0ff',
    border: '#d3adf7'
  },
  {
    id: 4,
    title: 'Move In/Out',
    description: 'Before or after moving',
    icon: <CarOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
    price: '$89/hr',
    color: '#fff7e6',
    border: '#ffd591'
  },
  {
    id: 5,
    title: 'Carpet Cleaning',
    description: 'Deep carpet steam cleaning',
    icon: <CloudOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
    price: '$69/hr',
    color: '#fff0f6',
    border: '#ffadd2'
  },
  {
    id: 6,
    title: 'Window Cleaning',
    description: 'Interior & exterior windows',
    icon: <ToolOutlined style={{ fontSize: 32, color: '#fa541c' }} />,
    price: '$39/hr',
    color: '#fff2e8',
    border: '#ffbb96'
  }
];

const ServicesGrid = () => {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 16 }}>
          Our Cleaning Services
        </h2>
        <p style={{ fontSize: 18, color: '#666', maxWidth: 600, margin: '0 auto' }}>
          Choose from our wide range of professional cleaning services
        </p>
      </div>

      <Row gutter={[24, 24]}>
        {services.map(service => (
          <Col xs={24} sm={12} lg={8} key={service.id}>
            <Card
              hoverable
              style={{ 
                borderRadius: 16,
                height: '100%',
                transition: 'transform 0.3s',
                borderTop: `4px solid ${service.border}`
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 12,
                background: service.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20
              }}>
                {service.icon}
              </div>
              
              <h3 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                {service.title}
              </h3>
              
              <p style={{ color: '#666', marginBottom: 16, minHeight: 48 }}>
                {service.description}
              </p>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                  {service.price}
                </span>
                
                <Link to={`/book/${service.id}`}>
                  <Button type="primary">Book Now</Button>
                </Link>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Button size="large" type="default" style={{ borderRadius: 8 }}>
          View All Services
        </Button>
      </div>
    </div>
  );
};

export default ServicesGrid;