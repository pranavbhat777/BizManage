import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './components/Sidebar';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Overtime from './pages/Overtime';
import Advances from './pages/Advances';
import Payroll from './pages/Payroll';
import Products from './pages/Products';
import Cashbook from './pages/Cashbook';
import Insurance from './pages/Insurance';
import Login from './pages/Login';
import TopBar from './components/TopBar';
import { AuthProvider } from './contexts/AuthContext';
import { isCapacitorApp } from './utils/api';

const drawerWidth = 250; // Expanded width for desktop
const collapsedWidth = 70; // Collapsed width for desktop

function App() {
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile drawer state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapse state
  const location = useLocation();
  const navigate = useNavigate();

  // Handle deep linking for mobile app
  useEffect(() => {
    // Handle deep links from mobile app
    const handleDeepLink = (path) => {
      console.log('🔗 Deep link received:', path);
      // Navigate to the deep link path
      if (path && path.startsWith('/')) {
        navigate(path);
      }
    };

    // Handle app links from mobile app
    const handleAppLink = (path) => {
      console.log('🌐 App link received:', path);
      // Navigate to the app link path
      if (path && path.startsWith('/')) {
        navigate(path);
      }
    };

    // Make functions available globally for mobile app
    if (isCapacitorApp()) {
      window.handleDeepLink = handleDeepLink;
      window.handleAppLink = handleAppLink;
      
      // Check for initial deep link on app start
      const urlParams = new URLSearchParams(window.location.search);
      const deepLinkPath = urlParams.get('deep_link');
      if (deepLinkPath) {
        handleDeepLink(deepLinkPath);
      }
    }

    return () => {
      // Cleanup global functions
      if (window.handleDeepLink) {
        delete window.handleDeepLink;
      }
      if (window.handleAppLink) {
        delete window.handleAppLink;
      }
    };
  }, [navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <AppContent 
            mobileOpen={mobileOpen}
            handleDrawerToggle={handleDrawerToggle}
            handleSidebarToggle={handleSidebarToggle}
            handleDrawerClose={handleDrawerClose}
            sidebarCollapsed={sidebarCollapsed}
            drawerWidth={drawerWidth}
            collapsedWidth={collapsedWidth}
            location={location}
          />
        } />
      </Routes>
    </AuthProvider>
  );
}

function AppContent({ mobileOpen, handleDrawerToggle, handleSidebarToggle, handleDrawerClose, sidebarCollapsed, drawerWidth, collapsedWidth, location }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      <TopBar
        title={getPageTitle(location.pathname)}
        handleDrawerToggle={handleDrawerToggle}
        handleSidebarToggle={isMobile ? null : handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
      />
      <Sidebar
        drawerWidth={drawerWidth}
        collapsedWidth={collapsedWidth}
        mobileOpen={mobileOpen}
        sidebarCollapsed={isMobile ? false : sidebarCollapsed}
        handleDrawerToggle={handleDrawerToggle}
        handleDrawerClose={handleDrawerClose}
        isMobile={isMobile}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          pt: { xs: 1, sm: 2, md: 3 },
          pb: { xs: 1, sm: 2, md: 3 },
          pl: { xs: 1, sm: 2, md: 3, lg: 4 },
          pr: { xs: 1, sm: 2, md: 3, lg: 4 },
          width: isMobile 
            ? '100%' 
            : `calc(100% - ${sidebarCollapsed ? collapsedWidth : drawerWidth}px)`,
          transition: 'width 0.3s ease',
          marginTop: '64px',
          minHeight: 'calc(100vh - 64px)',
          overflowX: 'auto',
          overflowY: 'auto',
          backgroundColor: '#f5f5f5',
          position: 'relative'
        }}
      >
        <Box sx={{ 
          maxWidth: { xs: '100%', sm: '100%', md: '1200px' },
          margin: '0 auto',
          width: '100%'
        }}>
          <Routes>
            <Route path="/" element={<Employees />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/overtime" element={<Overtime />} />
            <Route path="/advances" element={<Advances />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cashbook" element={<Cashbook />} />
            <Route path="/insurance" element={<Insurance />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

// Helper function to get page title based on path
function getPageTitle(pathname) {
  switch (pathname) {
    case '/':
      return 'Dashboard';
    case '/employees':
      return 'Employee Management';
    case '/attendance':
      return 'Attendance';
    case '/overtime':
      return 'Overtime Management';
    case '/advances':
      return 'Advance Payments';
    case '/payroll':
      return 'Payroll';
    case '/insurance':
      return 'Insurance Management';
    default:
      return 'Business Management';
  }
}

export default App;
