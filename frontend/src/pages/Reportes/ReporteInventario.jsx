/**
 * ISTHO CRM - ReporteInventario Page
 * Reporte de inventario con datos reales del backend
 *
 * @author Coordinación TI ISTHO
 * @date Marzo 2026
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Download,
  AlertTriangle,
  DollarSign,
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  Printer,
} from 'lucide-react';

// Components
import { Button } from '../../components/common';

// API
import reportesService from '../../api/reportes.service';
import inventarioService from '../../api/inventario.service';

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
// ALERTA ITEM
// ============================================
const AlertaItem = ({ alerta }) => {
  const isVencimiento = alerta.tipo === 'vencimiento';
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
      isVencimiento
        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
    }`}>
      <AlertTriangle className={`w-5 h-5 ${isVencimiento ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-400'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isVencimiento ? 'text-orange-700 dark:text-orange-300' : 'text-amber-700 dark:text-amber-300'}`}>
          {alerta.titulo}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{alerta.mensaje}</p>
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
  const [stats, setStats] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashResponse, alertasResponse] = await Promise.all([
        reportesService.getDashboard(),
        inventarioService.getAlertas().catch(() => ({ data: [] })),
      ]);

      if (dashResponse?.success && dashResponse.data) {
        setStats(dashResponse.data.inventario);
      }

      if (alertasResponse?.data) {
        setAlertas(Array.isArray(alertasResponse.data) ? alertasResponse.data.slice(0, 8) : []);
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
      ? `${baseUrl}/reportes/inventario/excel`
      : `${baseUrl}/reportes/inventario/pdf`;
    window.open(`${url}?token=${token}`, '_blank');
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
    return `$${value.toLocaleString()}`;
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
          </div>
        </main>
      </div>
    );
  }

  const inv = stats || {};

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
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reporte de Inventario</h1>
                <p className="text-slate-500 dark:text-slate-400">Estado y valorización del inventario</p>
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
            title="Total Productos"
            value={inv.totalItems || 0}
            subtitle="SKUs registrados"
            icon={Package}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Total Unidades"
            value={(inv.totalUnidades || 0).toLocaleString()}
            subtitle="Unidades en stock"
            icon={Package}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="Valor del Inventario"
            value={formatCurrency(inv.valorTotal)}
            subtitle="Costo total"
            icon={DollarSign}
            iconBg="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            title="Alertas Activas"
            value={(inv.alertas?.stockBajo || 0) + (inv.alertas?.porVencer || 0)}
            subtitle={`${inv.alertas?.stockBajo || 0} stock bajo, ${inv.alertas?.porVencer || 0} por vencer`}
            icon={AlertTriangle}
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Alertas de Inventario</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/inventario/alertas')}>
                Ver todas
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alertas.map((alerta, idx) => (
                <AlertaItem key={alerta.id || idx} alerta={alerta} />
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Exportar Inventario Completo</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Descarga el listado completo de inventario con cantidades, costos, lotes y fechas de vencimiento.
            Puedes filtrar por cliente o estado usando los parámetros de exportación.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" icon={FileSpreadsheet} onClick={() => handleExport('excel')}>
              Exportar Excel
            </Button>
            <Button variant="outline" icon={Download} onClick={() => handleExport('pdf')}>
              Exportar PDF
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReporteInventario;
