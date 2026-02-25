import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/MainLayout'; // Import MainLayout

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import BookingsPage from '../pages/admin/BookingsPage';
import SettingsPage from '../pages/admin/SettingsPage';

const AdminRoutes = () => {
  return (
    <MainLayout> {/* Wrap with MainLayout */}
      <Routes>
        <Route path="/" element={<AdminDashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MainLayout>
  );
};

export default AdminRoutes;