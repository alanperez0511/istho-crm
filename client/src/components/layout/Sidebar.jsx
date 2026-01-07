/**
 * ISTHO CRM - Sidebar de Navegación
 */

import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Timeline as TimelineIcon,
  Assessment as ReportsIcon,
  Description as DocumentsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/' 
  },
  { 
    text: 'Clientes', 
    icon: <PeopleIcon />, 
    path: '/clientes' 
  },
  { 
    text: 'Inventario', 
    icon: <InventoryIcon />, 
    path: '/inventario' 
  },
  { 
    text: 'Despachos', 
    icon: <ShippingIcon />, 
    path: '/despachos' 
  },
  { 
    text: 'Trazabilidad', 
    icon: <TimelineIcon />, 
    path: '/trazabilidad' 
  },
  { 
    text: 'Reportes', 
    icon: <ReportsIcon />, 
    path: '/reportes' 
  },
  { 
    text: 'Documentos', 
    icon: <DocumentsIcon />, 
    path: '/documentos' 
  }
];

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose?.();
    }
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo y Nombre */}
      <Box 
        sx={{ 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Avatar 
          sx={{ 
            bgcolor: 'primary.main', 
            width: 45, 
            height: 45,
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          IS
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold" color="primary">
            ISTHO CRM
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sistema de Gestión
          </Typography>
        </Box>
      </Box>

      {/* Menú Principal */}
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'inherit'
                    }
                  }
                }}
                selected={isActive}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 40,
                    color: isActive ? 'inherit' : 'text.secondary'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Configuración */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/configuracion')}
            sx={{ borderRadius: 2, mx: 1 }}
            selected={location.pathname === '/configuracion'}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Configuración" />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Footer del Sidebar */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          ISTHO S.A.S.
        </Typography>
        <Typography variant="caption" color="text.disabled">
          v1.0.0 - Desarrollo
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
export { DRAWER_WIDTH };
