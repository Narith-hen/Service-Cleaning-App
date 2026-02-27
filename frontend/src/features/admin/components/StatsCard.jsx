import React from 'react';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import './StatsCard.scss';

const StatsCard = ({ 
  icon, 
  title, 
  value, 
  trend, 
  trendValue, 
  color = 'blue',
  onClick 
}) => {
  return (
    <div className={`stats-card stats-card-${color}`} onClick={onClick}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <span className="stats-title">{title}</span>
        <span className="stats-value">{value}</span>
        {trend && (
          <div className={`stats-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? <RiseOutlined /> : <FallOutlined />}
            <span>{Math.abs(trendValue)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;