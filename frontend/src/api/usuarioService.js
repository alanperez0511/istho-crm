/**
 * ============================================================================
 * ISTHO CRM - Usuario Service
 * ============================================================================
 * Servicio para gestionar datos del usuario actual.
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import apiClient from './apiClient';

// ════════════════════════════════════════════════════════════════════════════
// USUARIO SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const usuarioService = {
  /**
   * Obtener perfil del usuario actual
   * @returns {Promise<Object>} Datos del usuario
   */
  getPerfil: async function() {
    const response = await apiClient.get('/usuarios/perfil');
    return response.data.data || response.data;
  },

  /**
   * Actualizar perfil del usuario
   * @param {Object} data - Datos a actualizar (nombre, apellido, telefono, etc.)
   * @returns {Promise<Object>} Usuario actualizado
   */
  updateProfile: async function(data) {
    const response = await apiClient.put('/usuarios/perfil', data);
    return response.data;
  },

  /**
   * Obtener permisos detallados del usuario
   * @returns {Promise<Array>} Lista de permisos por módulo
   */
  getPermisos: async function() {
    const response = await apiClient.get('/usuarios/permisos');
    return response.data.data || response.data;
  },

  /**
   * Obtener historial de actividad del usuario
   * @param {Object} params - Parámetros de paginación
   * @returns {Promise<Array>} Lista de actividades
   */
  getActividad: async function(params) {
    const response = await apiClient.get('/usuarios/actividad', { params: params });
    return response.data.data || response.data;
  },

  /**
   * Obtener estadísticas del usuario
   * @returns {Promise<Object>} Estadísticas
   */
  getEstadisticas: async function() {
    const response = await apiClient.get('/usuarios/estadisticas');
    return response.data.data || response.data;
  },

  /**
   * Subir foto de perfil
   * @param {File} file - Archivo de imagen
   * @returns {Promise<Object>} URL de la imagen
   */
  subirFoto: async function(file) {
    const formData = new FormData();
    formData.append('foto', file);
    
    const response = await apiClient.post('/usuarios/foto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Eliminar foto de perfil
   * @returns {Promise<void>}
   */
  eliminarFoto: async function() {
    await apiClient.delete('/usuarios/foto');
  },

  /**
   * Obtener configuración de notificaciones
   * @returns {Promise<Object>} Configuración
   */
  getConfigNotificaciones: async function() {
    const response = await apiClient.get('/usuarios/configuracion/notificaciones');
    return response.data.data || response.data;
  },

  /**
   * Actualizar configuración de notificaciones
   * @param {Object} config - Nueva configuración
   * @returns {Promise<Object>} Configuración actualizada
   */
  updateConfigNotificaciones: async function(config) {
    const response = await apiClient.put('/usuarios/configuracion/notificaciones', config);
    return response.data;
  },
};

export default usuarioService;