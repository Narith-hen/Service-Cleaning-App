import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ModernResponsiveNavbar from './navbar';
import Footer from './footer';
import SeoMeta from './seo_meta';
import { Drawer } from 'antd';
import Sidebar from './Sidebar'; 
import '../../../styles/customer/customer_main_layout.css'; 

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const cnyBackground = 'https://i.pinimg.com/736x/ae/1f/51/ae1f51ece38212edf8e3d87b6b1daaf6.jpg';
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

      <header className="main-header" style={{ width: '100%' }}>
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
        background: "white",
        minHeight: 'calc(100vh - 140px)'
      }}>
        <Outlet />
      </main>
      
      <Drawer
        placement="right"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        size="medium"
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