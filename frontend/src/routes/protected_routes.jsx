import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const getDashboardPath = (role) => {
  switch (String(role || '').toLowerCase()) {
    case 'customer':
      return '/customer/dashboard';
    case 'cleaner':
      return '/cleaner/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const userRole = String(user?.role || '').toLowerCase();

  if (loading) {
    return null;
  }

  if (!isAuthenticated || !userRole) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
        replace
      />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  return children;
};

export const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return <Navigate to={getDashboardPath(user?.role)} replace />;
};

export default ProtectedRoute;
