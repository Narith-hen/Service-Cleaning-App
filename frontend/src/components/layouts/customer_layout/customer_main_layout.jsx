import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ModernResponsiveNavbar from './navbar';
import Footer from './footer';
import { Drawer } from 'antd';
import Sidebar from './sidebar'; 
import '../../../styles/customer/customer_main_layout.css'; 

const TARGET_SCREEN_BREAKPOINT = 1280;

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isCustomerDashboard =
    location.pathname === '/customer/dashboard' || location.pathname === '/customer/home';
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="layout-root" style={{ width: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>

      {isHome && (
        <div 
          className="cny-fixed-bg"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -1
          }}
        />
      )}

      <header
        className="main-header"
        style={{
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}
      >
        <ModernResponsiveNavbar 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          navigate={navigate}
          scrolled={scrolled}
          setMobileOpen={setMobileOpen}
        />
      </header>
      
      <main className="main-contents" style={{ 
        width: '100%', 
        flex: 1,
        background: darkMode ? '#0b1220' : 'white',
        minHeight: 'calc(100vh - 140px)',
        paddingTop: isCustomerDashboard ? 0 : 90
      }}>
        <Outlet context={{ darkMode }} />
      </main>
      
      <Drawer
        placement="right"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        width={viewportWidth < 576 ? '100%' : viewportWidth <= TARGET_SCREEN_BREAKPOINT ? 380 : 420}
        closable={false}
        styles={{
          body: { padding: 0 },
          header: { display: 'none' },
          mask: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)'
          }
        }}
      >
        <Sidebar 
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          currentPath={location.pathname}
          onNavigate={handleNavigation}
          darkMode={darkMode}
        />
      </Drawer>
      
      <Footer />
    </div>
  );
};

export default MainLayout;
