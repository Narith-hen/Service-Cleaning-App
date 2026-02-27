// import React from 'react';
// import { Link } from 'react-router-dom';
// import { Row, Col, Card, Button, Typography, Layout, Menu, Space, Form, Input } from 'antd';
// import { 
//   HomeOutlined, 
//   UserOutlined, 
//   LoginOutlined, 
//   UserAddOutlined,
//   PhoneOutlined,
//   InfoCircleOutlined,
//   AppstoreOutlined,
//   MailOutlined,
//   EnvironmentOutlined,
//   ClockCircleOutlined
// } from '@ant-design/icons';
// import { useAuth } from '../../hooks/useAuth';

// const { Header, Content, Footer } = Layout;
// const { Title, Paragraph, Text } = Typography;
// const { TextArea } = Input;

// const ContactPage = () => {
//   const { user, role } = useAuth();

//   const onFinish = (values) => {
//     console.log('Contact form:', values);
//     // Handle form submission
//   };

//   return (
//     <Layout style={{ minHeight: '100vh' }}>
//       {/* Navigation Header - same as before */}
//       <Header style={{ 
//         position: 'fixed', 
//         zIndex: 1, 
//         width: '100%', 
//         background: 'white',
//         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         padding: '0 50px'
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center' }}>
//           <div style={{
//             width: 40,
//             height: 40,
//             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//             borderRadius: '50%',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             marginRight: 15,
//             color: 'white',
//             fontWeight: 'bold',
//             fontSize: 20
//           }}>
//             S
//           </div>
//           <Title level={3} style={{ margin: 0, color: '#333' }}>Somaet</Title>
//         </div>
        
//         <Menu mode="horizontal" style={{ border: 'none', flex: 1, justifyContent: 'center' }}>
//           <Menu.Item key="home" icon={<HomeOutlined />}>
//             <Link to="/">Home</Link>
//           </Menu.Item>
//           <Menu.Item key="services" icon={<AppstoreOutlined />}>
//             <Link to="/services">Services</Link>
//           </Menu.Item>
//           <Menu.Item key="about" icon={<InfoCircleOutlined />}>
//             <Link to="/about">About</Link>
//           </Menu.Item>
//           <Menu.Item key="contact" icon={<PhoneOutlined />}>
//             <Link to="/contact">Contact</Link>
//           </Menu.Item>
//         </Menu>

//         <Space>
//           {user ? (
//             <Link to={`/${role}`}>
//               <Button type="primary" icon={<UserOutlined />}>
//                 Dashboard
//               </Button>
//             </Link>
//           ) : (
//             <>
//               <Link to="/login">
//                 <Button icon={<LoginOutlined />}>Log In</Button>
//               </Link>
//               <Link to="/register">
//                 <Button type="primary" icon={<UserAddOutlined />}>
//                   Sign Up
//                 </Button>
//               </Link>
//             </>
//           )}
//         </Space>
//       </Header>

//       <Content style={{ marginTop: 64 }}>
//         {/* Hero Section */}
//         <section style={{ 
//           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//           color: 'white',
//           padding: '80px 20px',
//           textAlign: 'center'
//         }}>
//           <Title style={{ color: 'white', fontSize: 48, marginBottom: 20 }}>
//             Contact Us
//           </Title>
//           <Paragraph style={{ color: 'white', fontSize: 20, maxWidth: 600, margin: '0 auto' }}>
//             We're here to help! Reach out with any questions or concerns
//           </Paragraph>
//         </section>

//         {/* Contact Info and Form */}
//         <section style={{ padding: '80px 50px', maxWidth: 1200, margin: '0 auto' }}>
//           <Row gutter={[50, 50]}>
//             {/* Contact Information */}
//             <Col xs={24} md={10}>
//               <Title level={3}>Get in Touch</Title>
//               <Paragraph style={{ fontSize: 16, marginBottom: 30 }}>
//                 Have questions about our services? Need help with a booking? 
//                 Our team is here to assist you.
//               </Paragraph>

//               <div style={{ marginBottom: 30 }}>
//                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
//                   <PhoneOutlined style={{ fontSize: 24, color: '#667eea', marginRight: 15 }} />
//                   <div>
//                     <Text strong>Phone</Text>
//                     <div><Text type="secondary">+1 (555) 123-4567</Text></div>
//                   </div>
//                 </div>

//                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
//                   <MailOutlined style={{ fontSize: 24, color: '#667eea', marginRight: 15 }} />
//                   <div>
//                     <Text strong>Email</Text>
//                     <div><Text type="secondary">support@somaet.com</Text></div>
//                   </div>
//                 </div>

//                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
//                   <EnvironmentOutlined style={{ fontSize: 24, color: '#667eea', marginRight: 15 }} />
//                   <div>
//                     <Text strong>Office</Text>
//                     <div><Text type="secondary">123 Cleaning St, Suite 100<br />San Francisco, CA 94105</Text></div>
//                   </div>
//                 </div>

//                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
//                   <ClockCircleOutlined style={{ fontSize: 24, color: '#667eea', marginRight: 15 }} />
//                   <div>
//                     <Text strong>Hours</Text>
//                     <div><Text type="secondary">Mon-Fri: 9am - 6pm<br />Sat-Sun: 10am - 4pm</Text></div>
//                   </div>
//                 </div>
//               </div>
//             </Col>

//             {/* Contact Form */}
//             <Col xs={24} md={14}>
//               <Card style={{ borderRadius: 12 }}>
//                 <Title level={4}>Send us a Message</Title>
//                 <Form
//                   name="contact"
//                   onFinish={onFinish}
//                   layout="vertical"
//                   size="large"
//                 >
//                   <Row gutter={16}>
//                     <Col xs={24} sm={12}>
//                       <Form.Item
//                         name="firstName"
//                         rules={[{ required: true, message: 'Please enter your first name' }]}
//                       >
//                         <Input placeholder="First Name" />
//                       </Form.Item>
//                     </Col>
//                     <Col xs={24} sm={12}>
//                       <Form.Item
//                         name="lastName"
//                         rules={[{ required: true, message: 'Please enter your last name' }]}
//                       >
//                         <Input placeholder="Last Name" />
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   <Form.Item
//                     name="email"
//                     rules={[
//                       { required: true, message: 'Please enter your email' },
//                       { type: 'email', message: 'Please enter a valid email' }
//                     ]}
//                   >
//                     <Input placeholder="Email Address" />
//                   </Form.Item>

//                   <Form.Item
//                     name="subject"
//                     rules={[{ required: true, message: 'Please enter a subject' }]}
//                   >
//                     <Input placeholder="Subject" />
//                   </Form.Item>

//                   <Form.Item
//                     name="message"
//                     rules={[{ required: true, message: 'Please enter your message' }]}
//                   >
//                     <TextArea rows={5} placeholder="Your Message" />
//                   </Form.Item>

//                   <Form.Item>
//                     <Button type="primary" htmlType="submit" block>
//                       Send Message
//                     </Button>
//                   </Form.Item>
//                 </Form>
//               </Card>
//             </Col>
//           </Row>
//         </section>

//         {/* Map Section */}
//         <section style={{ padding: '0 50px 80px', maxWidth: 1200, margin: '0 auto' }}>
//           <Card style={{ padding: 0, overflow: 'hidden' }}>
//             <div style={{ 
//               height: 400, 
//               background: '#f0f2f5',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center'
//             }}>
//               <Text type="secondary">Google Maps Integration Here</Text>
//             </div>
//           </Card>
//         </section>
//       </Content>

//       <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
//         {/* Same footer as before */}
//         <Row gutter={[32, 32]} justify="center">
//           <Col xs={24} md={6}>
//             <Title level={4}>Somaet</Title>
//             <Text type="secondary">Professional cleaning services at your fingertips</Text>
//           </Col>
//           <Col xs={24} md={6}>
//             <Title level={4}>Quick Links</Title>
//             <div><Link to="/about">About Us</Link></div>
//             <div><Link to="/services">Services</Link></div>
//             <div><Link to="/contact">Contact</Link></div>
//           </Col>
//           <Col xs={24} md={6}>
//             <Title level={4}>Legal</Title>
//             <div><Link to="/terms">Terms of Service</Link></div>
//             <div><Link to="/privacy">Privacy Policy</Link></div>
//           </Col>
//         </Row>
//         <div style={{ marginTop: 40 }}>
//           <Text type="secondary">© 2026 Somaet. All rights reserved.</Text>
//         </div>
//       </Footer>
//     </Layout>
//   );
// };

// export default ContactPage;

import Navbar from "../components/Navbar";

export default function ContactPage({ embedded = false }) {
  return (
    <div>
      {!embedded && <Navbar />}

      <div className="max-w-xl mx-auto py-20 px-6">
        <h2 className="text-4xl font-black mb-8 text-center">Contact Us</h2>

        <form className="space-y-6">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="email"
            placeholder="Your Email"
            className="w-full border p-3 rounded-lg"
          />

          <textarea
            placeholder="Your Message"
            className="w-full border p-3 rounded-lg"
            rows="4"
          ></textarea>

          <button className="w-full bg-teal-700 text-white py-3 rounded-lg font-bold">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
