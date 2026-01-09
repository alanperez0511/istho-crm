/**
 * ============================================================================
 * ISTHO CRM - Notificaciones Service
 * ============================================================================
 * Servicio para gestionar notificaciones del sistema.
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import apiClient from './client';

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const notificacionesService = {
  /**
   * Obtener todas las notificaciones del usuario
   * @returns {Promise<Array>} Lista de notificaciones
   */
  getAll: async function() {
    const response = await apiClient.get('/notificaciones');
    return response.data.data || response.data;
  },

  /**
   * Obtener notificaciones no leídas
   * @returns {Promise<Array>} Lista de notificaciones no leídas
   */
  getNoLeidas: async function() {
    const response = await apiClient.get('/notificaciones', {
      params: { leida: false },
    });
    return response.data.data || response.data;
  },

  /**
   * Obtener conteo de notificaciones no leídas
   * @returns {Promise<number>} Cantidad de no leídas
   */
  getConteoNoLeidas: async function() {
    const response = await apiClient.get('/notificaciones/count');
    return response.data.count || response.data;
  },

  /**
   * Marcar una notificación como leída
   * @param {number|string} id - ID de la notificación
   * @returns {Promise<Object>} Notificación actualizada
   */
  marcarLeida: async function(id) {
    const response = await apiClient.patch('/notificaciones/' + id + '/leer');
    return response.data;
  },

  /**
   * Marcar todas las notificaciones como leídas
   * @returns {Promise<Object>} Resultado
   */
  marcarTodasLeidas: async function() {
    const response = await apiClient.patch('/notificaciones/leer-todas');
    return response.data;
  },

  /**
   * Eliminar una notificación
   * @param {number|string} id - ID de la notificación
   * @returns {Promise<void>}
   */
  eliminar: async function(id) {
    await apiClient.delete('/notificaciones/' + id);
  },

  /**
   * Eliminar todas las notificaciones leídas
   * @returns {Promise<void>}
   */
  eliminarLeidas: async function() {
    await apiClient.delete('/notificaciones/leidas');
  },

  /**
   * Crear una nueva notificación (admin)
   * @param {Object} data - Datos de la notificación
   * @returns {Promise<Object>} Notificación creada
   */
  crear: async function(data) {
    const response = await apiClient.post('/notificaciones', data);
    return response.data;
  },
};

export default notificacionesService;