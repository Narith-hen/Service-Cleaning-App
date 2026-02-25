import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/MainLayout'; // Import MainLayout

// Cleaner Pages
import CleanerDashboardPage from '../pages/cleaner/CleanerDashboardPage';
import JobsPage from '../pages/cleaner/JobsPage';
import SchedulePage from '../pages/cleaner/SchedulePage';
import EarningsPage from '../pages/cleaner/EarningsPage';
import CleanerProfilePage from '../pages/cleaner/ProfilePage';

const CleanerRoutes = () => {
  return (
    <MainLayout> {/* Wrap with MainLayout */}
      <Routes>
        <Route path="/" element={<CleanerDashboardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/earnings" element={<EarningsPage />} />
        <Route path="/profile" element={<CleanerProfilePage />} />
      </Routes>
    </MainLayout>
  );
};

export default CleanerRoutes;