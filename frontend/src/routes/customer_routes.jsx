import React from 'react';
import { Navigate } from 'react-router-dom';
import CustomerLayout from '../components/layouts/customer_layout/customer_main_layout';
import ProtectedRoute from './protected_routes';

// Import from features/customer/pages (not from pages/customer)
import CustomerDashboard from '../features/customer/pages/customer_home_page';
import CustomerBookings from '../features/customer/pages/booking_page';
import CustomerProfile from '../features/customer/pages/profile_page';
import CustomerPaymentMethods from '../features/customer/pages/payment_method_page';
import CustomerFavorites from '../features/customer/pages/favourite_page';
import CustomerNotifications from '../features/customer/pages/notification_page';
import WriteReviewPage from '../features/customer/pages/write_review_page';
import SettingsPage from '../features/customer/pages/setting_page';
import BookingMatchPage from '../features/customer/pages/booking_match_page';
import BookingQuotesPage from '../features/customer/pages/booking_quotes_page';
import CustomerChatPage from '../features/customer/pages/chat_page';
import CustomerAboutPage from '../features/public/pages/about_page';
import CustomerServicesPage from '../features/public/pages/services_page';
import CustomerContactPage from '../features/public/pages/contact_page';
import ErrorBoundary from '../components/common/error_boundary';

export const customerRoutes = {
  path: '/customer',
  element: (
    <ProtectedRoute allowedRoles={['customer']}>
      <CustomerLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <Navigate to="dashboard" replace />
    },
    {
      path: 'home',
      element: <Navigate to="/customer/dashboard" replace />
    },
    {
      path: 'dashboard',
      element: <CustomerDashboard />
    },
    {
      path: 'services',
      element: <CustomerServicesPage />
    },
    {
      path: 'bookings',
      element: (
        <ErrorBoundary fallbackTitle="Booking page failed to load.">
          <CustomerBookings />
        </ErrorBoundary>
      )
    },
    {
      path: 'bookings/matching',
      element: (
        <ErrorBoundary fallbackTitle="Matching page failed to load.">
          <BookingMatchPage />
        </ErrorBoundary>
      )
    },
    {
      path: 'bookings/quotes',
      element: (
        <ErrorBoundary fallbackTitle="Quotes page failed to load.">
          <BookingQuotesPage />
        </ErrorBoundary>
      )
    },
    {
      path: 'bookings/:bookingId',
      element: (
        <ErrorBoundary fallbackTitle="Booking page failed to load.">
          <CustomerBookings />
        </ErrorBoundary>
      )
    },
    {
      path: 'chat',
      element: <CustomerChatPage />
    },
    {
      path: 'messages',
      element: <CustomerAboutPage />
    },
    {
      path: 'profile',
      element: <CustomerProfile />
    },
    {
      path: 'profile/edit',
      element: <CustomerProfile />
    },
    {
      path: 'payment-methods',
      element: <CustomerPaymentMethods />
    },
    {
      path: 'payment-methods/add',
      element: <CustomerPaymentMethods />
    },
    {
      path: 'favorites',
      element: <CustomerFavorites />
    },
    {
      path: 'favorites/cleaners',
      element: <CustomerFavorites />
    },
    {
      path: 'favorites/services',
      element: <CustomerFavorites />
    },
    {
      path: 'notifications',
      element: <CustomerNotifications />
    },
    {
      path: 'notifications/:notificationId',
      element: <CustomerNotifications />
    },
    {
      path: 'write-review',
      element: <WriteReviewPage />
    },
    {
      path: 'write-review/:bookingId',
      element: <WriteReviewPage />
    },
    {
      path: 'settings',
      element: <SettingsPage />
    },
    {
      path: 'settings/notifications',
      element: <SettingsPage />
    },
    {
      path: 'settings/privacy',
      element: <SettingsPage />
    },
    {
      path: 'help',
      element: <div>Customer Help Page</div> // This would also be moved to features/customer/pages/HelpPage.jsx
    },
    {
      path: 'help/faq',
      element: <div>Customer FAQ</div>
    },
    {
      path: 'help/contact',
      element: <CustomerContactPage />
    },
    {
      path: 'contact',
      element: <CustomerContactPage />
    }
  ]
};
