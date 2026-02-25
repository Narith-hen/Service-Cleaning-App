import { Row, Col, Steps, Button } from 'antd';
import { 
  SearchOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  SmileOutlined
} from '@ant-design/icons';

const { Step } = Steps;

const HowItWorks = () => {
  return (
    <div style={{ 
      background: '#f5f5f5',
      padding: '64px 24px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 16 }}>
            How It Works
          </h2>
          <p style={{ fontSize: 18, color: '#666' }}>
            Book a cleaner in three simple steps
          </p>
        </div>

        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} md={12}>
            <Steps direction="vertical" size="large" current={-1}>
              <Step 
                title="Find Your Cleaner"
                description="Search for cleaners in your area, compare ratings, and choose the best fit"
                icon={<SearchOutlined />}
                status="wait"
              />
              <Step 
                title="Book & Schedule"
                description="Pick a date and time that works for you, add special instructions"
                icon={<CalendarOutlined />}
                status="wait"
              />
              <Step 
                title="Pay Securely"
                description="Pay online with our secure payment system - no cash needed"
                icon={<CreditCardOutlined />}
                status="wait"
              />
              <Step 
                title="Enjoy Your Clean Space"
                description="Relax while our professional cleans your space perfectly"
                icon={<SmileOutlined />}
                status="wait"
              />
            </Steps>
            
            <Button 
              type="primary" 
              size="large" 
              style={{ marginTop: 32, borderRadius: 8 }}
            >
              Get Started Now
            </Button>
          </Col>
          
          <Col xs={24} md={12}>
            <img 
              src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              alt="Cleaning Process"
              style={{ 
                width: '100%', 
                borderRadius: 16,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HowItWorks;