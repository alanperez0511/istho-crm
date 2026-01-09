/**
 * ============================================================================
 * ISTHO CRM - Servicio de Inventario
 * ============================================================================
 * Gestiona todas las operaciones relacionadas con inventario:
 * - CRUD de registros de inventario
 * - Consultas por cliente
 * - Alertas de stock bajo y vencimiento
 * - Ajustes de cantidades
 * - Estadísticas
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import apiClient from './client';
import { INVENTARIO_ENDPOINTS } from './endpoints';

// ============================================================================
// SERVICIO DE INVENTARIO
// ============================================================================

const inventarioService = {
  
  // ──────────────────────────────────────────────────────────────────────────
  // LISTAR INVENTARIO
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener lista de inventario con filtros y paginación
   * 
   * @param {Object} params - Parámetros de búsqueda
   * @param {number} [params.page=1] - Número de página
   * @param {number} [params.limit=10] - Registros por página
   * @param {string} [params.search] - Búsqueda por SKU, producto, código de barras
   * @param {number} [params.cliente_id] - Filtro por cliente
   * @param {string} [params.categoria] - Filtro por categoría
   * @param {string} [params.zona] - Filtro por zona ('Refrigerado'|'Seco'|'Químico')
   * @param {string} [params.estado] - Filtro por estado ('disponible'|'reservado'|'dañado'|'cuarentena'|'vencido')
   * @param {boolean} [params.stock_bajo] - Solo items con stock bajo
   * @param {boolean} [params.proximo_vencer] - Solo items próximos a vencer
   * @returns {Promise<Object>} Lista de inventario con paginación
   * 
   * @example
   * const result = await inventarioService.getAll({ 
   *   cliente_id: 1, 
   *   stock_bajo: true 
   * });
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(INVENTARIO_ENDPOINTS.BASE, { params });
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener inventario',
        code: error.code || 'GET_INVENTARIO_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // OBTENER ITEM POR ID
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener un registro de inventario específico
   * Incluye información del cliente y movimientos recientes
   * 
   * @param {number|string} id - ID del registro de inventario
   * @returns {Promise<Object>} Datos del item
   * 
   * @example
   * const item = await inventarioService.getById(1);
   * // item.data = { id, sku, producto, cantidad, cantidad_disponible, cliente, ... }
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(INVENTARIO_ENDPOINTS.BY_ID(id));
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener item de inventario',
        code: error.code || 'GET_ITEM_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // OBTENER INVENTARIO POR CLIENTE
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener todo el inventario de un cliente específico
   * 
   * @param {number|string} clienteId - ID del cliente
   * @param {Object} [params] - Parámetros adicionales de filtro
   * @returns {Promise<Object>} Inventario del cliente
   * 
   * @example
   * const inventario = await inventarioService.getByCliente(1);
   */
  getByCliente: async (clienteId, params = {}) => {
    try {
      const response = await apiClient.get(
        INVENTARIO_ENDPOINTS.BY_CLIENTE(clienteId), 
        { params }
      );
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener inventario del cliente',
        code: error.code || 'GET_CLIENTE_INVENTARIO_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // CREAR REGISTRO DE INVENTARIO
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Crear un nuevo registro de inventario
   * 
   * @param {Object} itemData - Datos del item
   * @param {number} itemData.cliente_id - ID del cliente (requerido)
   * @param {string} itemData.sku - Código del producto (requerido)
   * @param {string} itemData.producto - Nombre del producto (requerido)
   * @param {number} itemData.cantidad - Stock actual (requerido)
   * @param {string} [itemData.codigo_barras] - Código de barras EAN/UPC
   * @param {string} [itemData.descripcion] - Descripción del producto
   * @param {string} [itemData.categoria] - Categoría
   * @param {string} [itemData.unidad_medida='UND'] - Unidad de medida
   * @param {number} [itemData.stock_minimo] - Stock mínimo para alertas
   * @param {number} [itemData.stock_maximo] - Stock máximo recomendado
   * @param {string} [itemData.ubicacion] - Ubicación en bodega (ej: A-01-02)
   * @param {string} [itemData.zona] - Zona ('Refrigerado'|'Seco'|'Químico')
   * @param {string} [itemData.lote] - Número de lote
   * @param {string} [itemData.fecha_vencimiento] - Fecha de vencimiento (YYYY-MM-DD)
   * @param {number} [itemData.costo_unitario] - Costo unitario en COP
   * @returns {Promise<Object>} Item creado
   * 
   * @example
   * const result = await inventarioService.create({
   *   cliente_id: 1,
   *   sku: 'LECHE-001',
   *   producto: 'Leche Entera 1L',
   *   cantidad: 500,
   *   unidad_medida: 'UND',
   *   stock_minimo: 100,
   *   zona: 'Refrigerado',
   *   fecha_vencimiento: '2026-03-15'
   * });
   */
  create: async (itemData) => {
    try {
      const response = await apiClient.post(INVENTARIO_ENDPOINTS.BASE, itemData);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al crear registro de inventario',
        errors: error.errors || [],
        code: error.code || 'CREATE_ITEM_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // ACTUALIZAR REGISTRO
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Actualizar un registro de inventario existente
   * 
   * @param {number|string} id - ID del registro
   * @param {Object} itemData - Datos a actualizar (parcial)
   * @returns {Promise<Object>} Item actualizado
   */
  update: async (id, itemData) => {
    try {
      const response = await apiClient.put(INVENTARIO_ENDPOINTS.BY_ID(id), itemData);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al actualizar inventario',
        errors: error.errors || [],
        code: error.code || 'UPDATE_ITEM_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // AJUSTAR CANTIDAD
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Ajustar la cantidad de un item de inventario
   * Registra el movimiento en el historial
   * 
   * @param {number|string} id - ID del registro
   * @param {Object} ajusteData - Datos del ajuste
   * @param {number} ajusteData.cantidad - Cantidad a ajustar (positiva o negativa)
   * @param {string} ajusteData.tipo - Tipo de ajuste ('entrada'|'salida'|'ajuste')
   * @param {string} [ajusteData.motivo] - Motivo del ajuste
   * @param {string} [ajusteData.referencia] - Documento de referencia
   * @returns {Promise<Object>} Item con cantidad actualizada
   * 
   * @example
   * // Entrada de mercancía
   * await inventarioService.ajustar(1, {
   *   cantidad: 100,
   *   tipo: 'entrada',
   *   motivo: 'Recepción de pedido',
   *   referencia: 'OC-2026-001'
   * });
   * 
   * // Salida de mercancía
   * await inventarioService.ajustar(1, {
   *   cantidad: -50,
   *   tipo: 'salida',
   *   motivo: 'Despacho a cliente',
   *   referencia: 'DSP-2026-001'
   * });
   */
  ajustar: async (id, ajusteData) => {
    try {
      const response = await apiClient.post(
        INVENTARIO_ENDPOINTS.AJUSTAR(id), 
        ajusteData
      );
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al ajustar inventario',
        errors: error.errors || [],
        code: error.code || 'AJUSTAR_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // ELIMINAR REGISTRO
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Eliminar un registro de inventario
   * Solo si no tiene movimientos asociados
   * 
   * @param {number|string} id - ID del registro
   * @returns {Promise<Object>}
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(INVENTARIO_ENDPOINTS.BY_ID(id));
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al eliminar registro',
        code: error.code || 'DELETE_ITEM_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // ALERTAS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener alertas de inventario
   * Incluye stock bajo, agotado y próximo a vencer
   * 
   * @param {Object} [params] - Parámetros de filtro
   * @param {number} [params.cliente_id] - Filtrar por cliente
   * @param {string} [params.tipo] - Tipo de alerta ('stock_bajo'|'agotado'|'vencimiento')
   * @returns {Promise<Object>} Lista de alertas
   * 
   * @example
   * const alertas = await inventarioService.getAlertas();
   * // alertas.data = [
   * //   { id, tipo: 'stock_bajo', producto, cantidad, stock_minimo, cliente },
   * //   { id, tipo: 'vencimiento', producto, fecha_vencimiento, dias_restantes },
   * // ]
   */
  getAlertas: async (params = {}) => {
    try {
      const response = await apiClient.get(INVENTARIO_ENDPOINTS.ALERTAS, { params });
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener alertas',
        code: error.code || 'GET_ALERTAS_ERROR',
      };
    }
  },
  
  // ──────────────────────────────────────────────────────────────────────────
  // ESTADÍSTICAS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener estadísticas de inventario
   * 
   * @param {Object} [params] - Parámetros de filtro
   * @param {number} [params.cliente_id] - Filtrar por cliente
   * @returns {Promise<Object>} Estadísticas
   * 
   * @example
   * const stats = await inventarioService.getStats();
   * // stats.data = {
   * //   total_items: 1250,
   * //   valor_total: 125000000,
   * //   items_stock_bajo: 15,
   * //   items_agotados: 3,
   * //   items_por_vencer: 8,
   * //   por_zona: { Refrigerado: 450, Seco: 700, Químico: 100 },
   * //   por_categoria: { Lácteos: 300, Construcción: 200, ... }
   * // }
   */
  getStats: async (params = {}) => {
    try {
      const response = await apiClient.get(INVENTARIO_ENDPOINTS.STATS, { params });
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
  // UTILIDADES
  // ════════════════════════════════════════════════════════════════════════
  
  /**
   * Buscar productos por término
   * Busca en SKU, producto, código de barras
   * 
   * @param {string} term - Término de búsqueda
   * @param {number} [clienteId] - Filtrar por cliente
   * @param {number} [limit=10] - Límite de resultados
   * @returns {Promise<Object>} Resultados de búsqueda
   */
  search: async (term, clienteId = null, limit = 10) => {
    const params = { search: term, limit };
    if (clienteId) params.cliente_id = clienteId;
    return inventarioService.getAll(params);
  },
  
  /**
   * Obtener items con stock bajo
   * 
   * @param {number} [clienteId] - Filtrar por cliente
   * @returns {Promise<Object>} Items con stock bajo
   */
  getStockBajo: async (clienteId = null) => {
    const params = { stock_bajo: true };
    if (clienteId) params.cliente_id = clienteId;
    return inventarioService.getAll(params);
  },
  
  /**
   * Obtener items próximos a vencer
   * 
   * @param {number} [dias=30] - Días hasta vencimiento
   * @param {number} [clienteId] - Filtrar por cliente
   * @returns {Promise<Object>} Items próximos a vencer
   */
  getProximosVencer: async (dias = 30, clienteId = null) => {
    const params = { proximo_vencer: true, dias_vencimiento: dias };
    if (clienteId) params.cliente_id = clienteId;
    return inventarioService.getAll(params);
  },
  
  /**
   * Obtener categorías únicas
   * 
   * @returns {Promise<string[]>} Lista de categorías
   */
  getCategorias: async () => {
    try {
      // Esto podría ser un endpoint dedicado, por ahora extraemos de stats
      const stats = await inventarioService.getStats();
      return Object.keys(stats.data?.por_categoria || {});
    } catch {
      return [];
    }
  },
  
  /**
   * Obtener zonas únicas
   * 
   * @returns {string[]} Lista de zonas predefinidas
   */
  getZonas: () => {
    return ['Refrigerado', 'Seco', 'Químico', 'Peligroso', 'General'];
  },
  
  /**
   * Obtener unidades de medida
   * 
   * @returns {string[]} Lista de unidades
   */
  getUnidadesMedida: () => {
    return ['UND', 'KG', 'LT', 'CAJ', 'PAQ', 'BTO', 'GAL', 'M3'];
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default inventarioService;