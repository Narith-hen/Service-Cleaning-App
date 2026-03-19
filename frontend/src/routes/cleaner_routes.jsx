import React from 'react';
import { Navigate } from 'react-router-dom';
import CleanerLayout from '../components/layouts/cleaner_layout/cleaner_main_layout';
import ProtectedRoute from './protected_routes';

// Import from features/cleaner/pages (not from pages/cleaner)
import CleanerDashboard from '../features/cleaner/pages/dashboard_page';
import CleanerTasks from '../features/cleaner/pages/job_requests_page';
import CleanerSchedule from '../features/cleaner/pages/schedule_page';
import MyJobsPage from '../features/cleaner/pages/my_jobs_page';
import CleanerEarnings from '../features/cleaner/pages/earnings_page';
import CleanerAvailability from '../features/cleaner/pages/availability_page';
import CleanerReviews from '../features/cleaner/pages/review_page';
import CleanerNotifications from '../features/cleaner/pages/notification_page';
import CleanerMessages from '../features/cleaner/pages/messages_page';
import SettingsPage from '../features/cleaner/pages/settings_page';
import HelpPage from '../features/cleaner/pages/help_page';
import JobExecutionPage from '../features/cleaner/pages/job_execution_page';
import CancelDuringWorkPage from '../features/cleaner/pages/Cancel-during-work';

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
      path: 'job-requests',
      element: <CleanerTasks />
    },
    {
      path: 'tasks/upcoming',
      element: <CleanerTasks />
    },
    {
      path: 'tasks/completed',
      element: <Navigate to="/cleaner/my-jobs" replace />
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
      path: 'my-jobs',
      element: <MyJobsPage />
    },
    {
      path: 'messages',
      element: <CleanerMessages />
    },
    {
      path: 'job-execution',
      element: <JobExecutionPage />
    },
    {
      path: 'cancel-during-work',
      element: <CancelDuringWorkPage />
    },
    {
      path: 'cancel-during-work/:jobId',
      element: <CancelDuringWorkPage />
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
      element: <Navigate to="/cleaner/settings" replace />
    },
    {
      path: 'profile/edit',
      element: <Navigate to="/cleaner/settings" replace />
    },
    {
      path: 'profile/documents',
      element: <Navigate to="/cleaner/settings" replace />
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
