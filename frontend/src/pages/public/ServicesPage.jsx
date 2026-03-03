// import React from 'react';
// import { Link } from 'react-router-dom';
// import { Row, Col, Card, Button, Typography, Layout, Menu, Space } from 'antd';
// import { 
//   HomeOutlined, 
//   UserOutlined, 
//   LoginOutlined, 
//   UserAddOutlined,
//   PhoneOutlined,
//   InfoCircleOutlined,
//   AppstoreOutlined,
//   CheckCircleOutlined
// } from '@ant-design/icons';
// import { useAuth } from '../../hooks/useAuth';

// const { Header, Content, Footer } = Layout;
// const { Title, Paragraph, Text } = Typography;

// const ServicesPage = () => {
//   const { user, role } = useAuth();

//   const services = [
//     {
//       icon: '🏠',
//       title: 'Home Cleaning',
//       description: 'Regular home cleaning services tailored to your needs. Includes dusting, vacuuming, mopping, and more.',
//       price: '$80',
//       features: ['Living areas', 'Bedrooms', 'Kitchen', 'Bathrooms']
//     },
//     {
//       icon: '🔍',
//       title: 'Deep Cleaning',
//       description: 'Thorough deep cleaning for a spotless home. Perfect for spring cleaning or special occasions.',
//       price: '$150',
//       features: ['Inside appliances', 'Baseboards', 'Window sills', 'Deep scrub']
//     },
//     {
//       icon: '🏢',
//       title: 'Office Cleaning',
//       description: 'Keep your workspace clean and productive. Professional cleaning for offices of all sizes.',
//       price: '$120',
//       features: ['Workstations', 'Meeting rooms', 'Break areas', 'Restrooms']
//     },
//     {
//       icon: '📦',
//       title: 'Move In/Out',
//       description: 'Make your move easier with our move-in/move-out cleaning services.',
//       price: '$200',
//       features: ['Empty properties', 'Cabinets', 'Closets', 'Final walkthrough']
//     }
//   ];

//   return (
//     <Layout style={{ minHeight: '100vh' }}>
//       {/* Navigation Header */}
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
//             Our Services
//           </Title>
//           <Paragraph style={{ color: 'white', fontSize: 20, maxWidth: 600, margin: '0 auto' }}>
//             Professional cleaning solutions tailored to your needs
//           </Paragraph>
//         </section>

//         {/* Services Grid */}
//         <section style={{ padding: '80px 50px', maxWidth: 1200, margin: '0 auto' }}>
//           <Row gutter={[32, 32]}>
//             {services.map((service, index) => (
//               <Col xs={24} md={12} key={index}>
//                 <Card 
//                   hoverable
//                   style={{ 
//                     height: '100%', 
//                     borderRadius: 12,
//                     padding: '24px'
//                   }}
//                 >
//                   <Row gutter={[24, 24]}>
//                     <Col span={24}>
//                       <div style={{ fontSize: 48, marginBottom: 16 }}>{service.icon}</div>
//                       <Title level={2} style={{ marginBottom: 16 }}>{service.title}</Title>
//                       <Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
//                         {service.description}
//                       </Paragraph>
//                     </Col>
                    
//                     <Col span={24}>
//                       <div style={{ marginBottom: 24 }}>
//                         {service.features.map((feature, idx) => (
//                           <div key={idx} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
//                             <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 12, fontSize: 16 }} />
//                             <Text style={{ fontSize: 16 }}>{feature}</Text>
//                           </div>
//                         ))}
//                       </div>
//                     </Col>
                    
//                     <Col span={24}>
//                       <div style={{ 
//                         display: 'flex', 
//                         justifyContent: 'space-between', 
//                         alignItems: 'center',
//                         borderTop: '1px solid #f0f0f0',
//                         paddingTop: 24
//                       }}>
//                         <div>
//                           <Text type="secondary" style={{ fontSize: 14 }}>Starting from</Text>
//                           <Title level={3} style={{ margin: 0, color: '#667eea' }}>{service.price}</Title>
//                         </div>
//                         {user ? (
//                           <Link to={`/${role}/book`}>
//                             <Button type="primary" size="large">Book Now</Button>
//                           </Link>
//                         ) : (
//                           <Link to="/register">
//                             <Button type="primary" size="large">Sign Up to Book</Button>
//                           </Link>
//                         )}
//                       </div>
//                     </Col>
//                   </Row>
//                 </Card>
//               </Col>
//             ))}
//           </Row>
//         </section>

//         {/* CTA Section */}
//         <section style={{ 
//           background: '#f9f9f9', 
//           padding: '60px 20px', 
//           textAlign: 'center' 
//         }}>
//           <Title level={2}>Ready to Get Started?</Title>
//           <Paragraph style={{ fontSize: 18, color: '#666', marginBottom: 30 }}>
//             Join thousands of satisfied customers who trust Somaet
//           </Paragraph>
//           {!user && (
//             <Link to="/register">
//               <Button type="primary" size="large" style={{ 
//                 height: 50, 
//                 padding: '0 40px',
//                 fontSize: 18,
//                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//                 border: 'none'
//               }}>
//                 Create Free Account
//               </Button>
//             </Link>
//           )}
//         </section>
//       </Content>

//       <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
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

// export default ServicesPage;


import Navbar from "../components/Navbar";
import homeImage from "../../assets/home.png";
import officeImage from "../../assets/office.png";
import windowImage from "../../assets/window.png";
import shopImage from "../../assets/shop.png";

export default function ServicesPage({ embedded = false }) {
  const services = [
    {
      title: "Home Cleaning",
      description:
        "Keep your home fresh and healthy with routine dust, stain, and floor care.",
      image: homeImage
    },
    {
      title: "Deep Cleaning",
      description:
        "A full top-to-bottom clean for kitchens, bathrooms, corners, and hard-to-reach areas.",
      image: homeImage
    },
    {
      title: "Office Cleaning",
      description:
        "Create a cleaner workspace that helps your team stay focused and productive.",
      image: officeImage
    },
    {
      title: "Window Cleaning",
      description:
        "Crystal-clear windows that brighten every room with more natural light.",
      image: windowImage
    },
    {
      title: "Move In/Out Cleaning",
      description:
        "Detailed move-in and move-out service to leave every room spotless and ready.",
      image: windowImage
    },
    {
      title: "Shop Cleaning",
      description:
        "Maintain a neat and welcoming store that leaves a strong first impression.",
      image: shopImage
    },
    {
      title: "Post-Construction Cleaning",
      description:
        "Remove dust, debris, and residue after renovation or construction work.",
      image: shopImage
    }
  ];

  return (
    <div>
      {!embedded && <Navbar />}

      <div className="max-w-6xl mx-auto py-20 px-6">
        <h2 className="text-4xl font-black text-center mb-12">
          OUR SERVICES
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-gray-500">
          Professional cleaning packages with modern service quality. Hover cards to preview
          the interactive layout.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#32c753]/20"
            >
              <div className="relative overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute left-4 top-4 rounded-full bg-[#32c753] px-3 py-1 text-xs font-bold text-white">
                  0{index + 1}
                </span>
              </div>

              <div className="p-7">
                <h3 className="mb-3 text-xl font-extrabold text-slate-900 transition-colors duration-300 group-hover:text-[#32c753]">
                  {service.title}
                </h3>
                <p className="text-gray-500">{service.description}</p>
                <button className="mt-6 rounded-lg border border-[#32c753] px-4 py-2 text-sm font-bold text-[#32c753] transition-all duration-300 hover:bg-[#32c753] hover:text-white">
                  Book Service
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
