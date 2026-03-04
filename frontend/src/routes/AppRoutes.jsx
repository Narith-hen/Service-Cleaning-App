import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import PrivateRoute from './PrivateRoute';

// Import role-specific route components
import CustomerRoutes from './CustomerRoutes';
import CleanerRoutes from './CleanerRoutes';
import AdminRoutes from './AdminRoutes';

// Auth Pages (public)
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';

// Public Customer Pages
import HomePage from '../pages/public/HomePage';
import ServicesPage from '../pages/public/ServicesPage';
import AboutPage from '../pages/public/AboutPage';
import ContactPage from '../pages/public/ContactPage';

const AppRoutes = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={
          !user ? <LoginPage /> : <Navigate to={`/${role}`} replace />
        } />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route path="/customer/*" element={
          <PrivateRoute allowedRoles={['customer']}>
            <CustomerRoutes />
          </PrivateRoute>
        } />
        <Route path="/cleaner/*" element={
          <PrivateRoute allowedRoles={['cleaner']}>
            <CleanerRoutes />
          </PrivateRoute>
        } />
        <Route path="/admin/*" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminRoutes />
          </PrivateRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes; // <-- THIS MUST BE AT THE BOTTOM
