/**
 * ============================================================================
 * ISTHO CRM - Hook useInventario
 * ============================================================================
 * Hook personalizado para gestión de inventario.
 * Provee estado, funciones CRUD, alertas y utilidades para el módulo.
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import inventarioService from '../api/inventario.service';

// ============================================================================
// ESTADOS INICIALES
// ============================================================================

const INITIAL_LIST_STATE = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const INITIAL_DETAIL_STATE = {
  data: null,
  loading: false,
  error: null,
};

const INITIAL_ALERTAS_STATE = {
  data: [],
  loading: false,
  error: null,
};

const INITIAL_STATS_STATE = {
  data: null,
  loading: false,
  error: null,
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para gestión completa de inventario
 * 
 * @param {Object} options - Opciones de configuración
 * @param {boolean} [options.autoFetch=false] - Cargar lista automáticamente
 * @param {boolean} [options.autoFetchAlertas=false] - Cargar alertas automáticamente
 * @param {number} [options.clienteId] - Filtrar por cliente específico
 * @param {Object} [options.initialFilters={}] - Filtros iniciales
 * @returns {Object} Estado y funciones de inventario
 * 
 * @example
 * const { 
 *   inventario, 
 *   alertas,
 *   loading, 
 *   fetchInventario,
 *   ajustarCantidad 
 * } = useInventario({ autoFetch: true, autoFetchAlertas: true });
 */
const useInventario = (options = {}) => {
  const { 
    autoFetch = false, 
    autoFetchAlertas = false,
    clienteId = null,
    initialFilters = {} 
  } = options;
  
  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────
  
  const [listState, setListState] = useState(INITIAL_LIST_STATE);
  const [detailState, setDetailState] = useState(INITIAL_DETAIL_STATE);
  const [alertasState, setAlertasState] = useState(INITIAL_ALERTAS_STATE);
  const [statsState, setStatsState] = useState(INITIAL_STATS_STATE);
  const [filters, setFilters] = useState({
    ...initialFilters,
    ...(clienteId ? { cliente_id: clienteId } : {}),
  });
  
  // ──────────────────────────────────────────────────────────────────────────
  // FETCH LISTA DE INVENTARIO
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener lista de inventario con filtros y paginación
   * @param {Object} params - Parámetros de búsqueda
   */
  const fetchInventario = useCallback(async (params = {}) => {
    setListState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const mergedParams = { ...filters, ...params };
      const response = await inventarioService.getAll(mergedParams);
      
      if (response.success) {
        setListState({
          data: response.data || [],
          pagination: response.pagination || INITIAL_LIST_STATE.pagination,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Error al cargar inventario';
      setListState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [filters]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // FETCH INVENTARIO POR CLIENTE
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener inventario de un cliente específico
   * @param {number|string} idCliente - ID del cliente
   * @param {Object} params - Parámetros adicionales
   */
  const fetchByCliente = useCallback(async (idCliente, params = {}) => {
    setListState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await inventarioService.getByCliente(idCliente, params);
      
      if (response.success) {
        setListState({
          data: response.data || [],
          pagination: response.pagination || INITIAL_LIST_STATE.pagination,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Error al cargar inventario del cliente';
      setListState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // FETCH ITEM POR ID
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener un item de inventario específico
   * @param {number|string} id - ID del registro
   */
  const fetchItem = useCallback(async (id) => {
    setDetailState({ data: null, loading: true, error: null });
    
    try {
      const response = await inventarioService.getById(id);
      
      if (response.success) {
        setDetailState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Error al cargar item';
      setDetailState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // CREAR ITEM
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Crear un nuevo registro de inventario
   * @param {Object} itemData - Datos del item
   */
  const createItem = useCallback(async (itemData) => {
    setListState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await inventarioService.create(itemData);
      
      if (response.success) {
        // Agregar a la lista
        setListState(prev => ({
          ...prev,
          data: [response.data, ...prev.data],
          pagination: {
            ...prev.pagination,
            total: prev.pagination.total + 1,
          },
          loading: false,
        }));
      } else {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      setListState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // ACTUALIZAR ITEM
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Actualizar un item existente
   * @param {number|string} id - ID del registro
   * @param {Object} itemData - Datos a actualizar
   */
  const updateItem = useCallback(async (id, itemData) => {
    try {
      const response = await inventarioService.update(id, itemData);
      
      if (response.success) {
        // Actualizar en la lista
        setListState(prev => ({
          ...prev,
          data: prev.data.map(item => 
            item.id === id ? { ...item, ...response.data } : item
          ),
        }));
        
        // Actualizar en detalle si es el mismo
        setDetailState(prev => {
          if (prev.data?.id === id) {
            return { ...prev, data: { ...prev.data, ...response.data } };
          }
          return prev;
        });
      } else {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // AJUSTAR CANTIDAD
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Ajustar cantidad de un item
   * @param {number|string} id - ID del registro
   * @param {Object} ajusteData - Datos del ajuste
   * @param {number} ajusteData.cantidad - Cantidad (+ o -)
   * @param {string} ajusteData.tipo - Tipo de ajuste
   * @param {string} [ajusteData.motivo] - Motivo
   * @param {string} [ajusteData.referencia] - Documento referencia
   */
  const ajustarCantidad = useCallback(async (id, ajusteData) => {
    try {
      const response = await inventarioService.ajustar(id, ajusteData);
      
      if (response.success) {
        // Actualizar en la lista
        setListState(prev => ({
          ...prev,
          data: prev.data.map(item => 
            item.id === id ? { ...item, ...response.data } : item
          ),
        }));
        
        // Actualizar detalle
        setDetailState(prev => {
          if (prev.data?.id === id) {
            return { ...prev, data: { ...prev.data, ...response.data } };
          }
          return prev;
        });
      } else {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // ELIMINAR ITEM
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Eliminar un registro de inventario
   * @param {number|string} id - ID del registro
   */
  const deleteItem = useCallback(async (id) => {
    try {
      const response = await inventarioService.delete(id);
      
      if (response.success) {
        // Remover de la lista
        setListState(prev => ({
          ...prev,
          data: prev.data.filter(item => item.id !== id),
          pagination: {
            ...prev.pagination,
            total: prev.pagination.total - 1,
          },
        }));
        
        // Limpiar detalle si es el mismo
        setDetailState(prev => {
          if (prev.data?.id === id) {
            return INITIAL_DETAIL_STATE;
          }
          return prev;
        });
      } else {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // ALERTAS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener alertas de inventario
   * @param {Object} params - Parámetros de filtro
   */
  const fetchAlertas = useCallback(async (params = {}) => {
    setAlertasState({ data: [], loading: true, error: null });
    
    try {
      const mergedParams = clienteId ? { ...params, cliente_id: clienteId } : params;
      const response = await inventarioService.getAlertas(mergedParams);
      
      if (response.success) {
        setAlertasState({
          data: response.data || [],
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Error al cargar alertas';
      setAlertasState({
        data: [],
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [clienteId]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // ESTADÍSTICAS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Obtener estadísticas de inventario
   * @param {Object} params - Parámetros de filtro
   */
  const fetchStats = useCallback(async (params = {}) => {
    setStatsState({ data: null, loading: true, error: null });
    
    try {
      const mergedParams = clienteId ? { ...params, cliente_id: clienteId } : params;
      const response = await inventarioService.getStats(mergedParams);
      
      if (response.success) {
        setStatsState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Error al cargar estadísticas';
      setStatsState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [clienteId]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // PAGINACIÓN
  // ──────────────────────────────────────────────────────────────────────────
  
  const goToPage = useCallback((page) => {
    fetchInventario({ page });
  }, [fetchInventario]);
  
  const setPageSize = useCallback((limit) => {
    fetchInventario({ page: 1, limit });
  }, [fetchInventario]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // FILTROS
  // ──────────────────────────────────────────────────────────────────────────
  
  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    fetchInventario({ ...newFilters, page: 1 });
  }, [fetchInventario]);
  
  const clearFilters = useCallback(() => {
    const baseFilters = clienteId ? { cliente_id: clienteId } : {};
    setFilters(baseFilters);
    fetchInventario({ page: 1, ...baseFilters });
  }, [fetchInventario, clienteId]);
  
  const search = useCallback((term) => {
    applyFilters({ search: term });
  }, [applyFilters]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // FILTROS ESPECIALIZADOS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Filtrar por stock bajo
   */
  const filterStockBajo = useCallback(() => {
    applyFilters({ stock_bajo: true });
  }, [applyFilters]);
  
  /**
   * Filtrar por próximos a vencer
   * @param {number} dias - Días para vencimiento
   */
  const filterProximosVencer = useCallback((dias = 30) => {
    applyFilters({ proximo_vencer: true, dias_vencimiento: dias });
  }, [applyFilters]);
  
  /**
   * Filtrar por zona
   * @param {string} zona - Zona de almacenamiento
   */
  const filterByZona = useCallback((zona) => {
    applyFilters({ zona });
  }, [applyFilters]);
  
  /**
   * Filtrar por categoría
   * @param {string} categoria - Categoría
   */
  const filterByCategoria = useCallback((categoria) => {
    applyFilters({ categoria });
  }, [applyFilters]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ──────────────────────────────────────────────────────────────────────────
  
  const refresh = useCallback(() => {
    fetchInventario({ page: listState.pagination.page });
  }, [fetchInventario, listState.pagination.page]);
  
  const refreshAlertas = useCallback(() => {
    fetchAlertas();
  }, [fetchAlertas]);
  
  const clearDetail = useCallback(() => {
    setDetailState(INITIAL_DETAIL_STATE);
  }, []);
  
  const clearErrors = useCallback(() => {
    setListState(prev => ({ ...prev, error: null }));
    setDetailState(prev => ({ ...prev, error: null }));
    setAlertasState(prev => ({ ...prev, error: null }));
    setStatsState(prev => ({ ...prev, error: null }));
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // DATOS CALCULADOS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Alertas agrupadas por tipo
   */
  const alertasPorTipo = useMemo(() => {
    const grouped = {
      stock_bajo: [],
      agotado: [],
      vencimiento: [],
    };
    
    alertasState.data.forEach(alerta => {
      if (grouped[alerta.tipo]) {
        grouped[alerta.tipo].push(alerta);
      }
    });
    
    return grouped;
  }, [alertasState.data]);
  
  /**
   * Total de alertas
   */
  const totalAlertas = useMemo(() => alertasState.data.length, [alertasState.data]);
  
  /**
   * Constantes útiles
   */
  const zonas = useMemo(() => inventarioService.getZonas(), []);
  const unidadesMedida = useMemo(() => inventarioService.getUnidadesMedida(), []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // AUTO FETCH
  // ──────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (autoFetch) {
      fetchInventario();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    if (autoFetchAlertas) {
      fetchAlertas();
    }
  }, [autoFetchAlertas]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // ──────────────────────────────────────────────────────────────────────────
  // RETURN
  // ──────────────────────────────────────────────────────────────────────────
  
  return {
    // Estado de lista
    inventario: listState.data,
    pagination: listState.pagination,
    loading: listState.loading,
    error: listState.error,
    
    // Estado de detalle
    item: detailState.data,
    loadingDetail: detailState.loading,
    errorDetail: detailState.error,
    
    // Estado de alertas
    alertas: alertasState.data,
    alertasPorTipo,
    totalAlertas,
    loadingAlertas: alertasState.loading,
    errorAlertas: alertasState.error,
    
    // Estado de estadísticas
    stats: statsState.data,
    loadingStats: statsState.loading,
    errorStats: statsState.error,
    
    // Filtros
    filters,
    
    // Acciones principales
    fetchInventario,
    fetchByCliente,
    fetchItem,
    createItem,
    updateItem,
    ajustarCantidad,
    deleteItem,
    fetchAlertas,
    fetchStats,
    
    // Paginación
    goToPage,
    setPageSize,
    
    // Filtros
    applyFilters,
    clearFilters,
    search,
    filterStockBajo,
    filterProximosVencer,
    filterByZona,
    filterByCategoria,
    
    // Utilidades
    refresh,
    refreshAlertas,
    clearDetail,
    clearErrors,
    
    // Constantes
    zonas,
    unidadesMedida,
  };
};

// ============================================================================
// HOOK PARA ALERTAS SOLAMENTE
// ============================================================================

/**
 * Hook simplificado solo para alertas de inventario
 * Ideal para widgets y notificaciones
 * 
 * @example
 * const { alertas, totalAlertas, refresh } = useInventarioAlertas();
 */
export const useInventarioAlertas = (clienteId = null) => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchAlertas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = clienteId ? { cliente_id: clienteId } : {};
      const response = await inventarioService.getAlertas(params);
      if (response.success) {
        setAlertas(response.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);
  
  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);
  
  const alertasPorTipo = useMemo(() => {
    const grouped = { stock_bajo: [], agotado: [], vencimiento: [] };
    alertas.forEach(a => grouped[a.tipo]?.push(a));
    return grouped;
  }, [alertas]);
  
  return { 
    alertas, 
    alertasPorTipo,
    totalAlertas: alertas.length,
    loading, 
    error, 
    refresh: fetchAlertas 
  };
};

// ============================================================================
// EXPORT
// ============================================================================

export default useInventario;