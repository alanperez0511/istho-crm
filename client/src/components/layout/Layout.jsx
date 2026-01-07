/**
 * ISTHO CRM - Layout Principal
 * Integra Sidebar, Header y contenido
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import Header from './Header';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Sidebar 
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
        />
      ) : (
        <Sidebar variant="permanent" open />
      )}

      {/* Contenido Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Header 
          onMenuClick={handleDrawerToggle}
          isMobile={isMobile}
        />

        {/* Área de contenido */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            mt: '64px', // Altura del AppBar
            bgcolor: 'background.default',
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
