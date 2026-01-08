/**
 * ISTHO CRM - Floating Header Component
 * Header flotante con navegación y submenús
 * 
 * @author Coordinación TI ISTHO
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
  MapPin,
  Clock,
  FileCheck,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

// ============================================
// CONFIGURACIÓN DEL MENÚ
// ============================================
const menuConfig = [
  // Dashboard
  {
    id: 'dashboard',
    label: 'Dashboard',
    basePath: '/dashboard',
    items: [
      { icon: LayoutDashboard, label: 'Vista General', href: '/dashboard' },
      { icon: BarChart3, label: 'Reportes', href: '/reportes' },
    ],
  },
  // Clientes
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
  // Inventario
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
  // Despachos
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
  // Trazabilidad
  {
    id: 'trazabilidad',
    label: 'Trazabilidad',
    basePath: '/trazabilidad',
    items: [
      { icon: Route, label: 'Seguimiento', href: '/trazabilidad' },
      
    ],
  },
];

// ============================================
// DROPDOWN MENU ITEM COMPONENT
// ============================================
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

// ============================================
// DROPDOWN MENU COMPONENT
// ============================================
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

    {/* Dropdown Content */}
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
    items: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.elementType.isRequired,
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  isCurrentSection: PropTypes.bool,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  currentPath: PropTypes.string,
};

// ============================================
// MAIN FLOATING HEADER COMPONENT
// ============================================
const FloatingHeader = ({
  notificationCount = 0,
  onSearchClick,
  onNotificationClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(null);

  const handleMouseEnter = (menuId) => {
    setActiveMenu(menuId);
  };

  const handleMouseLeave = () => {
    setActiveMenu(null);
  };

  const handleNavigate = (href) => {
    setActiveMenu(null);
    navigate(href);
  };

  // Determinar qué sección está activa basándose en la URL actual
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

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-2xl px-6 py-4 border border-gray-200/50">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => handleNavigate('/dashboard')} 
              className="flex items-center gap-2 text-2xl font-bold text-slate-800 tracking-tight hover:text-orange-600 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">IS</span>
              </div>
              <span>Istho</span>
            </button>
          </div>

          {/* Navigation Menu */}
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

          {/* Right Actions */}
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
              onClick={onNotificationClick}
              className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors relative"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Reportes Button */}
            <button
              onClick={() => handleNavigate('/reportes')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden lg:inline">Reportes</span>
            </button>

            {/* Profile Button */}
            <button
              onClick={() => handleNavigate('/perfil')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden lg:inline">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

FloatingHeader.propTypes = {
  notificationCount: PropTypes.number,
  onSearchClick: PropTypes.func,
  onNotificationClick: PropTypes.func,
};

export default FloatingHeader;