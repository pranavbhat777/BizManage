import React from 'react';
import { useTheme } from '@mui/material/styles';
import { AppBar, Toolbar, IconButton, Typography, Badge, Box, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Logout from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';

const TopBar = ({ title, handleDrawerToggle, handleSidebarToggle, sidebarCollapsed, isMobile: isMobileProp }) => {
  const { business, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: isMobileProp ? '100%' : `calc(100% - ${sidebarCollapsed ? 70 : 250}px)`,
        ml: isMobileProp ? 0 : (sidebarCollapsed ? 70 : 250),
        boxShadow: 'none',
        backgroundColor: 'white',
        color: 'text.primary',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        height: '64px',
        zIndex: theme.zIndex.appBar,
        transition: 'width 0.3s ease, margin-left 0.3s ease',
      }}
    >
      <Toolbar sx={{ 
        minHeight: '64px',
        px: { xs: 0.5, sm: 1, md: 2 },
        py: { xs: 0.5, sm: 0.75, md: 1 },
        gap: { xs: 0.5, sm: 1 }
      }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ 
            padding: { xs: 0.5, sm: 0.75 },
            minWidth: { xs: '44px', sm: '48px' },
            minHeight: { xs: '44px', sm: '48px' }
          }}
        >
          <MenuIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </IconButton>
        
        {!isMobileProp && handleSidebarToggle && (
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={handleSidebarToggle}
            sx={{ 
              padding: { xs: 0.5, sm: 0.75 },
              minWidth: { xs: '44px', sm: '48px' },
              minHeight: { xs: '44px', sm: '48px' },
              mr: 1
            }}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon sx={{ fontSize: '1.5rem' }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: '1.5rem' }} />
            )}
          </IconButton>
        )}
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' },
            fontWeight: 600,
            textAlign: { xs: 'center', sm: 'left' },
            px: { xs: 0.5, sm: 0 }
          }}
        >
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 0.5, md: 1 } }}>
          <IconButton 
            color="inherit" 
            size={isMobileProp ? "small" : "medium"}
            sx={{ 
              padding: { xs: 0.25, sm: 0.5 },
              minWidth: { xs: '36px', sm: '40px', md: '48px' },
              minHeight: { xs: '36px', sm: '40px', md: '48px' }
            }}
          >
            <Badge badgeContent={4} color="error">
              <NotificationsIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }} />
            </Badge>
          </IconButton>
          
          <IconButton
            size={isMobileProp ? "small" : "medium"}
            edge="end"
            aria-label="account of current user"
            color="inherit"
            onClick={handleMenu}
            sx={{ 
              padding: { xs: 0.25, sm: 0.5 },
              minWidth: { xs: '36px', sm: '40px', md: '48px' },
              minHeight: { xs: '36px', sm: '40px', md: '48px' }
            }}
          >
            <AccountCircle sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }} />
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 0.5,
                minWidth: { xs: 180, sm: 200, md: 220 },
                '& .MuiMenuItem-root': {
                  py: { xs: 0.5, sm: 0.75, md: 1 },
                  px: { xs: 1, sm: 1.5, md: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                  minHeight: { xs: '36px', sm: '44px', md: '48px' }
                }
              }
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}>
                {business?.name || 'Business'}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ minHeight: { xs: '36px', sm: '44px', md: '48px' } }}>
              <Logout sx={{ mr: 1, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }} />
              <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}>Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
