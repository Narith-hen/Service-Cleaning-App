import React from 'react';
import Header from './admin_header';
import Sidebar from './admin_sidebar';
import { Outlet } from 'react-router-dom';
import { useTheme } from "../../../contexts/theme_context";
import '../../../styles/admin/admin_main_layout.css';
import Footer from './admin_footer';

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