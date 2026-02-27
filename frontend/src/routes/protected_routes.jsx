import React from 'react';
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = true;
  // const userRole = 'customer'; 
  const userRole = allowedRoles.length > 0 ? allowedRoles[0] : null; 
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: window.location.pathname }} replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (userRole === 'cleaner') return <Navigate to="/cleaner/dashboard" replace />;
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export const RoleBasedRedirect = () => {
  const userRole = 'customer'; 
  
  switch(userRole) {
    case 'customer':
      return <Navigate to="/customer/dashboard" replace />;
    case 'cleaner':
      return <Navigate to="/cleaner/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;