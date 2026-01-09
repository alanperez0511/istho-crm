/**
 * ============================================================================
 * ISTHO CRM - Hook useDashboard
 * ============================================================================
 * Hook para obtener y gestionar datos del dashboard principal.
 * Combina estadísticas de clientes, inventario, despachos y alertas.
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import clientesService from '../api/clientes.service';
import inventarioService from '../api/inventario.service';
import despachosService from '../api/despachos.service';

// ============================================================================
// ESTADOS INICIALES
// ============================================================================

const INITIAL_DASHBOARD_STATE = {
  clientes: null,
  inventario: null,
  despachos: null,
  alertas: [],
  despachosRecientes: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para datos del dashboard
 * 
 * @param {Object} options - Opciones de configuración
 * @param {boolean} [options.autoFetch=true] - Cargar automáticamente al montar
 * @param {number} [options.clienteId] - Filtrar por cliente (para rol cliente)
 * @param {number} [options.refreshInterval] - Intervalo de refresco en ms (0 = deshabilitado)
 * @returns {Object} Datos y funciones del dashboard
 * 
 * @example
 * const { 
 *   kpis, 
 *   alertas, 
 *   despachosRecientes, 
 *   loading,
 *   refresh 
 * } = useDashboard({ autoFetch: true });
 */
const useDashboard = (options = {}) => {
  const { 
    autoFetch = true, 
    clienteId = null,
    refreshInterval = 0 
  } = options;
  
  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────
  
  const [state, setState] = useState(INITIAL_DASHBOARD_STATE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ──────────────────────────────────────────────────────────────────────────
  // FETCH DATOS COMPLETOS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Cargar todos los datos del dashboard
   * @param {boolean} [showLoading=true] - Mostrar indicador de carga
   */
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const params = clienteId ? { cliente_id: clienteId } : {};
      
      // Ejecutar todas las peticiones en paralelo
      const [
        clientesResponse,
        inventarioResponse,
        despachosResponse,
        alertasResponse,
        despachosRecientesResponse,
      ] = await Promise.allSettled([
        clientesService.getStats(),
        inventarioService.getStats(params),
        despachosService.getStats(params),
        inventarioService.getAlertas(params),
        despachosService.getAll({ ...params, limit: 5, page: 1 }),
      ]);
      
      setState({
        clientes: clientesResponse.status === 'fulfilled' ? clientesResponse.value.data : null,
        inventario: inventarioResponse.status === 'fulfilled' ? inventarioResponse.value.data : null,
        despachos: despachosResponse.status === 'fulfilled' ? despachosResponse.value.data : null,
        alertas: alertasResponse.status === 'fulfilled' ? alertasResponse.value.data || [] : [],
        despachosRecientes: despachosRecientesResponse.status === 'fulfilled' 
          ? despachosRecientesResponse.value.data || [] 
          : [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al cargar datos del dashboard',
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, [clienteId]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // FETCH INDIVIDUAL DE MÓDULOS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Refrescar solo estadísticas de clientes
   */
  const refreshClientes = useCallback(async () => {
    try {
      const response = await clientesService.getStats();
      if (response.success) {
        setState(prev => ({ ...prev, clientes: response.data }));
      }
    } catch (error) {
      console.error('Error refrescando clientes:', error);
    }
  }, []);
  
  /**
   * Refrescar solo estadísticas de inventario
   */
  const refreshInventario = useCallback(async () => {
    try {
      const params = clienteId ? { cliente_id: clienteId } : {};
      const response = await inventarioService.getStats(params);
      if (response.success) {
        setState(prev => ({ ...prev, inventario: response.data }));
      }
    } catch (error) {
      console.error('Error refrescando inventario:', error);
    }
  }, [clienteId]);
  
  /**
   * Refrescar solo estadísticas de despachos
   */
  const refreshDespachos = useCallback(async () => {
    try {
      const params = clienteId ? { cliente_id: clienteId } : {};
      const response = await despachosService.getStats(params);
      if (response.success) {
        setState(prev => ({ ...prev, despachos: response.data }));
      }
    } catch (error) {
      console.error('Error refrescando despachos:', error);
    }
  }, [clienteId]);
  
  /**
   * Refrescar solo alertas
   */
  const refreshAlertas = useCallback(async () => {
    try {
      const params = clienteId ? { cliente_id: clienteId } : {};
      const response = await inventarioService.getAlertas(params);
      if (response.success) {
        setState(prev => ({ ...prev, alertas: response.data || [] }));
      }
    } catch (error) {
      console.error('Error refrescando alertas:', error);
    }
  }, [clienteId]);
  
  /**
   * Refrescar despachos recientes
   */
  const refreshDespachosRecientes = useCallback(async () => {
    try {
      const params = clienteId ? { cliente_id: clienteId } : {};
      const response = await despachosService.getAll({ ...params, limit: 5, page: 1 });
      if (response.success) {
        setState(prev => ({ ...prev, despachosRecientes: response.data || [] }));
      }
    } catch (error) {
      console.error('Error refrescando despachos recientes:', error);
    }
  }, [clienteId]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // REFRESH COMPLETO
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Refrescar todos los datos (sin mostrar loading completo)
   */
  const refresh = useCallback(() => {
    return fetchDashboardData(false);
  }, [fetchDashboardData]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // KPIs CALCULADOS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * KPIs principales del dashboard
   */
  const kpis = useMemo(() => {
    const { clientes, inventario, despachos } = state;
    
    return {
      // Clientes
      totalClientes: clientes?.total || 0,
      clientesActivos: clientes?.por_estado?.activo || 0,
      clientesNuevosMes: clientes?.nuevos_mes || 0,
      
      // Inventario
      totalProductos: inventario?.total_items || 0,
      valorInventario: inventario?.valor_total || 0,
      productosStockBajo: inventario?.items_stock_bajo || 0,
      productosAgotados: inventario?.items_agotados || 0,
      productosPorVencer: inventario?.items_por_vencer || 0,
      
      // Despachos
      totalDespachos: despachos?.total || 0,
      despachosPendientes: despachos?.por_estado?.pendiente || 0,
      despachosEnProceso: despachos?.por_estado?.en_proceso || 0,
      despachosCerrados: despachos?.por_estado?.cerrado || 0,
      despachosMes: despachos?.este_mes || 0,
      tasaCumplimiento: despachos?.tasa_cumplimiento || 0,
      
      // Ingresos vs Salidas
      totalIngresos: despachos?.por_tipo?.ingreso || 0,
      totalSalidas: despachos?.por_tipo?.salida || 0,
    };
  }, [state]);
  
  /**
   * Alertas agrupadas por tipo
   */
  const alertasPorTipo = useMemo(() => {
    const grouped = {
      stock_bajo: [],
      agotado: [],
      vencimiento: [],
    };
    
    state.alertas.forEach(alerta => {
      if (grouped[alerta.tipo]) {
        grouped[alerta.tipo].push(alerta);
      }
    });
    
    return grouped;
  }, [state.alertas]);
  
  /**
   * Total de alertas
   */
  const totalAlertas = useMemo(() => state.alertas.length, [state.alertas]);
  
  /**
   * Indicadores de salud del sistema
   */
  const healthIndicators = useMemo(() => {
    const { clientes, inventario, despachos } = state;
    
    // Calcular porcentajes de salud
    const clientesHealth = clientes 
      ? Math.round((clientes.por_estado?.activo / clientes.total) * 100) || 0
      : 0;
    
    const inventarioHealth = inventario
      ? Math.max(0, 100 - ((inventario.items_stock_bajo + inventario.items_agotados) / inventario.total_items * 100)) || 100
      : 100;
    
    const despachosHealth = despachos?.tasa_cumplimiento || 0;
    
    return {
      clientes: {
        value: clientesHealth,
        status: clientesHealth >= 80 ? 'good' : clientesHealth >= 60 ? 'warning' : 'critical',
        label: 'Clientes Activos',
      },
      inventario: {
        value: Math.round(inventarioHealth),
        status: inventarioHealth >= 90 ? 'good' : inventarioHealth >= 70 ? 'warning' : 'critical',
        label: 'Salud Inventario',
      },
      despachos: {
        value: Math.round(despachosHealth),
        status: despachosHealth >= 95 ? 'good' : despachosHealth >= 85 ? 'warning' : 'critical',
        label: 'Tasa Cumplimiento',
      },
    };
  }, [state]);
  
  /**
   * Datos para gráficos
   */
  const chartData = useMemo(() => {
    const { clientes, despachos, inventario } = state;
    
    return {
      // Clientes por estado
      clientesPorEstado: clientes?.por_estado 
        ? Object.entries(clientes.por_estado).map(([estado, cantidad]) => ({
            name: estado.charAt(0).toUpperCase() + estado.slice(1),
            value: cantidad,
          }))
        : [],
      
      // Despachos por estado
      despachosPorEstado: despachos?.por_estado
        ? Object.entries(despachos.por_estado).map(([estado, cantidad]) => ({
            name: estado.replace('_', ' ').charAt(0).toUpperCase() + estado.replace('_', ' ').slice(1),
            value: cantidad,
          }))
        : [],
      
      // Ingresos vs Salidas
      ingresosVsSalidas: despachos?.por_tipo
        ? [
            { name: 'Ingresos', value: despachos.por_tipo.ingreso || 0 },
            { name: 'Salidas', value: despachos.por_tipo.salida || 0 },
          ]
        : [],
      
      // Inventario por zona
      inventarioPorZona: inventario?.por_zona
        ? Object.entries(inventario.por_zona).map(([zona, cantidad]) => ({
            name: zona,
            value: cantidad,
          }))
        : [],
    };
  }, [state]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // AUTO FETCH
  // ──────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (autoFetch) {
      fetchDashboardData();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // ──────────────────────────────────────────────────────────────────────────
  // AUTO REFRESH
  // ──────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        refresh();
      }, refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, refresh]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // RETURN
  // ──────────────────────────────────────────────────────────────────────────
  
  return {
    // Estados principales
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    isRefreshing,
    
    // Datos crudos
    clientesStats: state.clientes,
    inventarioStats: state.inventario,
    despachosStats: state.despachos,
    alertas: state.alertas,
    despachosRecientes: state.despachosRecientes,
    
    // Datos calculados
    kpis,
    alertasPorTipo,
    totalAlertas,
    healthIndicators,
    chartData,
    
    // Acciones
    fetchDashboardData,
    refresh,
    refreshClientes,
    refreshInventario,
    refreshDespachos,
    refreshAlertas,
    refreshDespachosRecientes,
  };
};

// ============================================================================
// HOOK PARA ALERTAS DEL DASHBOARD
// ============================================================================

/**
 * Hook simplificado solo para alertas
 * Ideal para widgets y notificaciones
 * 
 * @example
 * const { alertas, totalAlertas, refresh } = useDashboardAlertas();
 */
export const useDashboardAlertas = (clienteId = null) => {
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
// HOOK PARA KPIs RÁPIDOS
// ============================================================================

/**
 * Hook simplificado para KPIs principales
 * Carga más rápida, solo estadísticas esenciales
 * 
 * @example
 * const { kpis, loading } = useDashboardKpis();
 */
export const useDashboardKpis = (clienteId = null) => {
  const { kpis, loading, error, refresh } = useDashboard({ 
    autoFetch: true, 
    clienteId 
  });
  
  return { kpis, loading, error, refresh };
};

// ============================================================================
// EXPORT
// ============================================================================

export default useDashboard;