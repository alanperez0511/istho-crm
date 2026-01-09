/**
 * ============================================================================
 * ISTHO CRM - Servicio de Clientes
 * ============================================================================
 * Gestiona todas las operaciones relacionadas con clientes:
 * - CRUD de clientes
 * - Gestión de contactos
 * - Estadísticas
 * - Exportación
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
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
   * @param {string} [params.estado] - Filtro por estado ('activo'|'inactivo'|'suspendido'|'prospecto')
   * @param {string} [params.tipo_cliente] - Filtro por tipo ('corporativo'|'pyme'|'persona_natural'|'gobierno')
   * @param {string} [params.sector] - Filtro por sector
   * @param {string} [params.ciudad] - Filtro por ciudad
   * @returns {Promise<Object>} Lista de clientes con paginación
   * 
   * @example
   * const result = await clientesService.getAll({ 
   *   page: 1, 
   *   limit: 10, 
   *   estado: 'activo' 
   * });
   * // result.data = [{ id, codigo_cliente, razon_social, ... }]
   * // result.pagination = { total, page, limit, totalPages }
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(CLIENTES_ENDPOINTS.BASE, { params });
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener clientes',
        code: error.code || 'GET_CLIENTES_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // OBTENER CLIENTE POR ID
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener un cliente específico por su ID
   * Incluye información completa del cliente
   * 
   * @param {number|string} id - ID del cliente
   * @returns {Promise<Object>} Datos del cliente
   * 
   * @example
   * const cliente = await clientesService.getById(1);
   * // cliente.data = { id, codigo_cliente, razon_social, nit, contactos: [...], ... }
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(CLIENTES_ENDPOINTS.BY_ID(id));
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener cliente',
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
   * @param {Object} clienteData - Datos del cliente
   * @param {string} clienteData.razon_social - Nombre de la empresa (requerido)
   * @param {string} clienteData.nit - NIT con dígito de verificación (requerido)
   * @param {string} [clienteData.direccion] - Dirección principal
   * @param {string} [clienteData.ciudad] - Ciudad
   * @param {string} [clienteData.departamento] - Departamento
   * @param {string} [clienteData.telefono] - Teléfono fijo
   * @param {string} [clienteData.celular] - Celular
   * @param {string} [clienteData.email] - Email corporativo
   * @param {string} [clienteData.sitio_web] - Sitio web
   * @param {string} [clienteData.tipo_cliente] - Tipo ('corporativo'|'pyme'|'persona_natural'|'gobierno')
   * @param {string} [clienteData.sector] - Sector económico
   * @param {number} [clienteData.credito_aprobado] - Límite de crédito en COP
   * @param {string} [clienteData.notas] - Observaciones
   * @returns {Promise<Object>} Cliente creado
   * 
   * @example
   * const result = await clientesService.create({
   *   razon_social: 'Nueva Empresa S.A.S',
   *   nit: '901234567-8',
   *   direccion: 'Carrera 50 #30-20',
   *   ciudad: 'Medellín',
   *   tipo_cliente: 'corporativo'
   * });
   */
  create: async (clienteData) => {
    try {
      const response = await apiClient.post(CLIENTES_ENDPOINTS.BASE, clienteData);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al crear cliente',
        errors: error.errors || [],
        code: error.code || 'CREATE_CLIENTE_ERROR',
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
   * @param {Object} clienteData - Datos a actualizar (parcial)
   * @returns {Promise<Object>} Cliente actualizado
   * 
   * @example
   * await clientesService.update(1, {
   *   direccion: 'Nueva Dirección #123',
   *   telefono: '604-5555555'
   * });
   */
  update: async (id, clienteData) => {
    try {
      const response = await apiClient.put(CLIENTES_ENDPOINTS.BY_ID(id), clienteData);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al actualizar cliente',
        errors: error.errors || [],
        code: error.code || 'UPDATE_CLIENTE_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // ELIMINAR CLIENTE (Soft Delete)
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Eliminar un cliente (soft delete - cambia estado a inactivo)
   * Solo puede ser ejecutado por administradores
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
        message: error.message || 'Error al eliminar cliente',
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
   * 
   * @example
   * const stats = await clientesService.getStats();
   * // stats.data = {
   * //   total: 24,
   * //   por_estado: { activo: 20, inactivo: 3, suspendido: 1 },
   * //   por_tipo: { corporativo: 15, pyme: 8, persona_natural: 1 },
   * //   nuevos_mes: 2
   * // }
   */
  getStats: async () => {
    try {
      const response = await apiClient.get(CLIENTES_ENDPOINTS.STATS);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener estadísticas',
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
        message: error.message || 'Error al obtener contactos',
        code: error.code || 'GET_CONTACTOS_ERROR',
      };
    }
  },
  
  /**
   * Crear un contacto para un cliente
   * 
   * @param {number|string} clienteId - ID del cliente
   * @param {Object} contactoData - Datos del contacto
   * @param {string} contactoData.nombre - Nombre completo (requerido)
   * @param {string} [contactoData.cargo] - Cargo en la empresa
   * @param {string} [contactoData.email] - Email del contacto
   * @param {string} [contactoData.telefono] - Teléfono fijo
   * @param {string} [contactoData.celular] - Celular
   * @param {boolean} [contactoData.es_principal=false] - Es contacto principal
   * @param {boolean} [contactoData.recibe_notificaciones=true] - Recibe emails automáticos
   * @returns {Promise<Object>} Contacto creado
   * 
   * @example
   * await clientesService.createContacto(1, {
   *   nombre: 'María García',
   *   cargo: 'Coordinadora Logística',
   *   email: 'mgarcia@empresa.com',
   *   es_principal: true,
   *   recibe_notificaciones: true
   * });
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
        message: error.message || 'Error al crear contacto',
        errors: error.errors || [],
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
        message: error.message || 'Error al actualizar contacto',
        errors: error.errors || [],
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
        message: error.message || 'Error al eliminar contacto',
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
   * Busca en nombre, NIT, código, ciudad
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