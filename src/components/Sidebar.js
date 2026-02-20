import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as AttendanceIcon,
  AccessTime as OvertimeIcon,
  AccountBalanceWallet as AdvancesIcon,
  Payment as PayrollIcon,
  CreditCard as SubscriptionIcon,
  Inventory as ProductsIcon,
  AccountBalance as CashbookIcon,
  Security as InsuranceIcon,
} from '@mui/icons-material';

const menuSections = [
  {
    title: 'STAFF MANAGEMENT',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
      { text: 'Attendance', icon: <AttendanceIcon />, path: '/attendance' },
      { text: 'Overtime', icon: <OvertimeIcon />, path: '/overtime' },
      { text: 'Advances', icon: <AdvancesIcon />, path: '/advances' },
      { text: 'Payroll', icon: <PayrollIcon />, path: '/payroll' },
    ]
  },
  {
    title: 'BUSINESS & ACCOUNTS',
    items: [
      { text: 'Subscriptions', icon: <SubscriptionIcon />, path: '/subscriptions' },
      { text: 'Products', icon: <ProductsIcon />, path: '/products' },
      { text: 'Cashbook', icon: <CashbookIcon />, path: '/cashbook' },
      { text: 'Insurance', icon: <InsuranceIcon />, path: '/insurance' },
    ]
  }
];

const Sidebar = ({ drawerWidth, collapsedWidth, mobileOpen, sidebarCollapsed, handleDrawerToggle, handleDrawerClose, isMobile }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (path) => {
    navigate(path);
    // Close mobile drawer after navigation
    if (isMobile) {
      handleDrawerClose();
    }
  };

  const drawer = (
    <div>
      <Box sx={{ p: (isMobile || sidebarCollapsed) ? 1 : { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
        {!(isMobile || sidebarCollapsed) && (
          <Typography variant="h6" noWrap component="div" sx={{ 
            fontSize: { xs: '0.9rem', sm: '1rem' },
            fontWeight: 'bold',
            color: theme.palette.primary.main
          }}>
            BizManage
          </Typography>
        )}
        {(isMobile || sidebarCollapsed) && (
          <Typography variant="h6" noWrap component="div" sx={{ 
            fontSize: '1rem',
            fontWeight: 'bold',
            color: theme.palette.primary.main
          }}>
            BM
          </Typography>
        )}
      </Box>
      <Divider />
      {menuSections.map((section) => (
        <div key={section.title}>
          <Box sx={{ p: (isMobile || sidebarCollapsed) ? 0.5 : { xs: 1, sm: 1.5 }, textAlign: 'center' }}>
            {!(isMobile || sidebarCollapsed) && (
              <Typography variant="subtitle2" noWrap component="div" sx={{ 
                fontWeight: 'bold', 
                color: theme.palette.primary.main,
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.85rem' },
                letterSpacing: '0.3px',
                lineHeight: 1.3
              }}>
                {section.title}
              </Typography>
            )}
          </Box>
          <List sx={{ px: (isMobile || sidebarCollapsed) ? 0.5 : { xs: 0.5, sm: 1 } }}>
            {section.items.map((item) => (
              <Tooltip 
                key={item.text} 
                title={item.text} 
                placement="right" 
                arrow
                disableHoverListener={!isMobile && !sidebarCollapsed}
              >
                <ListItem
                  button
                  onClick={() => handleItemClick(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.action.selected,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                    minHeight: { xs: '44px', sm: '48px', md: '52px' },
                    px: (isMobile || sidebarCollapsed) ? 0.5 : { xs: 0.5, sm: 1, md: 1.5 },
                    py: { xs: 0.5, sm: 0.75, md: 1 },
                    mb: { xs: 0.25, sm: 0.5 },
                    justifyContent: (isMobile || sidebarCollapsed) ? 'center' : 'flex-start'
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: theme.palette.primary.main,
                    minWidth: (isMobile || sidebarCollapsed) ? 'auto' : { xs: '28px', sm: '32px', md: '40px' },
                    mr: (isMobile || sidebarCollapsed) ? 0 : 1,
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={sidebarCollapsed ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 500, writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                          {item.text.charAt(0)}
                        </Typography>
                      </Box>
                    ) : item.text} 
                    primaryTypographyProps={{
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                      fontWeight: 500,
                      lineHeight: 1.2
                    }}
                  />
                </ListItem>
              </Tooltip>
            ))}
          </List>
          <Divider />
        </div>
      ))}
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: isMobile ? 0 : (sidebarCollapsed ? collapsedWidth : drawerWidth) }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile Drawer - Slide-in overlay */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop Drawer - Fixed sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: sidebarCollapsed ? collapsedWidth : drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              position: 'relative',
              height: '100vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              transition: 'width 0.3s ease',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
