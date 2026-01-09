/**
 * ============================================================================
 * ISTHO CRM - Servicio de Clientes
 * ============================================================================
 * Gestiona todas las operaciones relacionadas con clientes.
 * 
 * NOTA: Frontend y Backend usan snake_case, no se necesitan transformaciones.
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import apiClient from './client';
import { CLIENTES_ENDPOINTS } from './endpoints';

// ============================================================================
// SERVICIO DE CLIENTES
// ============================================================================

const clientesService = {
  
  // ──────────────────────────────────────────────────────────────────────────
  // LISTAR CLIENTES
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener lista de clientes con filtros y paginación
   * 
   * @param {Object} params - Parámetros de búsqueda
   * @param {number} [params.page=1] - Número de página
   * @param {number} [params.limit=10] - Registros por página
   * @param {string} [params.search] - Búsqueda por nombre, NIT, código
   * @param {string} [params.estado] - Filtro por estado
   * @param {string} [params.tipo_cliente] - Filtro por tipo
   * @param {string} [params.sector] - Filtro por sector
   * @returns {Promise<Object>} Lista de clientes con paginación
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(CLIENTES_ENDPOINTS.BASE, { params });
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener clientes',
        code: error.code || 'GET_CLIENTES_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // OBTENER CLIENTE POR ID
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener un cliente específico por su ID
   * 
   * @param {number|string} id - ID del cliente
   * @returns {Promise<Object>} Datos del cliente
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(CLIENTES_ENDPOINTS.BY_ID(id));
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener cliente',
        code: error.code || 'GET_CLIENTE_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // CREAR CLIENTE
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Crear un nuevo cliente
   * 
   * @param {Object} clienteData - Datos del cliente (snake_case)
   * @returns {Promise<Object>} Cliente creado
   */
  create: async (clienteData) => {
    try {
      console.log('📤 [Clientes] Creando:', clienteData);
      
      const response = await apiClient.post(CLIENTES_ENDPOINTS.BASE, clienteData);
      return response.data;
    } catch (error) {
      console.error('❌ [Clientes] Error al crear:', error.response?.data);
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al crear cliente',
        errors: error.response?.data?.errors || [],
        code: error.response?.data?.code || 'CREATE_CLIENTE_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // ACTUALIZAR CLIENTE
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Actualizar datos de un cliente existente
   * 
   * @param {number|string} id - ID del cliente
   * @param {Object} clienteData - Datos a actualizar (snake_case)
   * @returns {Promise<Object>} Cliente actualizado
   */
  update: async (id, clienteData) => {
    try {
      console.log('📤 [Clientes] Actualizando:', { id, data: clienteData });
      
      const response = await apiClient.put(CLIENTES_ENDPOINTS.BY_ID(id), clienteData);
      return response.data;
    } catch (error) {
      console.error('❌ [Clientes] Error al actualizar:', error.response?.data);
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al actualizar cliente',
        errors: error.response?.data?.errors || [],
        code: error.response?.data?.code || 'UPDATE_CLIENTE_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // ELIMINAR CLIENTE (Soft Delete)
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Eliminar un cliente (soft delete)
   * 
   * @param {number|string} id - ID del cliente
   * @returns {Promise<Object>}
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(CLIENTES_ENDPOINTS.BY_ID(id));
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al eliminar cliente',
        code: error.code || 'DELETE_CLIENTE_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // CAMBIAR ESTADO
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Cambiar el estado de un cliente
   * 
   * @param {number|string} id - ID del cliente
   * @param {string} estado - Nuevo estado ('activo'|'inactivo'|'suspendido')
   * @returns {Promise<Object>}
   */
  changeStatus: async (id, estado) => {
    return clientesService.update(id, { estado });
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // ESTADÍSTICAS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener estadísticas de clientes
   * 
   * @returns {Promise<Object>} Estadísticas
   */
  getStats: async () => {
    try {
      const response = await apiClient.get(CLIENTES_ENDPOINTS.STATS);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener estadísticas',
        code: error.code || 'GET_STATS_ERROR',
      };
    }
  },
  
  // ════════════════════════════════════════════════════════════════════════
  // CONTACTOS
  // ════════════════════════════════════════════════════════════════════════
  
  /**
   * Obtener contactos de un cliente
   * 
   * @param {number|string} clienteId - ID del cliente
   * @returns {Promise<Object>} Lista de contactos
   */
  getContactos: async (clienteId) => {
    try {
      const response = await apiClient.get(CLIENTES_ENDPOINTS.CONTACTOS(clienteId));
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener contactos',
        code: error.code || 'GET_CONTACTOS_ERROR',
      };
    }
  },
  
  /**
   * Crear un contacto para un cliente
   * 
   * @param {number|string} clienteId - ID del cliente
   * @param {Object} contactoData - Datos del contacto
   * @returns {Promise<Object>} Contacto creado
   */
  createContacto: async (clienteId, contactoData) => {
    try {
      const response = await apiClient.post(
        CLIENTES_ENDPOINTS.CONTACTOS(clienteId), 
        contactoData
      );
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al crear contacto',
        errors: error.response?.data?.errors || [],
        code: error.code || 'CREATE_CONTACTO_ERROR',
      };
    }
  },
  
  /**
   * Actualizar un contacto
   * 
   * @param {number|string} clienteId - ID del cliente
   * @param {number|string} contactoId - ID del contacto
   * @param {Object} contactoData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  updateContacto: async (clienteId, contactoId, contactoData) => {
    try {
      const response = await apiClient.put(
        CLIENTES_ENDPOINTS.CONTACTO_BY_ID(clienteId, contactoId), 
        contactoData
      );
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al actualizar contacto',
        errors: error.response?.data?.errors || [],
        code: error.code || 'UPDATE_CONTACTO_ERROR',
      };
    }
  },
  
  /**
   * Eliminar un contacto
   * 
   * @param {number|string} clienteId - ID del cliente
   * @param {number|string} contactoId - ID del contacto
   * @returns {Promise<Object>}
   */
  deleteContacto: async (clienteId, contactoId) => {
    try {
      const response = await apiClient.delete(
        CLIENTES_ENDPOINTS.CONTACTO_BY_ID(clienteId, contactoId)
      );
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al eliminar contacto',
        code: error.code || 'DELETE_CONTACTO_ERROR',
      };
    }
  },
  
  /**
   * Marcar contacto como principal
   * 
   * @param {number|string} clienteId - ID del cliente
   * @param {number|string} contactoId - ID del contacto
   * @returns {Promise<Object>}
   */
  setContactoPrincipal: async (clienteId, contactoId) => {
    return clientesService.updateContacto(clienteId, contactoId, { 
      es_principal: true 
    });
  },
  
  // ════════════════════════════════════════════════════════════════════════
  // BÚSQUEDA
  // ════════════════════════════════════════════════════════════════════════
  
  /**
   * Buscar clientes por término
   * 
   * @param {string} term - Término de búsqueda
   * @param {number} [limit=10] - Límite de resultados
   * @returns {Promise<Object>} Resultados de búsqueda
   */
  search: async (term, limit = 10) => {
    return clientesService.getAll({ search: term, limit });
  },
  
  /**
   * Obtener clientes activos (para selectores)
   * 
   * @returns {Promise<Object>} Lista de clientes activos
   */
  getActivos: async () => {
    return clientesService.getAll({ estado: 'activo', limit: 100 });
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default clientesService;