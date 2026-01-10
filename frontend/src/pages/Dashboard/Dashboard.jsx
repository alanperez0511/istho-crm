/**
 * ============================================================================
 * ISTHO CRM - Dashboard (Fase 5 - Integración Completa)
 * ============================================================================
 * Dashboard conectado al backend real mediante hooks.
 * Muestra KPIs, gráficos, alertas y actividad reciente.
 * 
 * CORRECCIONES v2.1.0:
 * - Corregidos template literals
 * - Notificación inteligente según tipos de alerta reales
 * 
 * @author Coordinación TI ISTHO
 * @version 2.1.0
 * @date Enero 2026
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Truck, 
  Package, 
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Common Components
import { KpiCard, DataTable, AlertWidget } from '../../components/common';

// Charts
import { BarChart, PieChart } from '../../components/charts';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS INTEGRADOS
// ════════════════════════════════════════════════════════════════════════════
import { useAuth } from '../../context/AuthContext';
import useDashboard from '../../hooks/useDashboard';
import useNotification from '../../hooks/useNotification';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════════════

// KPIs Config
const KPI_CONFIG = [
  {
    id: 'clientes',
    title: 'Clientes Activos',
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    kpiKey: 'clientesActivos',
    changeKey: 'clientesNuevosMes',
    changePrefix: '+',
    changeSuffix: ' este mes',
  },
  {
    id: 'despachos',
    title: 'Despachos del Mes',
    icon: Truck,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    kpiKey: 'despachosMes',
  },
  {
    id: 'inventario',
    title: 'Productos en Stock',
    icon: Package,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    kpiKey: 'totalProductos',
  },
  {
    id: 'tasaEntrega',
    title: 'Tasa de Cumplimiento',
    icon: TrendingUp,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    kpiKey: 'tasaCumplimiento',
    suffix: '%',
  },
];

// Columnas de tabla de despachos
const DESPACHOS_COLUMNS = [
  { key: 'numero_operacion', label: 'ID', type: 'id' },
  { 
    key: 'cliente', 
    label: 'Cliente',
    render: (value, row) => row.cliente?.razon_social || 'Sin cliente'
  },
  { 
    key: 'tipo', 
    label: 'Tipo',
    render: (value) => value === 'ingreso' ? 'Ingreso' : 'Salida'
  },
  { key: 'estado', label: 'Estado', type: 'status' },
  { 
    key: 'created_at', 
    label: 'Fecha',
    render: (value) => new Date(value).toLocaleDateString('es-CO')
  },
];

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const Dashboard = () => {
  const navigate = useNavigate();
  
  // ──────────────────────────────────────────────────────────────────────────
  // HOOKS
  // ──────────────────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const { inventoryAlert, info } = useNotification();
  
  // Hook principal del dashboard con auto-refresh cada 60 segundos
  const {
    loading,
    error,
    isRefreshing,
    kpis,
    alertas,
    alertasPorTipo,
    totalAlertas,
    despachosRecientes,
    chartData,
    refresh,
    lastUpdated,
  } = useDashboard({ 
    autoFetch: true,
    // Si el usuario es cliente, filtrar por su cliente_id
    clienteId: user?.rol === 'cliente' ? user?.cliente_id : null,
    refreshInterval: 60000, // Refrescar cada minuto
  });

  // ──────────────────────────────────────────────────────────────────────────
  // EFECTOS
  // ──────────────────────────────────────────────────────────────────────────
  
  // Mostrar notificación de alertas al cargar (solo una vez)
  useEffect(() => {
    if (!loading && totalAlertas > 0) {
      // Construir mensaje inteligente según tipos de alerta presentes
      const tiposPresentes = [];
      
      if (alertasPorTipo.agotado?.length > 0) {
        tiposPresentes.push(`${alertasPorTipo.agotado.length} agotado(s)`);
      }
      if (alertasPorTipo.stock_bajo?.length > 0) {
        tiposPresentes.push(`${alertasPorTipo.stock_bajo.length} con stock bajo`);
      }
      if (alertasPorTipo.vencimiento?.length > 0) {
        tiposPresentes.push(`${alertasPorTipo.vencimiento.length} por vencer`);
      }
      
      // Usar la nueva función de alerta de inventario
      inventoryAlert(totalAlertas, alertasPorTipo);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  const handleDespachoClick = (row) => {
    navigate(`/despachos/${row.id}`);
  };

  const handleAlertClick = (alert) => {
    // Navegar según tipo de alerta
    if (alert.type === 'inventario') {
      navigate('/inventario/alertas');
    } else if (alert.type === 'vencimiento') {
      navigate('/inventario/alertas?tipo=vencimiento');
    }
  };

  const handleRefresh = () => {
    refresh();
    info('Actualizando datos...');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // PREPARAR DATOS PARA GRÁFICOS
  // ──────────────────────────────────────────────────────────────────────────
  
  // Datos para gráfico de barras (despachos por estado)
  const barData = chartData.despachosPorEstado?.map(item => ({
    label: item.name,
    value1: item.value,
  })) || [];

  // Datos para gráfico circular (clientes por estado o ingresos vs salidas)
  const pieData = chartData.ingresosVsSalidas || [];

  // ──────────────────────────────────────────────────────────────────────────
  // FORMATEAR ALERTAS PARA EL WIDGET
  // ──────────────────────────────────────────────────────────────────────────
  
  const formattedAlertas = alertas.slice(0, 5).map(alerta => ({
    id: alerta.id,
    type: alerta.tipo === 'stock_bajo' ? 'inventario' : 
          alerta.tipo === 'agotado' ? 'inventario' : 
          alerta.tipo === 'vencimiento' ? 'vencimiento' : 'documento',
    title: alerta.tipo === 'stock_bajo' ? `Stock bajo - ${alerta.nombre}` :
           alerta.tipo === 'agotado' ? `Agotado - ${alerta.nombre}` :
           `Por vencer - ${alerta.nombre}`,
    description: alerta.mensaje || `${alerta.cantidad_actual || 0} unidades disponibles`,
    date: alerta.fecha_vencimiento 
      ? `Vence: ${new Date(alerta.fecha_vencimiento).toLocaleDateString('es-CO')}` 
      : 'Actualizado recientemente',
    originalData: alerta,
  }));

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <FloatingHeader />

      {/* Main Content */}
      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PAGE HEADER */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Bienvenido, {user?.nombre_completo?.split(' ')[0] || 'Usuario'}
            </h1>
            <p className="text-slate-500 mt-1">
              Panel de control de Istho CRM
              {lastUpdated && (
                <span className="text-xs ml-2 text-slate-400">
                  • Actualizado: {new Date(lastUpdated).toLocaleTimeString('es-CO')}
                </span>
              )}
            </p>
          </div>
          
          {/* Botón de refrescar */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 
              rounded-xl hover:bg-gray-50 transition-colors shadow-sm
              ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ERROR STATE */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <p className="font-medium">Error al cargar datos</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* KPI CARDS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {KPI_CONFIG.map((kpiConfig) => {
            // Obtener valor del KPI
            let value = kpis[kpiConfig.kpiKey] ?? '-';
            if (kpiConfig.suffix && value !== '-') {
              value = `${value}${kpiConfig.suffix}`;
            }
            
            // Obtener cambio si existe
            let change = null;
            if (kpiConfig.changeKey && kpis[kpiConfig.changeKey]) {
              change = `${kpiConfig.changePrefix || ''}${kpis[kpiConfig.changeKey]}${kpiConfig.changeSuffix || ''}`;
            }

            return (
              <KpiCard
                key={kpiConfig.id}
                title={kpiConfig.title}
                value={value}
                change={change}
                positive={true}
                icon={kpiConfig.icon}
                iconBg={kpiConfig.iconBg}
                iconColor={kpiConfig.iconColor}
                loading={loading}
              />
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CHARTS ROW */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Despachos por Estado */}
          <BarChart
            title="Despachos por Estado"
            subtitle="Distribución actual"
            data={barData}
            legend={[
              { label: 'Cantidad', color: '#E65100' },
            ]}
            height={300}
            loading={loading}
          />

          {/* Pie Chart - Ingresos vs Salidas */}
          <PieChart
            title="Ingresos vs Salidas"
            subtitle="Operaciones del mes"
            data={pieData}
            size={180}
            loading={loading}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* BOTTOM ROW - TABLE & ALERTS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Despachos Recientes - 2 columnas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Despachos Recientes
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Últimas operaciones del sistema
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/despachos')}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Ver todos
                  </button>
                </div>
              </div>
              
              <DataTable
                columns={DESPACHOS_COLUMNS}
                data={despachosRecientes}
                onRowClick={handleDespachoClick}
                loading={loading}
                emptyMessage="No hay despachos recientes"
              />
            </div>
          </div>

          {/* Alertas Widget - 1 columna */}
          <div className="lg:col-span-1">
            <AlertWidget
              title="Alertas de Inventario"
              alerts={formattedAlertas}
              onAlertClick={handleAlertClick}
              onViewAll={() => navigate('/inventario/alertas')}
              maxItems={4}
              loading={loading}
              emptyIcon={CheckCircle}
              emptyMessage="Sin alertas pendientes"
            />

            {/* Resumen de alertas por tipo */}
            {!loading && totalAlertas > 0 && (
              <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Resumen de Alertas</h4>
                <div className="space-y-2">
                  {alertasPorTipo.agotado?.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-600 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Agotados
                      </span>
                      <span className="font-medium">{alertasPorTipo.agotado.length}</span>
                    </div>
                  )}
                  {alertasPorTipo.stock_bajo?.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-600 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Stock Bajo
                      </span>
                      <span className="font-medium">{alertasPorTipo.stock_bajo.length}</span>
                    </div>
                  )}
                  {alertasPorTipo.vencimiento?.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Por Vencer
                      </span>
                      <span className="font-medium">{alertasPorTipo.vencimiento.length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FOOTER */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;