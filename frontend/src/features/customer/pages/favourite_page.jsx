import React, { useState } from 'react';
import { 
  StarOutlined, 
  EnvironmentOutlined, 
  UserOutlined,
  DeleteOutlined,
  HeartOutlined,
  HeartFilled
} from '@ant-design/icons';
import '../../../styles/customer/favourite.scss';

const FavouritePage = () => {
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      type: 'cleaner',
      name: 'Maria Garcia',
      rating: 4.9,
      jobs: 156,
      specialty: 'Deep Cleaning',
      location: 'New York, NY',
      avatar: null,
      favorited: true
    },
    {
      id: 2,
      type: 'cleaner',
      name: 'David Lee',
      rating: 5.0,
      jobs: 98,
      specialty: 'Window Cleaning',
      location: 'Brooklyn, NY',
      avatar: null,
      favorited: true
    },
    {
      id: 3,
      type: 'service',
      name: 'Regular Cleaning',
      price: 45,
      duration: '2 hours',
      description: 'Weekly or bi-weekly maintenance',
      favorited: true
    },
    {
      id: 4,
      type: 'service',
      name: 'Deep Cleaning',
      price: 120,
      duration: '4 hours',
      description: 'Thorough cleaning of entire space',
      favorited: true
    },
    {
      id: 5,
      type: 'cleaner',
      name: 'James Wilson',
      rating: 4.8,
      jobs: 142,
      specialty: 'Move Out/In',
      location: 'Manhattan, NY',
      avatar: null,
      favorited: true
    }
  ]);

  const [filter, setFilter] = useState('all'); // 'all', 'cleaners', 'services'

  const handleRemoveFavorite = (id) => {
    setFavorites(favorites.filter(item => item.id !== id));
  };

  const filteredFavorites = favorites.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'cleaners') return item.type === 'cleaner';
    if (filter === 'services') return item.type === 'service';
    return true;
  });

  return (
    <div className="favourite-page">
      <div className="page-header">
        <h1>My Favorites</h1>
        <p>You have {favorites.length} saved items</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({favorites.length})
        </button>
        <button 
          className={`tab-btn ${filter === 'cleaners' ? 'active' : ''}`}
          onClick={() => setFilter('cleaners')}
        >
          Cleaners ({favorites.filter(f => f.type === 'cleaner').length})
        </button>
        <button 
          className={`tab-btn ${filter === 'services' ? 'active' : ''}`}
          onClick={() => setFilter('services')}
        >
          Services ({favorites.filter(f => f.type === 'service').length})
        </button>
      </div>

      {/* Favorites Grid */}
      <div className="favorites-grid">
        {filteredFavorites.length === 0 ? (
          <div className="empty-state">
            <HeartOutlined className="empty-icon" />
            <h3>No favorites yet</h3>
            <p>Start adding cleaners and services to your favorites</p>
            <button className="browse-btn">Browse Services</button>
          </div>
        ) : (
          filteredFavorites.map(item => (
            <div key={item.id} className="favorite-card">
              <button 
                className="remove-btn"
                onClick={() => handleRemoveFavorite(item.id)}
              >
                <DeleteOutlined />
              </button>

              {item.type === 'cleaner' ? (
                // Cleaner Card
                <div className="cleaner-card">
                  <div className="cleaner-avatar">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="cleaner-info">
                    <h3>{item.name}</h3>
                    <div className="cleaner-rating">
                      <StarOutlined /> {item.rating} ({item.jobs} jobs)
                    </div>
                    <p className="cleaner-specialty">{item.specialty}</p>
                    <p className="cleaner-location">
                      <EnvironmentOutlined /> {item.location}
                    </p>
                  </div>
                  <button className="view-profile-btn">View Profile</button>
                </div>
              ) : (
                // Service Card
                <div className="service-card">
                  <h3>{item.name}</h3>
                  <p className="service-description">{item.description}</p>
                  <div className="service-meta">
                    <span className="service-price">${item.price}</span>
                    <span className="service-duration">{item.duration}</span>
                  </div>
                  <button className="book-now-btn">Book Now</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Recently Viewed Section */}
      {favorites.length > 0 && (
        <div className="recently-viewed">
          <h2>Recently Viewed</h2>
          <div className="recent-grid">
            <div className="recent-item">
              <p>Carpet Cleaning</p>
              <small>Viewed 2 days ago</small>
            </div>
            <div className="recent-item">
              <p>John's Cleaning</p>
              <small>Viewed 3 days ago</small>
            </div>
            <div className="recent-item">
              <p>Move-Out Service</p>
              <small>Viewed 5 days ago</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavouritePage; // <-- THIS IS CRITICAL!