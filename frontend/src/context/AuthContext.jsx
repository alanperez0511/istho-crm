/**
 * ============================================================================
 * ISTHO CRM - Contexto de Autenticación
 * ============================================================================
 * Provee estado global de autenticación para toda la aplicación:
 * - Estado del usuario actual
 * - Funciones de login/logout
 * - Verificación de sesión
 * - Persistencia en localStorage
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo 
} from 'react';
import PropTypes from 'prop-types';
import authService from '../api/auth.service';
import { clearAuthToken, isAuthenticated as checkToken } from '../api/client';

// ============================================================================
// CONTEXTO
// ============================================================================

const AuthContext = createContext(null);

// ============================================================================
// ESTADOS INICIALES
// ============================================================================

const INITIAL_STATE = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Proveedor de contexto de autenticación
 * Envuelve la aplicación para proveer estado de auth global
 * 
 * @example
 * // En main.jsx o App.jsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
  // Estado de autenticación
  const [state, setState] = useState(INITIAL_STATE);
  
  // ──────────────────────────────────────────────────────────────────────────
  // INICIALIZACIÓN - Verificar sesión existente
  // ──────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificar si hay token almacenado
        if (!checkToken()) {
          setState({
            ...INITIAL_STATE,
            isLoading: false,
          });
          return;
        }
        
        // Intentar obtener usuario actual
        const storedUser = authService.getStoredUser();
        
        if (storedUser) {
          // Usar usuario almacenado temporalmente
          setState({
            user: storedUser,
            isAuthenticated: true,
            isLoading: true,
            error: null,
          });
          
          // Verificar con el servidor en background
          try {
            const response = await authService.getCurrentUser();
            if (response.success) {
              setState({
                user: response.data,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            }
          } catch (verifyError) {
            // Token inválido, limpiar sesión
            console.warn('⚠️ Sesión inválida, cerrando...');
            clearAuthToken();
            setState({
              ...INITIAL_STATE,
              isLoading: false,
            });
          }
        } else {
          // Intentar obtener del servidor
          try {
            const response = await authService.getCurrentUser();
            if (response.success) {
              setState({
                user: response.data,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            }
          } catch {
            clearAuthToken();
            setState({
              ...INITIAL_STATE,
              isLoading: false,
            });
          }
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        setState({
          ...INITIAL_STATE,
          isLoading: false,
          error: 'Error al verificar sesión',
        });
      }
    };
    
    initializeAuth();
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Resultado del login
   */
  const login = useCallback(async (email, password) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await authService.login({ email, password });
      
      if (result.success) {
        setState({
          user: result.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        return { success: true, user: result.data.user };
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.message || 'Error al iniciar sesión',
      }));
      
      return { success: false, message: result.message };
    } catch (error) {
      const errorMessage = error.message || 'Error al iniciar sesión';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      return { success: false, message: errorMessage };
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Cerrar sesión
   * Limpia el estado y los tokens almacenados
   */
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
    } catch (error) {
      console.warn('⚠️ Error al notificar logout:', error);
    } finally {
      setState({
        ...INITIAL_STATE,
        isLoading: false,
      });
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // ACTUALIZAR USUARIO
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Actualizar datos del usuario en el estado
   * @param {Object} userData - Datos actualizados del usuario
   */
  const updateUser = useCallback((userData) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, ...userData },
    }));
    
    // Actualizar en localStorage
    const currentUser = authService.getStoredUser();
    if (currentUser) {
      localStorage.setItem('istho_user', JSON.stringify({
        ...currentUser,
        ...userData,
      }));
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // REFRESCAR USUARIO
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Refrescar datos del usuario desde el servidor
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        setState(prev => ({
          ...prev,
          user: response.data,
        }));
      }
    } catch (error) {
      console.error('Error refrescando usuario:', error);
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // LIMPIAR ERROR
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Limpiar mensaje de error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // VERIFICACIONES DE ROL
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Verificar si el usuario tiene un rol específico
   * @param {string|string[]} roles - Rol o lista de roles
   * @returns {boolean}
   */
  const hasRole = useCallback((roles) => {
    if (!state.user) return false;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(state.user.rol);
  }, [state.user]);
  
  /**
   * Verificar si es administrador
   * @returns {boolean}
   */
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  
  /**
   * Verificar si es supervisor o superior
   * @returns {boolean}
   */
  const isSupervisorOrAbove = useCallback(() => {
    return hasRole(['admin', 'supervisor']);
  }, [hasRole]);
  
  /**
   * Verificar si es operador o superior
   * @returns {boolean}
   */
  const isOperadorOrAbove = useCallback(() => {
    return hasRole(['admin', 'supervisor', 'operador']);
  }, [hasRole]);
  
  /**
   * Verificar si es cliente externo
   * @returns {boolean}
   */
  const isCliente = useCallback(() => hasRole('cliente'), [hasRole]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // VALOR DEL CONTEXTO
  // ──────────────────────────────────────────────────────────────────────────
  
  const value = useMemo(() => ({
    // Estado
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Acciones
    login,
    logout,
    updateUser,
    refreshUser,
    clearError,
    
    // Verificaciones de rol
    hasRole,
    isAdmin,
    isSupervisorOrAbove,
    isOperadorOrAbove,
    isCliente,
  }), [
    state,
    login,
    logout,
    updateUser,
    refreshUser,
    clearError,
    hasRole,
    isAdmin,
    isSupervisorOrAbove,
    isOperadorOrAbove,
    isCliente,
  ]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para acceder al contexto de autenticación
 * 
 * @returns {Object} Contexto de autenticación
 * @throws {Error} Si se usa fuera de AuthProvider
 * 
 * @example
 * const { user, login, logout, isAuthenticated } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

// ============================================================================
// EXPORT
// ============================================================================

export default AuthContext;