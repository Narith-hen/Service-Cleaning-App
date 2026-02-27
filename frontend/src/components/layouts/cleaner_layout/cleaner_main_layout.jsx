import React from 'react';
import Header from './cleaner_header';
import Sidebar from './cleaner_sidebar';
import { Outlet } from 'react-router-dom';
import { useTheme } from "../../../contexts/theme_context";
import '../../../styles/cleaner/cleaner_main_layout.css';
import Footer from '../admin_layout/admin_footer';

const AdminMainLayout = () => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`admin-layout ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar - fixed on left */}
      <Sidebar />
      
      {/* Main content area - everything on the right */}
      <div className="admin-right">
        <Header />
        <main className="admin-content">
          <Outlet />
        </main>
        <Footer />
      </div>


    </div>

  );
};

export default AdminMainLayout;