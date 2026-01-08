/**
 * ISTHO CRM - Dashboard Principal
 * Panel completo con KPIs, gráficos, tabla y alertas
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Truck, 
  Package, 
  TrendingUp,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Common Components
import { KpiCard, DataTable, AlertWidget } from '../../components/common';

// Charts
import { BarChart, PieChart } from '../../components/charts';

// ============================================
// CONFIGURACIÓN
// ============================================

// KPIs Config
const KPI_CONFIG = [
  {
    id: 'clientes',
    title: 'Clientes Activos',
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'despachos',
    title: 'Despachos del Mes',
    icon: Truck,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'inventario',
    title: 'Inventario Total',
    icon: Package,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    id: 'tasaEntrega',
    title: 'Tasa de Entrega',
    icon: TrendingUp,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
];

// Tabla de despachos recientes
const DESPACHOS_COLUMNS = [
  { key: 'id', label: 'ID', type: 'id' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'destino', label: 'Destino' },
  { key: 'productos', label: 'Productos', align: 'center' },
  { key: 'estado', label: 'Estado', type: 'status' },
  { key: 'fecha', label: 'Fecha' },
];

// ============================================
// DASHBOARD COMPONENT
// ============================================
const Dashboard = () => {
  const navigate = useNavigate();

  // Estados
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [despachosRecientes, setDespachosRecientes] = useState([]);
  const [alertas, setAlertas] = useState([]);

  // Cargar datos
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        // Simular delay de API
        await new Promise((resolve) => setTimeout(resolve, 800));

        // KPIs
        setKpiData({
          clientes: { value: '156', change: '+12 este mes', positive: true },
          despachos: { value: '1,248', change: '+8.2% vs mes anterior', positive: true },
          inventario: { value: '45,892', change: '94% disponibilidad', positive: true },
          tasaEntrega: { value: '97.8%', change: '+0.8% mejora', positive: true },
        });

        // Gráfico de barras - Despachos vs Entregas (últimos 6 meses)
        setBarChartData([
          { label: 'Ago', value1: 180, value2: 165 },
          { label: 'Sep', value1: 210, value2: 195 },
          { label: 'Oct', value1: 195, value2: 188 },
          { label: 'Nov', value1: 240, value2: 230 },
          { label: 'Dic', value1: 285, value2: 275 },
          { label: 'Ene', value1: 248, value2: 242 },
        ]);

        // Gráfico circular - Top clientes por volumen
        setPieChartData([
          { label: 'Lácteos Betania', value: 4500 },
          { label: 'Almacenes Éxito', value: 3200 },
          { label: 'Eternit Colombia', value: 2800 },
          { label: 'Prodenvases', value: 2100 },
          { label: 'Otros', value: 1800 },
        ]);

        // Despachos recientes
        setDespachosRecientes([
          { id: 'DSP-001', cliente: 'Lácteos Betania', destino: 'Medellín', productos: 45, estado: 'en_transito', fecha: '2026-01-08' },
          { id: 'DSP-002', cliente: 'Almacenes Éxito', destino: 'Bogotá', productos: 120, estado: 'completado', fecha: '2026-01-08' },
          { id: 'DSP-003', cliente: 'Eternit Colombia', destino: 'Cali', productos: 85, estado: 'programado', fecha: '2026-01-09' },
          { id: 'DSP-004', cliente: 'Prodenvases', destino: 'Barranquilla', productos: 200, estado: 'en_transito', fecha: '2026-01-08' },
          { id: 'DSP-005', cliente: 'Klar Colombia', destino: 'Cartagena', productos: 65, estado: 'completado', fecha: '2026-01-07' },
        ]);

        // Alertas
        setAlertas([
          {
            id: 1,
            type: 'documento',
            title: 'Certificado ISO por vencer',
            description: 'El certificado ISO 9001 vence en 15 días',
            date: 'Vence: 23 Ene 2026',
          },
          {
            id: 2,
            type: 'inventario',
            title: 'Stock bajo - Tejas Onduladas',
            description: 'Solo quedan 450 unidades disponibles',
            date: 'Actualizado hace 2 horas',
          },
          {
            id: 3,
            type: 'documento',
            title: 'Póliza de seguros por renovar',
            description: 'La póliza de transporte vence en 20 días',
            date: 'Vence: 28 Ene 2026',
          },
          {
            id: 4,
            type: 'inventario',
            title: 'Stock bajo - Envases PET',
            description: 'Nivel crítico: 1,200 unidades',
            date: 'Actualizado hace 4 horas',
          },
          {
            id: 5,
            type: 'vencimiento',
            title: 'Contrato próximo a vencer',
            description: 'Contrato con Almacenes Éxito',
            date: 'Vence: 15 Feb 2026',
          },
        ]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handlers
  const handleDespachoClick = (row) => {
    navigate(`/despachos/${row.id}`);
  };

  const handleAlertClick = (alert) => {
    console.log('Alert clicked:', alert);
    // Navegar según tipo de alerta
    if (alert.type === 'documento') navigate('/documentos');
    if (alert.type === 'inventario') navigate('/inventario/alertas');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <FloatingHeader
        notificationCount={alertas.length}
        onSearchClick={() => console.log('Search')}
        onNotificationClick={() => console.log('Notifications')}
        onReportesClick={() => navigate('/reportes')}
        onProfileClick={() => navigate('/perfil')}
      />

      {/* Main Content */}
      <main className="pt-5 px-4 pb-8 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Bienvenido al panel de control de Istho CRM
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {KPI_CONFIG.map((kpi) => {
            const data = kpiData[kpi.id] || {};
            return (
              <KpiCard
                key={kpi.id}
                title={kpi.title}
                value={data.value || '-'}
                change={data.change}
                positive={data.positive}
                icon={kpi.icon}
                iconBg={kpi.iconBg}
                iconColor={kpi.iconColor}
                loading={loading}
              />
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Despachos vs Entregas */}
          <BarChart
            title="Despachos vs Entregas"
            subtitle="Últimos 6 meses"
            data={barChartData}
            legend={[
              { label: 'Despachos', color: '#3b82f6' },
              { label: 'Entregas', color: '#10b981' },
            ]}
            height={300}
          />

          {/* Pie Chart - Top Clientes */}
          <PieChart
            title="Top Clientes por Volumen"
            subtitle="Distribución de despachos"
            data={pieChartData}
            size={180}
          />
        </div>

        {/* Bottom Row - Table & Alerts */}
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
                      Últimos movimientos del sistema
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
              title="Alertas"
              alerts={alertas}
              onAlertClick={handleAlertClick}
              onViewAll={() => navigate('/alertas')}
              maxItems={4}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;