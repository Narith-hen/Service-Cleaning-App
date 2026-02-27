import React from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '../components/layouts/customer_layout/customer_main_layout';
import PublicHomePage from '../features/public/pages/home_page';
import ServicesPage from '../features/public/pages/services_page';
import AboutPage from '../features/public/pages/about_page';
import ContactPage from '../features/public/pages/contact_page';
import LoginPage from '../features/public/pages/login_page';
import RegisterPage from '../features/public/pages/register_page';
import NotFoundPage from '../features/public/pages/notfound_page';
export const publicRoutes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <PublicHomePage />
      },
      {
        path: 'services',
        element: <ServicesPage />
      },
      {
        path: 'about',
        element: <AboutPage />
      },
      {
        path: 'contact',
        element: <ContactPage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  },
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'register',
        element: <RegisterPage />
      },
      {
        path: '',
        element: <Navigate to="/auth/login" replace />
      }
    ]
  }
];