/**
 * ISTHO CRM - ReporteDespachos Page
 * Reporte de operaciones (entradas/salidas) con exportación real
 *
 * @author Coordinación TI ISTHO
 * @date Marzo 2026
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
} from 'lucide-react';

// Components
import { Button } from '../../components/common';
import { BarChart, PieChart } from '../../components/charts';

// API
import reportesService from '../../api/reportes.service';

// ============================================
// STAT CARD
// ============================================
const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const ReporteDespachos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportesService.getDashboard();
      if (response?.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = (format) => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const token = localStorage.getItem('istho_token');
    const url = format === 'excel'
      ? `${baseUrl}/reportes/operaciones/excel`
      : `${baseUrl}/reportes/operaciones/pdf`;
    window.open(`${url}?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-64" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
              <div className="h-80 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const operaciones = stats?.operaciones || {};
  const porEstado = operaciones.porEstado || {};
  const porTipo = operaciones.porTipo || {};

  // Chart data
  const barData = Object.entries(porEstado).map(([estado, cantidad]) => ({
    label: estado.replace('_', ' ').charAt(0).toUpperCase() + estado.replace('_', ' ').slice(1),
    value1: cantidad || 0,
  }));

  const pieData = [
    { name: 'Ingresos', value: porTipo.ingreso || 0 },
    { name: 'Salidas', value: porTipo.salida || 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/reportes')}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reporte de Operaciones</h1>
                <p className="text-slate-500 dark:text-slate-400">Entradas y salidas del WMS</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" icon={RefreshCw} onClick={fetchData}>
              Actualizar
            </Button>
            <Button variant="outline" icon={FileSpreadsheet} onClick={() => handleExport('excel')}>
              Excel
            </Button>
            <Button variant="primary" icon={Download} onClick={() => handleExport('pdf')}>
              PDF
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Operaciones"
            value={operaciones.total || 0}
            subtitle={`${operaciones.mes || 0} este mes`}
            icon={Activity}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Entradas Pendientes"
            value={operaciones.entradasPendientes || 0}
            subtitle="Ingresos por auditar"
            icon={ArrowDownCircle}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="Salidas Pendientes"
            value={operaciones.salidasPendientes || 0}
            subtitle="Despachos por auditar"
            icon={ArrowUpCircle}
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="Cerradas este Mes"
            value={operaciones.cerradasMes || 0}
            subtitle={`${porEstado.anulado || 0} anuladas`}
            icon={CheckCircle}
            iconBg="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BarChart
            title="Operaciones por Estado"
            subtitle="Distribución actual"
            data={barData}
            legend={[{ label: 'Cantidad', color: '#3b82f6' }]}
            height={300}
          />
          <PieChart
            title="Ingresos vs Salidas"
            subtitle="Distribución por tipo"
            data={pieData}
            size={180}
          />
        </div>

        {/* Resumen */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Resumen por Estado</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(porEstado).map(([estado, cantidad]) => {
              const config = {
                pendiente: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                en_proceso: { icon: RefreshCw, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                cerrado: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                anulado: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
              };
              const { icon: Icon, color, bg } = config[estado] || config.pendiente;
              return (
                <div key={estado} className={`p-4 rounded-xl ${bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className={`text-sm font-medium ${color} capitalize`}>{estado.replace('_', ' ')}</span>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{cantidad || 0}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReporteDespachos;
