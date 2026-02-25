import React, { useState } from 'react';
import { Input, Row, Col, Card, Rate, Button, Slider, Checkbox } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Search } = Input;

const SearchPage = () => {
  const [priceRange, setPriceRange] = useState([20, 100]);

  // Mock data
  const cleaners = [
    { id: 1, name: 'Sarah Johnson', rating: 4.8, price: 45, image: 'https://i.pravatar.cc/150?u=1', jobs: 127 },
    { id: 2, name: 'Mike Smith', rating: 4.9, price: 55, image: 'https://i.pravatar.cc/150?u=2', jobs: 89 },
    { id: 3, name: 'Emma Wilson', rating: 5.0, price: 60, image: 'https://i.pravatar.cc/150?u=3', jobs: 203 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        {/* Filters Sidebar */}
        <Col span={6}>
          <Card title="Filters">
            <div style={{ marginBottom: 24 }}>
              <h4>Price Range</h4>
              <Slider
                range
                min={0}
                max={200}
                defaultValue={[20, 100]}
                onChange={setPriceRange}
              />
              <div>${priceRange[0]} - ${priceRange[1]}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4>Rating</h4>
              <Checkbox>5 Stars</Checkbox>
              <Checkbox>4+ Stars</Checkbox>
              <Checkbox>3+ Stars</Checkbox>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4>Experience</h4>
              <Checkbox>Less than 1 year</Checkbox>
              <Checkbox>1-3 years</Checkbox>
              <Checkbox>3-5 years</Checkbox>
              <Checkbox>5+ years</Checkbox>
            </div>

            <Button type="primary" block>Apply Filters</Button>
          </Card>
        </Col>

        {/* Results */}
        <Col span={18}>
          <Search
            placeholder="Search by name or location"
            enterButton={<SearchOutlined />}
            size="large"
            style={{ marginBottom: 24 }}
          />

          {cleaners.map(cleaner => (
            <Card key={cleaner.id} style={{ marginBottom: 16 }} hoverable>
              <Row gutter={16} align="middle">
                <Col span={4}>
                  <img 
                    src={cleaner.image} 
                    alt={cleaner.name}
                    style={{ width: 80, height: 80, borderRadius: '50%' }}
                  />
                </Col>
                <Col span={14}>
                  <h3>{cleaner.name}</h3>
                  <Rate disabled defaultValue={cleaner.rating} allowHalf />
                  <span style={{ marginLeft: 8 }}>({cleaner.jobs} jobs)</span>
                  <p><EnvironmentOutlined /> Within 5 miles</p>
                </Col>
                <Col span={6} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }}>
                    ${cleaner.price}/hr
                  </div>
                  <Link to={`/customer/cleaner/${cleaner.id}`}>
                    <Button type="primary">View Profile</Button>
                  </Link>
                </Col>
              </Row>
            </Card>
          ))}
        </Col>
      </Row>
    </div>
  );
};

export default SearchPage;