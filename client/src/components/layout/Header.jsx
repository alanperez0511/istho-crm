/**
 * ISTHO CRM - Header/AppBar
 */

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  InputBase,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  AccountCircle,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useThemeMode } from '../../context/ThemeContext';
import { DRAWER_WIDTH } from './Sidebar';

const Header = ({ onMenuClick, isMobile }) => {
  const { mode, toggleTheme, isDark } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleNotifOpen = (event) => setNotifAnchor(event.currentTarget);
  const handleNotifClose = () => setNotifAnchor(null);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar>
        {/* Botón menú móvil */}
        {isMobile && (
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Barra de búsqueda */}
        <Box
          sx={{
            position: 'relative',
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12)
            },
            mr: 2,
            width: { xs: '100%', sm: 'auto' },
            maxWidth: 400
          }}
        >
          <Box
            sx={{
              padding: '0 16px',
              height: '100%',
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary' }} />
          </Box>
          <InputBase
            placeholder="Buscar clientes, despachos..."
            sx={{
              color: 'text.primary',
              padding: '8px 8px 8px 48px',
              width: { xs: '100%', sm: 300 }
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Acciones */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Toggle tema */}
          <Tooltip title={isDark ? 'Modo claro' : 'Modo oscuro'}>
            <IconButton onClick={toggleTheme} sx={{ color: 'text.primary' }}>
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Notificaciones */}
          <Tooltip title="Notificaciones">
            <IconButton 
              onClick={handleNotifOpen}
              sx={{ color: 'text.primary' }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Perfil */}
          <Tooltip title="Mi cuenta">
            <IconButton onClick={handleMenuOpen}>
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'primary.main',
                  fontSize: '0.9rem'
                }}
              >
                AD
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Menú de usuario */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: { width: 200, mt: 1 }
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Administrador
            </Typography>
            <Typography variant="caption" color="text.secondary">
              admin@istho.com.co
            </Typography>
          </Box>
          <MenuItem onClick={handleMenuClose}>
            <AccountCircle sx={{ mr: 1.5, fontSize: 20 }} />
            Mi Perfil
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>

        {/* Menú de notificaciones */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: { width: 320, maxHeight: 400, mt: 1 }
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Notificaciones
            </Typography>
          </Box>
          <MenuItem onClick={handleNotifClose}>
            <Box>
              <Typography variant="body2">
                Despacho #D-2024-0145 entregado
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hace 5 minutos
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleNotifClose}>
            <Box>
              <Typography variant="body2">
                Nuevo cliente registrado
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hace 1 hora
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleNotifClose}>
            <Box>
              <Typography variant="body2">
                Documento próximo a vencer
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hace 2 horas
              </Typography>
            </Box>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
