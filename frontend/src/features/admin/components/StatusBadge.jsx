import React from 'react';
import './StatusBadge.scss';

const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusClass = () => {
    switch(status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'approved':
        return 'success';
      case 'pending':
      case 'scheduled':
        return 'warning';
      case 'inactive':
      case 'cancelled':
      case 'rejected':
        return 'danger';
      case 'in-progress':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <span className={`status-badge status-${getStatusClass()} ${type}`}>
      {status}
    </span>
  );
};

export default StatusBadge;