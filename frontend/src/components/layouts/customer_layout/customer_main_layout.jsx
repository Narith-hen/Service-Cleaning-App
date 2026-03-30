import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ModernResponsiveNavbar from './navbar';
import Footer from './footer';
import { Drawer } from 'antd';
import Sidebar from './sidebar'; 
import '../../../styles/customer/customer_main_layout.css'; 
import useCustomerPageMotion from '../../../features/customer/hooks/useCustomerPageMotion';

const TARGET_SCREEN_BREAKPOINT = 992;

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isCustomerArea = location.pathname.startsWith('/customer');
  const isCustomerDashboard =
    location.pathname === '/customer/dashboard' || location.pathname === '/customer/home';
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window === 'undefined' ? TARGET_SCREEN_BREAKPOINT : window.innerWidth
  ));
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mainContentRef = React.useRef(null);
  const scrollFrameRef = React.useRef(null);
  const resizeFrameRef = React.useRef(null);
  const scrolledRef = React.useRef(false);
  const viewportWidthRef = React.useRef(
    typeof window === 'undefined' ? TARGET_SCREEN_BREAKPOINT : window.innerWidth
  );
  const drawerWidth = viewportWidth < 576 ? '100%' : viewportWidth <= TARGET_SCREEN_BREAKPOINT ? 380 : 420;
  const resolvedDrawerWidth = viewportWidth < 576
    ? '100%'
    : viewportWidth < 768
      ? 'min(94vw, 360px)'
      : viewportWidth <= TARGET_SCREEN_BREAKPOINT
        ? 'min(86vw, 390px)'
        : drawerWidth;
  const headerOffset = isCustomerDashboard ? 0 : viewportWidth < 576 ? 74 : viewportWidth < 992 ? 82 : 90;
  const motionReady = useCustomerPageMotion(mainContentRef, isCustomerArea, [location.pathname]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (scrollFrameRef.current != null) return;

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        const nextScrolled = window.scrollY > 10;
        if (scrolledRef.current === nextScrolled) return;
        scrolledRef.current = nextScrolled;
        setScrolled(nextScrolled);
      });
    };
    const handleResize = () => {
      if (resizeFrameRef.current != null) return;

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        const nextWidth = window.innerWidth;
        if (viewportWidthRef.current === nextWidth) return;
        viewportWidthRef.current = nextWidth;
        setViewportWidth(nextWidth);
      });
    };
    handleScroll();
    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollFrameRef.current != null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
      if (resizeFrameRef.current != null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div
      className={`layout-root ${isCustomerArea ? 'customer-motion-scope' : ''} ${motionReady ? 'customer-motion-ready' : ''}`}
      style={{ width: '100%', minHeight: '100vh', margin: 0, padding: 0 }}
    >

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
      
      <main
        ref={mainContentRef}
        className="main-contents"
        style={{ 
        width: '100%', 
        flex: 1,
        background: darkMode ? '#0b1220' : 'white',
        minHeight: 'calc(100vh - 140px)',
        paddingTop: headerOffset
      }}
      >
        <Outlet context={{ darkMode }} />
      </main>
      
      <Drawer
        placement="right"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        size="default"
        closable={false}
        styles={{
          body: { padding: 0 },
          header: { display: 'none' },
          section: { width: resolvedDrawerWidth, maxWidth: '100vw' },
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
