import React, { useEffect, useState } from 'react';
import Header from './admin_header';
import Sidebar from './admin_sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from "../../../contexts/theme_context";
import '../../../styles/admin/admin_main_layout.css';
import Footer from './admin_footer';

const AdminMainLayout = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const [isCompactLayout, setIsCompactLayout] = useState(window.innerWidth <= 1200);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1200);

  useEffect(() => {
    const handleResize = () => {
      const compact = window.innerWidth <= 1200;
      setIsCompactLayout(compact);
      setSidebarOpen(!compact);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isCompactLayout) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isCompactLayout]);
  
  return (
    <div className={`admin-layout ${darkMode ? 'dark' : ''} ${isCompactLayout ? 'compact-layout' : ''}`}>
      {/* Sidebar - fixed on left */}
      <Sidebar isCompact={isCompactLayout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {isCompactLayout && sidebarOpen && <div className="layout-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      
      {/* Main content area - everything on the right */}
      <div className="admin-right">
        {isCompactLayout && (
          <button className="layout-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            {sidebarOpen ? 'X' : '|||'}
          </button>
        )}
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


