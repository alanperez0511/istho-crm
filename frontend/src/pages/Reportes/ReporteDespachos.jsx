/**
 * ISTHO CRM - ReporteDespachos Page
 * Reporte detallado de despachos con métricas y gráficos
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  MapPin,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, StatusChip, FilterDropdown } from '../../components/common';
import { BarChart, PieChart } from '../../components/charts';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_STATS = {
  totalDespachos: 156,
  completados: 142,
  enTransito: 8,
  cancelados: 6,
  tasaCumplimiento: 91.0,
  tiempoPromedioEntrega: 4.2, // horas
  cambioMes: 12.5,
};

const MOCK_POR_ESTADO = [
  { name: 'Completados', value: 142, color: '#10b981' },
  { name: 'En Tránsito', value: 8, color: '#3b82f6' },
  { name: 'Cancelados', value: 6, color: '#ef4444' },
];

const MOCK_POR_MES = [
  { name: 'Jul', completados: 120, cancelados: 5 },
  { name: 'Ago', completados: 135, cancelados: 8 },
  { name: 'Sep', completados: 128, cancelados: 4 },
  { name: 'Oct', completados: 145, cancelados: 6 },
  { name: 'Nov', completados: 152, cancelados: 7 },
  { name: 'Dic', completados: 168, cancelados: 5 },
  { name: 'Ene', completados: 142, cancelados: 6 },
];

const MOCK_POR_CLIENTE = [
  { cliente: 'Lácteos Betania S.A.S', despachos: 45, cumplimiento: 95.5, valor: 125000000 },
  { cliente: 'Almacenes Éxito S.A', despachos: 38, cumplimiento: 92.1, valor: 98000000 },
  { cliente: 'Eternit Colombia S.A', despachos: 28, cumplimiento: 89.3, valor: 76000000 },
  { cliente: 'Prodenvases S.A.S', despachos: 25, cumplimiento: 96.0, valor: 65000000 },
  { cliente: 'Klar Colombia S.A.S', despachos: 20, cumplimiento: 85.0, valor: 52000000 },
];

const MOCK_POR_DESTINO = [
  { destino: 'Medellín', despachos: 52, porcentaje: 33.3 },
  { destino: 'Bogotá', despachos: 38, porcentaje: 24.4 },
  { destino: 'Cali', despachos: 25, porcentaje: 16.0 },
  { destino: 'Barranquilla', despachos: 22, porcentaje: 14.1 },
  { destino: 'Otros', despachos: 19, porcentaje: 12.2 },
];

const MOCK_DESPACHOS_RECIENTES = [
  { id: 'DSP-156', cliente: 'Lácteos Betania', destino: 'Medellín', fecha: '2026-01-08', estado: 'en_transito', tiempo: '3h 15min' },
  { id: 'DSP-155', cliente: 'Almacenes Éxito', destino: 'Bogotá', fecha: '2026-01-08', estado: 'completado', tiempo: '6h 45min' },
  { id: 'DSP-154', cliente: 'Eternit Colombia', destino: 'Cali', fecha: '2026-01-07', estado: 'completado', tiempo: '8h 20min' },
  { id: 'DSP-153', cliente: 'Prodenvases', destino: 'Barranquilla', fecha: '2026-01-07', estado: 'completado', tiempo: '12h 10min' },
  { id: 'DSP-152', cliente: 'Klar Colombia', destino: 'Cartagena', fecha: '2026-01-06', estado: 'cancelado', tiempo: '-' },
];

// ============================================
// STAT CARD
// ============================================
const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, trendUp }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{trend}% vs mes anterior</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
  </div>
);

// ============================================
// PROGRESS BAR
// ============================================
const ProgressBar = ({ value, max = 100, color = 'bg-blue-500' }) => (
  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
    <div 
      className={`h-full ${color} transition-all duration-500`}
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const ReporteDespachos = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800));
      setStats(MOCK_STATS);
      setLoading(false);
    };
    fetchData();
  }, [periodo]);

  const handleExport = (format) => {
    console.log('Exportando en formato:', format);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-2xl" />
              <div className="h-80 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/reportes')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Reporte de Despachos</h1>
                  <p className="text-slate-500">Análisis de operaciones de entrega</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Periodo Filter */}
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="trimestre">Este trimestre</option>
              <option value="anio">Este año</option>
            </select>

            <Button variant="outline" icon={Printer}>
              Imprimir
            </Button>
            <Button variant="outline" icon={FileSpreadsheet} onClick={() => handleExport('excel')}>
              Excel
            </Button>
            <Button variant="primary" icon={Download} onClick={() => handleExport('pdf')}>
              PDF
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Despachos"
            value={stats.totalDespachos}
            subtitle="En el período"
            icon={Truck}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            trend={stats.cambioMes}
            trendUp={true}
          />
          <StatCard
            title="Tasa de Cumplimiento"
            value={`${stats.tasaCumplimiento}%`}
            subtitle={`${stats.completados} completados`}
            icon={CheckCircle}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Tiempo Promedio"
            value={`${stats.tiempoPromedioEntrega}h`}
            subtitle="De entrega"
            icon={Clock}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Cancelados"
            value={stats.cancelados}
            subtitle={`${((stats.cancelados / stats.totalDespachos) * 100).toFixed(1)}% del total`}
            icon={XCircle}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Tendencia Mensual */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Tendencia de Despachos</h3>
            <div className="h-64">
              <BarChart
                data={MOCK_POR_MES}
                dataKeys={[
                  { key: 'completados', name: 'Completados', color: '#10b981' },
                  { key: 'cancelados', name: 'Cancelados', color: '#ef4444' },
                ]}
                xAxisKey="name"
              />
            </div>
          </div>

          {/* Por Estado */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Distribución por Estado</h3>
            <div className="h-64">
              <PieChart data={MOCK_POR_ESTADO} />
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Por Cliente */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-800">Despachos por Cliente</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Despachos</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cumplimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_POR_CLIENTE.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-50">
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-slate-800">{item.cliente}</p>
                        <p className="text-xs text-slate-400">
                          ${(item.valor / 1000000).toFixed(0)}M facturado
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-slate-800">{item.despachos}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.cumplimiento >= 95 
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.cumplimiento >= 90
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {item.cumplimiento}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Por Destino */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-800">Despachos por Destino</h3>
            </div>
            <div className="p-6 space-y-4">
              {MOCK_POR_DESTINO.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{item.destino}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-slate-800">{item.despachos}</span>
                      <span className="text-slate-400 ml-1">({item.porcentaje}%)</span>
                    </div>
                  </div>
                  <ProgressBar 
                    value={item.porcentaje} 
                    color={idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-emerald-500' : 'bg-slate-300'}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Despachos Recientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Despachos Recientes</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/despachos')}>
              Ver todos
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Destino</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tiempo</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DESPACHOS_RECIENTES.map((despacho) => (
                  <tr key={despacho.id} className="border-b border-gray-50 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-slate-800">{despacho.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-700">{despacho.cliente}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-500">{despacho.destino}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-500">{despacho.fecha}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-500">{despacho.tiempo}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusChip status={despacho.estado} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReporteDespachos;