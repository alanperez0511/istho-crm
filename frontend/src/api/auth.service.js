/**
 * ============================================================================
 * ISTHO CRM - Servicio de Autenticación
 * ============================================================================
 * Gestiona todas las operaciones relacionadas con autenticación:
 * - Login / Logout
 * - Obtener usuario actual
 * - Registro de usuarios (solo admin)
 * - Cambio de contraseña
 * - Refresh de token
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import apiClient, { setAuthToken, clearAuthToken } from './client';
import { AUTH_ENDPOINTS } from './endpoints';

// ============================================================================
// SERVICIO DE AUTENTICACIÓN
// ============================================================================

const authService = {
  
  // ──────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Iniciar sesión en el sistema
   * @param {Object} credentials - Credenciales del usuario
   * @param {string} credentials.email - Email del usuario
   * @param {string} credentials.password - Contraseña
   * @returns {Promise<Object>} Datos del usuario y token
   * 
   * @example
   * const result = await authService.login({
   *   email: 'admin@istho.com.co',
   *   password: 'MiPassword123'
   * });
   * // result.data = { user: {...}, token: '...', expiresIn: '24h' }
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Guardar token y usuario en localStorage
        setAuthToken(token);
        localStorage.setItem('istho_user', JSON.stringify(user));
        
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Inicio de sesión exitoso',
        };
      }
      
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al iniciar sesión',
        code: error.code || 'LOGIN_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Cerrar sesión del usuario
   * Limpia tokens y notifica al backend
   * @returns {Promise<Object>}
   */
  logout: async () => {
    try {
      // Notificar al backend (registra en auditoría)
      await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Ignorar error si el token ya expiró
      console.warn('⚠️ Error al notificar logout al servidor:', error);
    } finally {
      // Siempre limpiar datos locales
      clearAuthToken();
      
      return {
        success: true,
        message: 'Sesión cerrada correctamente',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // OBTENER USUARIO ACTUAL
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener información del usuario actualmente autenticado
   * @returns {Promise<Object>} Datos del usuario
   * 
   * @example
   * const user = await authService.getCurrentUser();
   * // user.data = { id, username, email, nombre_completo, rol, ultimo_acceso }
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get(AUTH_ENDPOINTS.ME);
      
      if (response.data.success) {
        // Actualizar usuario en localStorage
        localStorage.setItem('istho_user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener usuario',
        code: error.code || 'GET_USER_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // OBTENER USUARIO DE LOCALSTORAGE (sin petición)
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtiene el usuario almacenado en localStorage
   * Útil para verificación rápida sin hacer petición al servidor
   * @returns {Object|null} Usuario o null si no hay sesión
   */
  getStoredUser: () => {
    try {
      const userStr = localStorage.getItem('istho_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // REGISTRO DE USUARIO (Solo Admin)
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Registrar nuevo usuario en el sistema
   * Solo puede ser ejecutado por administradores
   * 
   * @param {Object} userData - Datos del nuevo usuario
   * @param {string} userData.username - Nombre de usuario
   * @param {string} userData.email - Email
   * @param {string} userData.password - Contraseña
   * @param {string} userData.nombre_completo - Nombre completo
   * @param {string} userData.rol - Rol ('admin'|'supervisor'|'operador'|'cliente')
   * @param {number} [userData.cliente_id] - ID del cliente (solo si rol='cliente')
   * @returns {Promise<Object>}
   * 
   * @example
   * const result = await authService.register({
   *   username: 'operador1',
   *   email: 'operador1@istho.com.co',
   *   password: 'Password123!',
   *   nombre_completo: 'Juan Pérez',
   *   rol: 'operador'
   * });
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.REGISTRO, userData);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al registrar usuario',
        errors: error.errors || [],
        code: error.code || 'REGISTER_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // CAMBIAR CONTRASEÑA
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Cambiar contraseña del usuario actual
   * @param {Object} passwords - Contraseñas
   * @param {string} passwords.password_actual - Contraseña actual
   * @param {string} passwords.password_nuevo - Nueva contraseña
   * @returns {Promise<Object>}
   * 
   * @example
   * await authService.changePassword({
   *   password_actual: 'MiPasswordActual',
   *   password_nuevo: 'MiNuevoPassword123!'
   * });
   */
  changePassword: async (passwords) => {
    try {
      const response = await apiClient.put(AUTH_ENDPOINTS.CAMBIAR_PASSWORD, passwords);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al cambiar contraseña',
        code: error.code || 'CHANGE_PASSWORD_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Refrescar token JWT
   * Generalmente llamado automáticamente por el interceptor
   * @returns {Promise<Object>} Nuevo token
   */
  refreshToken: async () => {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.REFRESH);
      
      if (response.data.success) {
        const { token } = response.data.data;
        setAuthToken(token);
      }
      
      return response.data;
    } catch (error) {
      // Si falla el refresh, limpiar sesión
      clearAuthToken();
      throw {
        success: false,
        message: 'Sesión expirada, por favor inicie sesión nuevamente',
        code: 'TOKEN_EXPIRED',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // VERIFICAR AUTENTICACIÓN
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Verifica si hay una sesión activa
   * Intenta obtener el usuario actual para validar el token
   * @returns {Promise<boolean>}
   */
  verifyAuth: async () => {
    try {
      const token = localStorage.getItem('istho_token');
      if (!token) return false;
      
      const response = await apiClient.get(AUTH_ENDPOINTS.ME);
      return response.data.success;
    } catch {
      return false;
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // VERIFICAR ROL
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string|string[]} roles - Rol o lista de roles permitidos
   * @returns {boolean}
   * 
   * @example
   * authService.hasRole('admin'); // true/false
   * authService.hasRole(['admin', 'supervisor']); // true si tiene alguno
   */
  hasRole: (roles) => {
    const user = authService.getStoredUser();
    if (!user) return false;
    
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(user.rol);
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // VERIFICAR SI ES ADMIN
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Verifica si el usuario actual es administrador
   * @returns {boolean}
   */
  isAdmin: () => {
    return authService.hasRole('admin');
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // VERIFICAR SI ES CLIENTE
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Verifica si el usuario actual es un cliente externo
   * @returns {boolean}
   */
  isCliente: () => {
    return authService.hasRole('cliente');
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default authService;