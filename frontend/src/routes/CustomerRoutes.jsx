import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/customerLayout/Layout'; // Import MainLayout

// Customer Pages
import CustomerHomePage from '../pages/customer/CustomerHomePage';
import SearchPage from '../pages/customer/SearchPage';
import BookingPage from '../pages/customer/BookingPage';
import MyBookingsPage from '../pages/customer/MyBookingsPage';
import FavoritesPage from '../pages/customer/FavoritesPage';

const CustomerRoutes = () => {
  return (
    <MainLayout> {/* Wrap with MainLayout */}
      <Routes>
        <Route path="/" element={<CustomerHomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/book/:cleanerId" element={<BookingPage />} />
        <Route path="/bookings" element={<MyBookingsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Routes>
    </MainLayout>
  );
};

export default CustomerRoutes;