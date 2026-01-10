/**
 * ============================================================================
 * ISTHO CRM - Servicio de Notificaciones (Frontend)
 * ============================================================================
 * Conecta con el API de notificaciones del backend.
 * 
 * CORRECCIÓN: Compatible con client.js v1.1.0 (devuelve response.data directamente)
 * 
 * @author Coordinación TI ISTHO
 * @version 1.1.0
 * @date Enero 2026
 */

import client from './client';

const BASE_URL = '/notificaciones';

const notificacionesService = {
  /**
   * Obtener todas las notificaciones del usuario
   * @param {Object} params - { page, limit, tipo, no_leidas }
   * @returns {Promise<Array>}
   */
  async getAll(params = {}) {
    try {
      const response = await client.get(BASE_URL, { params });
      // client.js v1.1.0 ya devuelve response.data
      return response.data || response || [];
    } catch (error) {
      console.error('[notificacionesService] Error en getAll:', error);
      return [];
    }
  },

  /**
   * Contar notificaciones no leídas
   * @returns {Promise<number>}
   */
  async getCount() {
    try {
      const response = await client.get(`${BASE_URL}/count`);
      return response.data?.count || response?.count || 0;
    } catch (error) {
      console.error('[notificacionesService] Error en getCount:', error);
      return 0;
    }
  },

  /**
   * Marcar una notificación como leída
   * @param {number} id - ID de la notificación
   * @returns {Promise<boolean>}
   */
  async marcarLeida(id) {
    try {
      await client.put(`${BASE_URL}/${id}/leer`);
      return true;
    } catch (error) {
      console.error('[notificacionesService] Error en marcarLeida:', error);
      throw error;
    }
  },

  /**
   * Marcar todas las notificaciones como leídas
   * @returns {Promise<boolean>}
   */
  async marcarTodasLeidas() {
    try {
      await client.put(`${BASE_URL}/leer-todas`);
      return true;
    } catch (error) {
      console.error('[notificacionesService] Error en marcarTodasLeidas:', error);
      throw error;
    }
  },

  /**
   * Eliminar una notificación
   * @param {number} id - ID de la notificación
   * @returns {Promise<boolean>}
   */
  async eliminar(id) {
    try {
      await client.delete(`${BASE_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('[notificacionesService] Error en eliminar:', error);
      throw error;
    }
  },

  /**
   * Eliminar todas las notificaciones leídas
   * @returns {Promise<boolean>}
   */
  async eliminarLeidas() {
    try {
      await client.delete(`${BASE_URL}/leidas`);
      return true;
    } catch (error) {
      console.error('[notificacionesService] Error en eliminarLeidas:', error);
      throw error;
    }
  },

  /**
   * Crear una notificación (admin)
   * @param {Object} data - { usuario_id, tipo, titulo, mensaje, prioridad, accion_url }
   * @returns {Promise<Object>}
   */
  async crear(data) {
    try {
      const response = await client.post(BASE_URL, data);
      return response.data || response;
    } catch (error) {
      console.error('[notificacionesService] Error en crear:', error);
      throw error;
    }
  },
};

export default notificacionesService;