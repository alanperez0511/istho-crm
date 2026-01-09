/**
 * ============================================================================
 * ISTHO CRM - Hook useDashboard (CORREGIDO)
 * ============================================================================
 * Hook para obtener y gestionar datos del dashboard principal.
 * Usa el endpoint consolidado /reportes/dashboard del backend.
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import reportesService from '../api/reportes.service';

// ============================================================================
// ESTADOS INICIALES
// ============================================================================

const INITIAL_DASHBOARD_STATE = {
  operaciones: null,
  inventario: null,
  clientes: null,
  ultimasOperaciones: [],
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
 * @param {number} [options.refreshInterval] - Intervalo de refresco en ms (0 = deshabilitado)
 * @returns {Object} Datos y funciones del dashboard
 * 
 * @example
 * const { 
 *   kpis, 
 *   alertas, 
 *   ultimasOperaciones, 
 *   loading,
 *   refresh 
 * } = useDashboard({ autoFetch: true });
 */
const useDashboard = (options = {}) => {
  const { 
    autoFetch = true, 
    refreshInterval = 0 
  } = options;
  
  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────
  
  const [state, setState] = useState(INITIAL_DASHBOARD_STATE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ──────────────────────────────────────────────────────────────────────────
  // FETCH DATOS DEL DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Cargar todos los datos del dashboard desde el endpoint consolidado
   * @param {boolean} [showLoading=true] - Mostrar indicador de carga
   */
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    } else {
      setIsRefreshing(true);
    }
    
    try {
      // Usar el endpoint consolidado del backend
      const response = await reportesService.getDashboard();
      
      if (response.success) {
        setState({
          operaciones: response.data.operaciones || null,
          inventario: response.data.inventario || null,
          clientes: response.data.clientes || null,
          ultimasOperaciones: response.data.ultimasOperaciones || [],
          loading: false,
          error: null,
          lastUpdated: new Date(),
        });
      } else {
        throw new Error(response.message || 'Error al cargar dashboard');
      }
      
    } catch (error) {
      console.error('❌ Error en dashboard:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al cargar datos del dashboard',
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  
  // ──────────────────────────────────────────────────────────────────────────
  // REFRESH
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
   * Mapeados desde la estructura del backend
   */
  const kpis = useMemo(() => {
    const { operaciones, inventario, clientes } = state;
    
    return {
      // ═══════════════════════════════════════════════════════════════════════
      // CLIENTES
      // ═══════════════════════════════════════════════════════════════════════
      totalClientes: clientes?.total || 0,
      clientesActivos: clientes?.activos || 0,
      clientesNuevosMes: clientes?.nuevosMes || 0,
      
      // ═══════════════════════════════════════════════════════════════════════
      // INVENTARIO
      // ═══════════════════════════════════════════════════════════════════════
      totalProductos: inventario?.totalItems || 0,
      totalUnidades: inventario?.totalUnidades || 0,
      valorInventario: inventario?.valorTotal || 0,
      
      // Alertas de inventario
      productosStockBajo: inventario?.alertas?.stockBajo || 0,
      productosPorVencer: inventario?.alertas?.porVencer || 0,
      productosAgotados: 0, // No viene del backend actual
      
      // ═══════════════════════════════════════════════════════════════════════
      // OPERACIONES (Despachos)
      // ═══════════════════════════════════════════════════════════════════════
      totalDespachos: operaciones?.total || 0,
      despachosMes: operaciones?.mes || 0,
      despachosSemana: operaciones?.semana || 0,
      despachosPendientes: operaciones?.pendientes || 0,
      
      // Por estado
      despachosEnProceso: operaciones?.porEstado?.en_proceso || 0,
      despachosCerrados: operaciones?.porEstado?.cerrado || 0,
      despachosAnulados: operaciones?.porEstado?.anulado || 0,
      
      // Por tipo
      totalIngresos: operaciones?.porTipo?.ingreso || 0,
      totalSalidas: operaciones?.porTipo?.salida || 0,
      
      // Tasa de cumplimiento (calculada)
      tasaCumplimiento: operaciones?.total > 0 
        ? Math.round((operaciones?.porEstado?.cerrado || 0) / operaciones.total * 100) 
        : 0,
    };
  }, [state]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // ALERTAS (Array plano para compatibilidad)
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Alertas como array plano para widgets
   */
  const alertas = useMemo(() => {
    const { inventario } = state;
    const alertasArray = [];
    
    // Stock bajo
    if (inventario?.alertas?.stockBajo > 0) {
      alertasArray.push({
        id: 'stock_bajo',
        tipo: 'stock_bajo',
        titulo: 'Stock Bajo',
        cantidad: inventario.alertas.stockBajo,
        color: 'amber',
        icon: 'AlertTriangle',
      });
    }
    
    // Por vencer
    if (inventario?.alertas?.porVencer > 0) {
      alertasArray.push({
        id: 'por_vencer',
        tipo: 'vencimiento',
        titulo: 'Próximos a Vencer',
        cantidad: inventario.alertas.porVencer,
        color: 'orange',
        icon: 'Clock',
      });
    }
    
    // Operaciones pendientes
    if (state.operaciones?.pendientes > 0) {
      alertasArray.push({
        id: 'pendientes',
        tipo: 'pendiente',
        titulo: 'Operaciones Pendientes',
        cantidad: state.operaciones.pendientes,
        color: 'blue',
        icon: 'Package',
      });
    }
    
    return alertasArray;
  }, [state]);
  
  /**
   * Alertas agrupadas por tipo (para compatibilidad)
   */
  const alertasPorTipo = useMemo(() => {
    return {
      stock_bajo: alertas.filter(a => a.tipo === 'stock_bajo'),
      vencimiento: alertas.filter(a => a.tipo === 'vencimiento'),
      pendiente: alertas.filter(a => a.tipo === 'pendiente'),
    };
  }, [alertas]);
  
  /**
   * Total de alertas
   */
  const totalAlertas = useMemo(() => alertas.length, [alertas]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // INDICADORES DE SALUD
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Indicadores de salud del sistema
   */
  const healthIndicators = useMemo(() => {
    const { clientes, inventario, operaciones } = state;
    
    // Clientes activos
    const clientesHealth = clientes?.total > 0
      ? Math.round((clientes.activos / clientes.total) * 100)
      : 0;
    
    // Inventario (menos alertas = mejor salud)
    const totalAlertas = (inventario?.alertas?.stockBajo || 0) + (inventario?.alertas?.porVencer || 0);
    const inventarioHealth = inventario?.totalItems > 0
      ? Math.max(0, 100 - (totalAlertas / inventario.totalItems * 100))
      : 100;
    
    // Operaciones cerradas
    const despachosHealth = operaciones?.total > 0
      ? Math.round((operaciones.porEstado?.cerrado || 0) / operaciones.total * 100)
      : 0;
    
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
        value: despachosHealth,
        status: despachosHealth >= 95 ? 'good' : despachosHealth >= 85 ? 'warning' : 'critical',
        label: 'Tasa Cumplimiento',
      },
    };
  }, [state]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // DATOS PARA GRÁFICOS
  // ──────────────────────────────────────────────────────────────────────────
  
  /**
   * Datos formateados para gráficos
   */
  const chartData = useMemo(() => {
    const { operaciones } = state;
    
    return {
      // Operaciones por estado
      despachosPorEstado: operaciones?.porEstado
        ? Object.entries(operaciones.porEstado).map(([estado, cantidad]) => ({
            name: estado.replace('_', ' ').charAt(0).toUpperCase() + estado.replace('_', ' ').slice(1),
            value: cantidad || 0,
          }))
        : [],
      
      // Ingresos vs Salidas
      ingresosVsSalidas: operaciones?.porTipo
        ? [
            { name: 'Ingresos', value: operaciones.porTipo.ingreso || 0 },
            { name: 'Salidas', value: operaciones.porTipo.salida || 0 },
          ]
        : [],
      
      // Tendencia mensual (placeholder - se puede expandir)
      tendenciaMensual: [],
    };
  }, [state]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // AUTO FETCH
  // ──────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (autoFetch) {
      fetchDashboardData();
    }
  }, [autoFetch, fetchDashboardData]);
  
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
    
    // Datos crudos del backend
    operacionesStats: state.operaciones,
    inventarioStats: state.inventario,
    clientesStats: state.clientes,
    ultimasOperaciones: state.ultimasOperaciones,
    
    // Alias para compatibilidad
    despachosStats: state.operaciones,
    despachosRecientes: state.ultimasOperaciones,
    
    // Datos calculados
    kpis,
    alertas,
    alertasPorTipo,
    totalAlertas,
    healthIndicators,
    chartData,
    
    // Acciones
    fetchDashboardData,
    refresh,
  };
};

// ============================================================================
// HOOK PARA ALERTAS SIMPLIFICADO
// ============================================================================

/**
 * Hook simplificado solo para alertas
 * 
 * @example
 * const { alertas, totalAlertas } = useDashboardAlertas();
 */
export const useDashboardAlertas = () => {
  const { alertas, alertasPorTipo, totalAlertas, loading, error, refresh } = useDashboard();
  
  return { 
    alertas, 
    alertasPorTipo,
    totalAlertas,
    loading, 
    error, 
    refresh 
  };
};

// ============================================================================
// HOOK PARA KPIs SIMPLIFICADO
// ============================================================================

/**
 * Hook simplificado para KPIs principales
 * 
 * @example
 * const { kpis, loading } = useDashboardKpis();
 */
export const useDashboardKpis = () => {
  const { kpis, loading, error, refresh } = useDashboard();
  
  return { kpis, loading, error, refresh };
};

// ============================================================================
// EXPORT
// ============================================================================

export default useDashboard;