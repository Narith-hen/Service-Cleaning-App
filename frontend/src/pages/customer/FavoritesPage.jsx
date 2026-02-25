import React from 'react';
import { Row, Col, Card, Avatar, Rate, Button, Empty } from 'antd';
import { Link } from 'react-router-dom';
import { EnvironmentOutlined, DeleteOutlined } from '@ant-design/icons';

const FavoritesPage = () => {
  // Mock data
  const favorites = [
    { id: 1, name: 'Sarah Johnson', rating: 4.8, price: 45, image: 'https://i.pravatar.cc/150?u=1', jobs: 127 },
    { id: 2, name: 'Mike Smith', rating: 4.9, price: 55, image: 'https://i.pravatar.cc/150?u=2', jobs: 89 },
    { id: 3, name: 'Emma Wilson', rating: 5.0, price: 60, image: 'https://i.pravatar.cc/150?u=3', jobs: 203 },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1>My Favorite Cleaners</h1>
      
      {favorites.length === 0 ? (
        <Empty description="No favorites yet" />
      ) : (
        <Row gutter={[16, 16]}>
          {favorites.map(cleaner => (
            <Col xs={24} sm={12} lg={8} key={cleaner.id}>
              <Card
                hoverable
                actions={[
                  <Link to={`/customer/book/${cleaner.id}`}>
                    <Button type="link">Book</Button>
                  </Link>,
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    Remove
                  </Button>
                ]}
              >
                <div style={{ textAlign: 'center' }}>
                  <Avatar src={cleaner.image} size={80} />
                  <h3 style={{ marginTop: 16 }}>{cleaner.name}</h3>
                  <Rate disabled defaultValue={cleaner.rating} allowHalf />
                  <p><EnvironmentOutlined /> Within 5 miles</p>
                  <div style={{ fontSize: 20, color: '#1890ff' }}>${cleaner.price}/hr</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default FavoritesPage;