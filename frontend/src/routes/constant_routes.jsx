// Path constants for easy navigation
export const ROUTES = {
  // Public routes
  HOME: '/',
  REVIEWS: '/reviews',
  SERVICES: '/services',
  ABOUT: '/about',
  CONTACT: '/contact',
  WRITE_REVIEW: '/write-review',
  SETTINGS: '/settings',
  NOT_FOUND: '/404',
  
  // Auth routes
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  
  // Customer routes
  CUSTOMER: {
    DASHBOARD: '/customer/dashboard',
    BOOKINGS: '/customer/bookings',
    BOOKING_DETAILS: (id) => `/customer/bookings/${id}`,
    PROFILE: '/customer/profile',
    PAYMENT_METHODS: '/customer/payment-methods',
    FAVORITES: '/customer/favorites',
    NOTIFICATIONS: '/customer/notifications'
  },
  
  // Cleaner routes
  CLEANER: {
    DASHBOARD: '/cleaner/dashboard',
    TASKS: '/cleaner/tasks',
    TASK_DETAILS: (id) => `/cleaner/tasks/${id}`,
    SCHEDULE: '/cleaner/schedule',
    AVAILABILITY: '/cleaner/availability',
    EARNINGS: '/cleaner/earnings',
    PROFILE: '/cleaner/profile',
    REVIEWS: '/cleaner/reviews'
  },
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    ANALYTICS: '/admin/analytics',
    USERS: '/admin/users',
    CUSTOMERS: '/admin/customers',
    CLEANERS: '/admin/cleaners',
    SERVICES: '/admin/services',
    BOOKINGS: '/admin/bookings',
    REVIEWS: '/admin/reviews',
    PAYMENTS: '/admin/payments',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings'
  }
};