import { publicRoutes } from './public_routes';
import { customerRoutes } from './customer_routes';
import { cleanerRoutes } from './cleaner_routes';
import { adminRoutes } from './admin_routes';
import { RoleBasedRedirect } from './protected_routes';

// Combine all routes
export const routes = [
  ...publicRoutes,
  customerRoutes,
  cleanerRoutes,
  adminRoutes,
  {
    path: '/dashboard',
    element: <RoleBasedRedirect />
  },
  {
    path: '/profile',
    element: <RoleBasedRedirect />
  }
];

// Helper function to render routes
export const renderRoutes = (routes) => {
  return routes.map((route, index) => ({
    ...route,
    key: index
  }));
};

// Re-export route constants
export { ROUTES } from './constant_routes';