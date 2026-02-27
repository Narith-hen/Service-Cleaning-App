import { Navigate } from 'react-router-dom';
import AdminLayout from "../components/layouts/admin_layout/admin_main_layout";
import ProtectedRoute from "./protected_routes.jsx";

// Import from features/admin/pages (not from pages/admin)
import AdminDashboard from "../features/admin/pages/dashboard_page";
import AdminUsers from "../features/admin/pages/users_page";
import AdminCleaners from "../features/admin/pages/cleaners_page";
import AdminCustomers from "../features/admin/pages/customers_page";
import AdminServices from "../features/admin/pages/services_page";
import AdminBookings from "../features/admin/pages/bookings_page";
import AdminReviews from "../features/admin/pages/reviews_page";
import AdminPayments from "../features/admin/pages/payments_page";
import AdminReports from "../features/admin/pages/reports_page";
import AdminAnalytics from "../features/admin/pages/analytics_page";
import AdminSettings from "../features/admin/pages/settings_page";

export const adminRoutes = {
  path: '/admin',
  element: (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <Navigate to="dashboard" replace />
    },
    {
      path: 'dashboard',
      element: <AdminDashboard />
    },
    {
      path: 'users',
      element: <AdminUsers />
    },
    {
      path: 'cleaners',
      element: <AdminCleaners />
    },
    {
      path: 'customers',
      element: <AdminCustomers />
    },
    {
      path: 'services',
      element: <AdminServices />
    },
    {
      path: 'bookings',
      element: <AdminBookings />
    },
    {
      path: 'reviews',
      element: <AdminReviews />
    },
    {
      path: 'payments',
      element: <AdminPayments />
    },
    {
      path: 'reports',
      element: <AdminReports />
    },
    {
      path: 'analytics',
      element: <AdminAnalytics />
    },
    {
      path: 'settings',
      element: <AdminSettings />
    },
    {
      path: 'settings/general',
      element: <AdminSettings />
    },
    {
      path: 'settings/payment',
      element: <AdminSettings />
    },
    {
      path: 'settings/email',
      element: <AdminSettings />
    }
  ]
};