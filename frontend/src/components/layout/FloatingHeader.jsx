/**
 * ============================================================================
 * ISTHO CRM - FloatingHeader (Fase 5 - Integración Completa)
 * ============================================================================
 * Header flotante integrado con AuthContext.
 * Muestra información del usuario y permite cerrar sesión.
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  Search,
  Bell,
  User,
  FileSpreadsheet,
  LayoutDashboard,
  Users,
  Building2,
  History,
  Package,
  Warehouse,
  AlertCircle,
  Truck,
  Calendar,
  Route,
  ClipboardList,
  BarChart3,
  LogOut,
  Settings,
  UserCircle,
  Shield,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS DE AUTENTICACIÓN
// ════════════════════════════════════════════════════════════════════════════
import { useAuth } from '../../context/AuthContext';
import useNotification from '../../hooks/useNotification';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL MENÚ
// ════════════════════════════════════════════════════════════════════════════
const menuConfig = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    basePath: '/dashboard',
    items: [
      { icon: LayoutDashboard, label: 'Vista General', href: '/dashboard' },
      { icon: BarChart3, label: 'Reportes', href: '/reportes' },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    basePath: '/clientes',
    items: [
      { icon: Users, label: 'Lista de Clientes', href: '/clientes' },
      { icon: Building2, label: 'Por Sector', href: '/clientes?filter=sector' },
      { icon: History, label: 'Actividad Reciente', href: '/clientes?filter=reciente' },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    basePath: '/inventario',
    items: [
      { icon: Package, label: 'Productos', href: '/inventario' },
      { icon: Warehouse, label: 'Por Bodega', href: '/inventario?filter=bodega' },
      { icon: AlertCircle, label: 'Alertas de Stock', href: '/inventario/alertas' },
    ],
  },
  {
    id: 'despachos',
    label: 'Despachos',
    basePath: '/despachos',
    items: [
      { icon: Truck, label: 'Despachos Activos', href: '/despachos' },
      { icon: Calendar, label: 'Programados', href: '/despachos?filter=programados' },
      { icon: ClipboardList, label: 'Historial', href: '/despachos?filter=completados' },
    ],
  },
  {
    id: 'trazabilidad',
    label: 'Trazabilidad',
    basePath: '/trazabilidad',
    items: [
      { icon: Route, label: 'Seguimiento', href: '/trazabilidad' },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Item del menú dropdown
 */
const DropdownMenuItem = ({ icon: Icon, label, href, isActive, onClick }) => (
  <button
    onClick={() => onClick(href)}
    className={`
      flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors
      ${isActive 
        ? 'text-orange-600 bg-orange-50 font-medium' 
        : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
      }
    `}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

DropdownMenuItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

/**
 * Menú dropdown de navegación
 */
const DropdownMenu = ({ menu, isActive, isCurrentSection, onMouseEnter, onMouseLeave, onNavigate, currentPath }) => (
  <div
    className="relative"
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <button
      className={`
        flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
        ${isCurrentSection 
          ? 'text-orange-600 bg-orange-50' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }
      `}
    >
      {menu.label}
      <ChevronDown
        className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`}
      />
    </button>

    {isActive && (
      <div className="absolute top-full left-0 pt-2 w-56 z-50">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fadeIn">
          {menu.items.map((item, idx) => (
            <DropdownMenuItem
              key={idx}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={currentPath === item.href.split('?')[0]}
              onClick={onNavigate}
            />
          ))}
        </div>
      </div>
    )}
  </div>
);

DropdownMenu.propTypes = {
  menu: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    basePath: PropTypes.string,
    items: PropTypes.array.isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  isCurrentSection: PropTypes.bool,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  currentPath: PropTypes.string,
};

/**
 * Menú de usuario con logout
 */
const UserMenu = ({ user, isOpen, onToggle, onClose, onNavigate, onLogout }) => {
  // Obtener iniciales del nombre
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Configuración de color por rol
  const roleConfig = {
    admin: { bg: 'bg-red-100', text: 'text-red-700', label: 'Administrador' },
    supervisor: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Supervisor' },
    operador: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Operador' },
    cliente: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Cliente' },
  };

  const roleStyle = roleConfig[user?.rol] || roleConfig.operador;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white text-sm font-bold">
            {getInitials(user?.nombre_completo)}
          </span>
        </div>
        
        {/* Nombre (solo desktop) */}
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium text-slate-800 leading-tight">
            {user?.nombre_completo?.split(' ')[0] || 'Usuario'}
          </p>
          <p className="text-xs text-slate-500 leading-tight">
            {roleStyle.label}
          </p>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div className="fixed inset-0 z-40" onClick={onClose} />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
            {/* Header con info de usuario */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {getInitials(user?.nombre_completo)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {user?.nombre_completo || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email || 'email@istho.com'}
                  </p>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                    <Shield className="w-3 h-3" />
                    {roleStyle.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="py-1">
              <button
                onClick={() => { onNavigate('/perfil'); onClose(); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                Mi Perfil
              </button>
              <button
                onClick={() => { onNavigate('/configuracion'); onClose(); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configuración
              </button>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-100 my-1" />

            {/* Cerrar sesión */}
            <div className="py-1">
              <button
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const FloatingHeader = ({ onSearchClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { success } = useNotification();
  
  const [activeMenu, setActiveMenu] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Handlers de navegación
  const handleMouseEnter = (menuId) => setActiveMenu(menuId);
  const handleMouseLeave = () => setActiveMenu(null);
  
  const handleNavigate = (href) => {
    setActiveMenu(null);
    setUserMenuOpen(false);
    navigate(href);
  };

  // Handler de logout
  const handleLogout = async () => {
    try {
      await logout();
      success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Determinar sección activa
  const getCurrentSection = () => {
    const path = location.pathname;
    for (const menu of menuConfig) {
      if (path.startsWith(menu.basePath)) {
        return menu.id;
      }
    }
    return null;
  };

  const currentSection = getCurrentSection();

  // Si no está autenticado, no mostrar el header
  if (!isAuthenticated) return null;

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-2xl px-6 py-4 border border-gray-200/50">
        <div className="flex items-center justify-between">
          {/* ════════════════════════════════════════════════════════════ */}
          {/* LOGO */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="flex items-center">
            <button 
              onClick={() => handleNavigate('/dashboard')} 
              className="flex items-center gap-2 text-2xl font-bold text-slate-800 tracking-tight hover:text-orange-600 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">IS</span>
              </div>
              <span>Istho</span>
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* NAVIGATION MENU */}
          {/* ════════════════════════════════════════════════════════════ */}
          <nav className="hidden md:flex items-center gap-1">
            {menuConfig.map((menu) => (
              <DropdownMenu
                key={menu.id}
                menu={menu}
                isActive={activeMenu === menu.id}
                isCurrentSection={currentSection === menu.id}
                onMouseEnter={() => handleMouseEnter(menu.id)}
                onMouseLeave={handleMouseLeave}
                onNavigate={handleNavigate}
                currentPath={location.pathname}
              />
            ))}
          </nav>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* RIGHT ACTIONS */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={onSearchClick}
              className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => handleNavigate('/notificaciones')}
              className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors relative"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {/* Badge de notificaciones - se puede conectar a un estado real */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Reportes Button */}
            <button
              onClick={() => handleNavigate('/reportes')}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden lg:inline">Reportes</span>
            </button>

            {/* User Menu */}
            <UserMenu
              user={user}
              isOpen={userMenuOpen}
              onToggle={() => setUserMenuOpen(!userMenuOpen)}
              onClose={() => setUserMenuOpen(false)}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

FloatingHeader.propTypes = {
  onSearchClick: PropTypes.func,
};

export default FloatingHeader;