/**
 * ISTHO CRM - ReporteInventario Page
 * Reporte detallado de inventario con análisis
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  RotateCcw,
  Warehouse,
  Calendar,
  FileSpreadsheet,
  Printer,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, StatusChip } from '../../components/common';
import { BarChart, PieChart } from '../../components/charts';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_STATS = {
  totalProductos: 248,
  valorTotal: 1250000000,
  productosBajoStock: 12,
  productosAgotados: 3,
  rotacionPromedio: 4.2, // veces por mes
  cambioValor: 8.5,
};

const MOCK_POR_CATEGORIA = [
  { name: 'Lácteos', value: 35, color: '#3b82f6' },
  { name: 'Construcción', value: 25, color: '#10b981' },
  { name: 'Envases', value: 20, color: '#f59e0b' },
  { name: 'Químicos', value: 12, color: '#ef4444' },
  { name: 'Otros', value: 8, color: '#8b5cf6' },
];

const MOCK_POR_BODEGA = [
  { bodega: 'BOD-01 Refrigerados', productos: 85, ocupacion: 78, valor: 450000000 },
  { bodega: 'BOD-02 Secos', productos: 92, ocupacion: 65, valor: 380000000 },
  { bodega: 'BOD-03 Químicos', productos: 35, ocupacion: 45, valor: 220000000 },
  { bodega: 'BOD-04 Construcción', productos: 36, ocupacion: 82, valor: 200000000 },
];

const MOCK_MOVIMIENTOS = [
  { name: 'Jul', entradas: 1200, salidas: 1100 },
  { name: 'Ago', entradas: 1350, salidas: 1280 },
  { name: 'Sep', entradas: 1180, salidas: 1150 },
  { name: 'Oct', entradas: 1450, salidas: 1380 },
  { name: 'Nov', entradas: 1520, salidas: 1490 },
  { name: 'Dic', entradas: 1680, salidas: 1720 },
  { name: 'Ene', entradas: 1420, salidas: 1350 },
];

const MOCK_TOP_PRODUCTOS = [
  { codigo: 'SKU-LCH-001', nombre: 'Leche UHT x24', stock: 12500, rotacion: 8.5, valor: 125000000 },
  { codigo: 'SKU-YGT-001', nombre: 'Yogurt Griego x12', stock: 8200, rotacion: 6.2, valor: 82000000 },
  { codigo: 'SKU-TEJ-001', nombre: 'Tejas Onduladas', stock: 450, rotacion: 2.1, valor: 67500000 },
  { codigo: 'SKU-ENV-001', nombre: 'Envases PET 500ml', stock: 45000, rotacion: 12.0, valor: 54000000 },
  { codigo: 'SKU-QSO-001', nombre: 'Queso Doble Crema x5kg', stock: 890, rotacion: 5.8, valor: 44500000 },
];

const MOCK_ALERTAS = [
  { producto: 'Yogurt Natural x6', tipo: 'bajo_stock', stock: 45, minimo: 100 },
  { producto: 'Cemento Gris x50kg', tipo: 'agotado', stock: 0, minimo: 50 },
  { producto: 'Envases PET 1L', tipo: 'bajo_stock', stock: 200, minimo: 500 },
  { producto: 'Hipoclorito de Sodio', tipo: 'vencimiento', diasRestantes: 15 },
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
// OCUPACION BAR
// ============================================
const OcupacionBar = ({ value }) => {
  let colorClass = 'bg-emerald-500';
  if (value >= 90) colorClass = 'bg-red-500';
  else if (value >= 75) colorClass = 'bg-amber-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-600 w-10 text-right">{value}%</span>
    </div>
  );
};

// ============================================
// ALERTA ITEM
// ============================================
const AlertaItem = ({ alerta }) => {
  const config = {
    bajo_stock: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    agotado: { icon: Package, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    vencimiento: { icon: Calendar, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  };

  const { icon: Icon, bg, border, text } = config[alerta.tipo] || config.bajo_stock;

  return (
    <div className={`flex items-center gap-3 p-3 ${bg} ${border} border rounded-xl`}>
      <Icon className={`w-5 h-5 ${text}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${text} truncate`}>{alerta.producto}</p>
        <p className="text-xs text-slate-500">
          {alerta.tipo === 'vencimiento' 
            ? `Vence en ${alerta.diasRestantes} días`
            : `Stock: ${alerta.stock} / Mín: ${alerta.minimo}`
          }
        </p>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ReporteInventario = () => {
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
        <FloatingHeader />
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
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Reporte de Inventario</h1>
                  <p className="text-slate-500">Estado y valorización del inventario</p>
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
            title="Total Productos"
            value={stats.totalProductos}
            subtitle="SKUs activos"
            icon={Package}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Valor del Inventario"
            value={formatCurrency(stats.valorTotal)}
            subtitle="Costo total"
            icon={DollarSign}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            trend={stats.cambioValor}
            trendUp={true}
          />
          <StatCard
            title="Rotación Promedio"
            value={`${stats.rotacionPromedio}x`}
            subtitle="Veces por mes"
            icon={RotateCcw}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
          <StatCard
            title="Alertas Activas"
            value={stats.productosBajoStock + stats.productosAgotados}
            subtitle={`${stats.productosAgotados} agotados`}
            icon={AlertTriangle}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Movimientos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Movimientos de Inventario</h3>
            <div className="h-64">
              <BarChart
                data={MOCK_MOVIMIENTOS}
                dataKeys={[
                  { key: 'entradas', name: 'Entradas', color: '#10b981' },
                  { key: 'salidas', name: 'Salidas', color: '#3b82f6' },
                ]}
                xAxisKey="name"
              />
            </div>
          </div>

          {/* Por Categoría */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Distribución por Categoría</h3>
            <div className="h-64">
              <PieChart data={MOCK_POR_CATEGORIA} />
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Por Bodega */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-800">Estado por Bodega</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Bodega</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Productos</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Ocupación</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_POR_BODEGA.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Warehouse className="w-5 h-5 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-800">{item.bodega}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-slate-800">{item.productos}</span>
                      </td>
                      <td className="py-4 px-4">
                        <OcupacionBar value={item.ocupacion} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-medium text-slate-800">
                          {formatCurrency(item.valor)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Alertas Activas</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/inventario/alertas')}>
                Ver todas
              </Button>
            </div>
            <div className="space-y-3">
              {MOCK_ALERTAS.map((alerta, idx) => (
                <AlertaItem key={idx} alerta={alerta} />
              ))}
            </div>
          </div>
        </div>

        {/* Top Productos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-slate-800">Top Productos por Valor</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Producto</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Código</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Stock</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Rotación</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TOP_PRODUCTOS.map((producto, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{producto.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-500 font-mono">{producto.codigo}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-slate-800">{producto.stock.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        producto.rotacion >= 6 
                          ? 'bg-emerald-100 text-emerald-700'
                          : producto.rotacion >= 3
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {producto.rotacion}x
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-semibold text-slate-800">
                        {formatCurrency(producto.valor)}
                      </span>
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

export default ReporteInventario;