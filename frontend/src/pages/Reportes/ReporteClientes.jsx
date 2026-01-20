/**
 * ISTHO CRM - ReporteClientes Page
 * Reporte detallado de clientes con métricas comerciales
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Download,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Star,
  Clock,
  FileSpreadsheet,
  Printer,
  UserPlus,
  UserMinus,
  Award,
  Activity,
} from 'lucide-react';

// Layout


// Components
import { Button, StatusChip } from '../../components/common';
import { BarChart, PieChart } from '../../components/charts';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_STATS = {
  totalClientes: 45,
  clientesActivos: 42,
  clientesNuevos: 3,
  ingresosMes: 1850000000,
  ticketPromedio: 42500000,
  satisfaccion: 4.6,
  cambioIngresos: 15.2,
};

const MOCK_POR_SECTOR = [
  { name: 'Alimentos', value: 35, color: '#3b82f6' },
  { name: 'Construcción', value: 25, color: '#10b981' },
  { name: 'Manufactura', value: 20, color: '#f59e0b' },
  { name: 'Retail', value: 12, color: '#8b5cf6' },
  { name: 'Otros', value: 8, color: '#6b7280' },
];

const MOCK_FACTURACION = [
  { name: 'Jul', facturacion: 1450 },
  { name: 'Ago', facturacion: 1580 },
  { name: 'Sep', facturacion: 1320 },
  { name: 'Oct', facturacion: 1720 },
  { name: 'Nov', facturacion: 1650 },
  { name: 'Dic', facturacion: 1920 },
  { name: 'Ene', facturacion: 1850 },
];

const MOCK_TOP_CLIENTES = [
  { id: 1, nombre: 'Lácteos Betania S.A.S', sector: 'Alimentos', despachos: 45, facturacion: 450000000, satisfaccion: 4.8, estado: 'activo' },
  { id: 2, nombre: 'Almacenes Éxito S.A', sector: 'Retail', despachos: 38, facturacion: 380000000, satisfaccion: 4.5, estado: 'activo' },
  { id: 3, nombre: 'Eternit Colombia S.A', sector: 'Construcción', despachos: 28, facturacion: 320000000, satisfaccion: 4.7, estado: 'activo' },
  { id: 4, nombre: 'Prodenvases S.A.S', sector: 'Manufactura', despachos: 25, facturacion: 280000000, satisfaccion: 4.3, estado: 'activo' },
  { id: 5, nombre: 'Klar Colombia S.A.S', sector: 'Alimentos', despachos: 20, facturacion: 220000000, satisfaccion: 4.1, estado: 'activo' },
];

const MOCK_ACTIVIDAD_RECIENTE = [
  { cliente: 'Lácteos Betania', accion: 'Nuevo despacho', fecha: '2026-01-08 10:30', tipo: 'despacho' },
  { cliente: 'Almacenes Éxito', accion: 'Factura pagada', fecha: '2026-01-08 09:15', tipo: 'pago' },
  { cliente: 'Químicos del Valle', accion: 'Nuevo contrato', fecha: '2026-01-07 16:00', tipo: 'contrato' },
  { cliente: 'Eternit Colombia', accion: 'Ticket de soporte', fecha: '2026-01-07 14:30', tipo: 'soporte' },
  { cliente: 'Prodenvases', accion: 'Renovación servicio', fecha: '2026-01-06 11:00', tipo: 'contrato' },
];

const MOCK_NUEVOS_CLIENTES = [
  { nombre: 'Distribuidora ABC', sector: 'Retail', fechaIngreso: '2026-01-05' },
  { nombre: 'Químicos del Valle', sector: 'Químicos', fechaIngreso: '2026-01-03' },
  { nombre: 'Transportes XYZ', sector: 'Logística', fechaIngreso: '2026-01-02' },
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
// RATING STARS
// ============================================
const RatingStars = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < fullStars
              ? 'text-amber-400 fill-current'
              : i === fullStars && hasHalfStar
                ? 'text-amber-400'
                : 'text-slate-200'
            }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-slate-600">{rating}</span>
    </div>
  );
};

// ============================================
// ACTIVIDAD ITEM
// ============================================
const ActividadItem = ({ actividad }) => {
  const tipoConfig = {
    despacho: { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
    pago: { icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    contrato: { icon: Award, color: 'text-violet-500', bg: 'bg-violet-50' },
    soporte: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  };

  const config = tipoConfig[actividad.tipo] || tipoConfig.despacho;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{actividad.cliente}</p>
        <p className="text-xs text-slate-500">{actividad.accion}</p>
      </div>
      <span className="text-xs text-slate-400">{actividad.fecha.split(' ')[1]}</span>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ReporteClientes = () => {
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

  const formatCurrency = (value) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">


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
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Reporte de Clientes</h1>
                  <p className="text-slate-500">Análisis comercial y de satisfacción</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            title="Total Clientes"
            value={stats.totalClientes}
            subtitle={`${stats.clientesActivos} activos`}
            icon={Users}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(stats.ingresosMes)}
            icon={DollarSign}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            trend={stats.cambioIngresos}
            trendUp={true}
          />
          <StatCard
            title="Ticket Promedio"
            value={formatCurrency(stats.ticketPromedio)}
            subtitle="Por despacho"
            icon={TrendingUp}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Satisfacción"
            value={`${stats.satisfaccion}/5`}
            subtitle="Promedio general"
            icon={Star}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Facturación Mensual */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Facturación Mensual (Millones)</h3>
            <div className="h-64">
              <BarChart
                data={MOCK_FACTURACION}
                dataKeys={[
                  { key: 'facturacion', name: 'Facturación', color: '#8b5cf6' },
                ]}
                xAxisKey="name"
              />
            </div>
          </div>

          {/* Por Sector */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Clientes por Sector</h3>
            <div className="h-64">
              <PieChart data={MOCK_POR_SECTOR} />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Clientes */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-800">Top Clientes por Facturación</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Sector</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Despachos</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Satisfacción</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Facturación</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TOP_CLIENTES.map((cliente, idx) => (
                    <tr key={cliente.id} className="border-b border-gray-50 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{cliente.nombre}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                          {cliente.sector}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-slate-800">{cliente.despachos}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <RatingStars rating={cliente.satisfaccion} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-semibold text-slate-800">
                          {formatCurrency(cliente.facturacion)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actividad Reciente */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Actividad Reciente</h3>
              <div>
                {MOCK_ACTIVIDAD_RECIENTE.map((actividad, idx) => (
                  <ActividadItem key={idx} actividad={actividad} />
                ))}
              </div>
            </div>

            {/* Nuevos Clientes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Nuevos Clientes</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  +{MOCK_NUEVOS_CLIENTES.length} este mes
                </span>
              </div>
              <div className="space-y-3">
                {MOCK_NUEVOS_CLIENTES.map((cliente, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{cliente.nombre}</p>
                      <p className="text-xs text-slate-500">{cliente.sector} • {cliente.fechaIngreso}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white">
              <h3 className="font-semibold mb-3">Resumen del Período</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-violet-200">Clientes activos</span>
                  <span className="font-semibold">{stats.clientesActivos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-200">Nuevos clientes</span>
                  <span className="font-semibold">+{stats.clientesNuevos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-200">Tasa retención</span>
                  <span className="font-semibold">98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReporteClientes;