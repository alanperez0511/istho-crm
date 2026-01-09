/**
 * ============================================================================
 * ISTHO CRM - Private Route Component
 * ============================================================================
 * Componente para proteger rutas que requieren autenticación.
 * Redirige a login si el usuario no está autenticado.
 * Opcionalmente puede requerir roles específicos.
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// COMPONENTE DE CARGA
// ============================================================================

/**
 * Pantalla de carga mientras se verifica la autenticación
 */
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      {/* Logo ISTHO */}
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#E65100] to-[#FF6D00] rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">I</span>
        </div>
      </div>
      
      {/* Spinner */}
      <div className="relative w-12 h-12 mx-auto mb-4">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-[#E65100] rounded-full border-t-transparent animate-spin"></div>
      </div>
      
      <p className="text-gray-600 font-medium">Verificando sesión...</p>
    </div>
  </div>
);

// ============================================================================
// COMPONENTE DE ACCESO DENEGADO
// ============================================================================

/**
 * Pantalla de acceso denegado cuando el usuario no tiene permisos
 */
const AccessDenied = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="text-center max-w-md">
      {/* Icono */}
      <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
        <svg 
          className="w-10 h-10 text-red-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Acceso Denegado
      </h1>
      
      <p className="text-gray-600 mb-6">
        No tienes permisos para acceder a esta sección. 
        Contacta al administrador si crees que esto es un error.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Volver
        </button>
        <a
          href="/dashboard"
          className="px-6 py-2 bg-[#E65100] text-white rounded-lg hover:bg-[#BF360C] transition-colors font-medium"
        >
          Ir al Dashboard
        </a>
      </div>
    </div>
  </div>
);

// ============================================================================
// PRIVATE ROUTE
// ============================================================================

/**
 * Componente que protege rutas privadas
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a renderizar si está autenticado
 * @param {string|string[]} [props.roles] - Roles requeridos (opcional)
 * @param {string} [props.redirectTo='/login'] - Ruta de redirección si no autenticado
 * 
 * @example
 * // Ruta que solo requiere autenticación
 * <Route 
 *   path="/dashboard" 
 *   element={
 *     <PrivateRoute>
 *       <Dashboard />
 *     </PrivateRoute>
 *   } 
 * />
 * 
 * @example
 * // Ruta que requiere rol específico
 * <Route 
 *   path="/admin/usuarios" 
 *   element={
 *     <PrivateRoute roles="admin">
 *       <UsuariosPage />
 *     </PrivateRoute>
 *   } 
 * />
 * 
 * @example
 * // Ruta que requiere uno de varios roles
 * <Route 
 *   path="/reportes" 
 *   element={
 *     <PrivateRoute roles={['admin', 'supervisor']}>
 *       <ReportesPage />
 *     </PrivateRoute>
 *   } 
 * />
 */
const PrivateRoute = ({ 
  children, 
  roles = null, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const location = useLocation();
  
  // ──────────────────────────────────────────────────────────────────────────
  // ESTADO DE CARGA
  // ──────────────────────────────────────────────────────────────────────────
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // ──────────────────────────────────────────────────────────────────────────
  // NO AUTENTICADO
  // ──────────────────────────────────────────────────────────────────────────
  
  if (!isAuthenticated) {
    // Guardar la ubicación actual para redirigir después del login
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }
  
  // ──────────────────────────────────────────────────────────────────────────
  // VERIFICAR ROLES
  // ──────────────────────────────────────────────────────────────────────────
  
  if (roles) {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    if (!hasRole(rolesArray)) {
      // Usuario autenticado pero sin permisos
      return <AccessDenied />;
    }
  }
  
  // ──────────────────────────────────────────────────────────────────────────
  // AUTENTICADO Y CON PERMISOS
  // ──────────────────────────────────────────────────────────────────────────
  
  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  redirectTo: PropTypes.string,
};

// ============================================================================
// VARIANTES ESPECIALIZADAS
// ============================================================================

/**
 * Ruta solo para administradores
 */
export const AdminRoute = ({ children }) => (
  <PrivateRoute roles="admin">
    {children}
  </PrivateRoute>
);

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Ruta para supervisores y administradores
 */
export const SupervisorRoute = ({ children }) => (
  <PrivateRoute roles={['admin', 'supervisor']}>
    {children}
  </PrivateRoute>
);

SupervisorRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Ruta para operadores, supervisores y administradores
 */
export const OperadorRoute = ({ children }) => (
  <PrivateRoute roles={['admin', 'supervisor', 'operador']}>
    {children}
  </PrivateRoute>
);

OperadorRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Ruta solo para clientes externos
 */
export const ClienteRoute = ({ children }) => (
  <PrivateRoute roles="cliente">
    {children}
  </PrivateRoute>
);

ClienteRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

// ============================================================================
// EXPORT
// ============================================================================

export default PrivateRoute;