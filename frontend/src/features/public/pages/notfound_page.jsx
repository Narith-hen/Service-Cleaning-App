import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined, ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import '../../../styles/public/notfound.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Animated 404 Number */}
        <div className="error-code">
          <span className="digit">4</span>
          <span className="digit zero">0</span>
          <span className="digit">4</span>
        </div>

        {/* Icon */}
        <div className="error-icon">
          <QuestionCircleOutlined />
        </div>

        {/* Error Message */}
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftOutlined /> Go Back
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            <HomeOutlined /> Back to Home
          </button>
        </div>

        {/* Help Text */}
        <p className="help-text">
          Need assistance? <a href="/contact">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;