/**
 * ============================================================================
 * ISTHO CRM - Servicio de Autenticación (CORREGIDO)
 * ============================================================================
 * Gestiona todas las operaciones relacionadas con autenticación.
 * 
 * ⚠️ IMPORTANTE: Usa setAuthToken/clearAuthToken del client.js
 * para mantener consistencia con el interceptor de Axios.
 * 
 * @author Coordinación TI ISTHO
 * @version 1.1.0
 * @date Enero 2026
 */

import apiClient, { setAuthToken, clearAuthToken } from './client';
import { AUTH_ENDPOINTS } from './endpoints';

// ============================================================================
// CONSTANTES
// ============================================================================

const USER_KEY = 'istho_user';

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
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // ⚠️ IMPORTANTE: Usar setAuthToken del client.js
        // Esto guarda en 'istho_token' que es donde el interceptor lo busca
        setAuthToken(token);
        
        // Guardar usuario
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        
        console.log('✅ Login exitoso, token guardado');
        
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Inicio de sesión exitoso',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Error al iniciar sesión',
      };
    } catch (error) {
      console.error('❌ Error en login:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al iniciar sesión',
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
      // ⚠️ IMPORTANTE: Usar clearAuthToken del client.js
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
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get(AUTH_ENDPOINTS.ME);
      
      if (response.data.success) {
        // Actualizar usuario en localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.data));
        
        return {
          success: true,
          data: response.data.data,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Error al obtener usuario',
      };
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      return {
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
      const userStr = localStorage.getItem(USER_KEY);
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
   * @returns {Promise<Object>}
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.REGISTRO, userData);
      return response.data;
    } catch (error) {
      return {
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
   */
  changePassword: async (passwords) => {
    try {
      const response = await apiClient.put(AUTH_ENDPOINTS.CAMBIAR_PASSWORD, passwords);
      return response.data;
    } catch (error) {
      return {
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
        return response.data;
      }
      
      return {
        success: false,
        message: 'Error al refrescar token',
      };
    } catch (error) {
      // Si falla el refresh, limpiar sesión
      clearAuthToken();
      return {
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
   */
  hasRole: (roles) => {
    const user = authService.getStoredUser();
    if (!user) return false;
    
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(user.rol);
  },
  
  /**
   * Verifica si el usuario actual es administrador
   * @returns {boolean}
   */
  isAdmin: () => authService.hasRole('admin'),
  
  /**
   * Verifica si el usuario actual es un cliente externo
   * @returns {boolean}
   */
  isCliente: () => authService.hasRole('cliente'),
  
  /**
   * Obtener token almacenado
   * @returns {string|null}
   */
  getToken: () => localStorage.getItem('istho_token'),
  
  /**
   * Verificar si hay sesión activa (sincrónico)
   * @returns {boolean}
   */
  isAuthenticated: () => !!localStorage.getItem('istho_token'),
};

// ============================================================================
// EXPORT
// ============================================================================

export default authService;