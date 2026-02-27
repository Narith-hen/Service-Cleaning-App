import React from 'react';
import { Navigate } from 'react-router-dom';
import CleanerLayout from '../components/layouts/cleaner_layout/cleaner_main_layout';
import ProtectedRoute from './protected_routes';

// Import from features/cleaner/pages (not from pages/cleaner)
import CleanerDashboard from '../features/cleaner/pages/dashboard_page';
import CleanerTasks from '../features/cleaner/pages/job_requests_page';
import CleanerSchedule from '../features/cleaner/pages/schedule_page';
import CleanerEarnings from '../features/cleaner/pages/earnings_page';
import CleanerProfile from '../features/cleaner/pages/profile_page';
import CleanerAvailability from '../features/cleaner/pages/availability_page';
import CleanerReviews from '../features/cleaner/pages/review_page';
import CleanerNotifications from '../features/cleaner/pages/notification_page';
import SettingsPage from '../features/cleaner/pages/settings_page';
import HelpPage from '../features/cleaner/pages/help_page';

export const cleanerRoutes = {
  path: '/cleaner',
  element: (
    <ProtectedRoute allowedRoles={['cleaner']}>
      <CleanerLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <Navigate to="dashboard" replace />
    },
    {
      path: 'dashboard',
      element: <CleanerDashboard />
    },
    {
      path: 'tasks',
      element: <CleanerTasks />
    },
    {
      path: 'tasks/upcoming',
      element: <CleanerTasks />
    },
    {
      path: 'tasks/completed',
      element: <CleanerTasks />
    },
    {
      path: 'tasks/:taskId',
      element: <CleanerTasks />
    },
    {
      path: 'tasks/:taskId/details',
      element: <CleanerTasks />
    },
    {
      path: 'schedule',
      element: <CleanerSchedule />
    },
    {
      path: 'schedule/weekly',
      element: <CleanerSchedule />
    },
    {
      path: 'schedule/monthly',
      element: <CleanerSchedule />
    },
    {
      path: 'availability',
      element: <CleanerAvailability />
    },
    {
      path: 'availability/set',
      element: <CleanerAvailability />
    },
    {
      path: 'earnings',
      element: <CleanerEarnings />
    },
    {
      path: 'earnings/summary',
      element: <CleanerEarnings />
    },
    {
      path: 'earnings/payouts',
      element: <CleanerEarnings />
    },
    {
      path: 'earnings/payouts/:payoutId',
      element: <CleanerEarnings />
    },
    {
      path: 'profile',
      element: <CleanerProfile />
    },
    {
      path: 'profile/edit',
      element: <CleanerProfile />
    },
    {
      path: 'profile/documents',
      element: <CleanerProfile />
    },
    {
      path: 'reviews',
      element: <CleanerReviews />
    },
    {
      path: 'reviews/:reviewId',
      element: <CleanerReviews />
    },
    {
      path: 'notifications',
      element: <CleanerNotifications />
    },
    {
      path: 'notifications/:notificationId',
      element: <CleanerNotifications />
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
      path: 'settings/payment',
      element: <SettingsPage />
    },
    {
      path: 'settings/privacy',
      element: <SettingsPage />
    },
    {
      path: 'help',
      element: <HelpPage />
    },
    {
      path: 'help/faq',
      element: <HelpPage />
    },
    {
      path: 'help/contact',
      element: <HelpPage />
    },
    {
      path: 'help/training',
      element: <HelpPage />
    }
  ]
};