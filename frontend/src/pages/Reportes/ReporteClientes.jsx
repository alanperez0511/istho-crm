/**
 * ISTHO CRM - ReporteClientes Page
 * Reporte de clientes con datos reales del backend y filtros
 *
 * @author Coordinación TI ISTHO
 * @date Marzo 2026
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Building2,
  UserPlus,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Components
import { Button, KpiCard, ReportFilters } from '../../components/common';

// API
import reportesService from '../../api/reportes.service';
import clientesService from '../../api/clientes.service';

// ============================================
// MAIN COMPONENT
// ============================================
const ReporteClientes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ fecha_desde: '', fecha_hasta: '', cliente_id: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashResponse, clientesResponse] = await Promise.all([
        reportesService.getDashboard(),
        clientesService.getAll({ limit: 10, sort: 'created_at', order: 'DESC' }).catch((err) => {
          console.warn('Error al cargar clientes:', err);
          return { success: false, error: err.message || 'Error al cargar clientes' };
        }),
      ]);

      if (dashResponse?.success && dashResponse.data) {
        setStats(dashResponse.data.clientes);
      }

      if (clientesResponse?.success && clientesResponse.data) {
        const list = Array.isArray(clientesResponse.data)
          ? clientesResponse.data
          : clientesResponse.data?.rows || [];
        setClientes(list.slice(0, 10));
      } else if (clientesResponse?.error) {
        console.warn('Clientes no cargados:', clientesResponse.error);
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

  // Construir query string con filtros
  const buildFilterParams = () => {
    const params = new URLSearchParams();
    const token = localStorage.getItem('istho_token');
    if (token) params.set('token', token);
    if (filters.fecha_desde) params.set('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.set('fecha_hasta', filters.fecha_hasta);
    return params.toString();
  };

  const handleExport = () => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    window.open(`${baseUrl}/reportes/clientes/excel?${buildFilterParams()}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-64" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const cl = stats || {};

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
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reporte de Clientes</h1>
                <p className="text-slate-500 dark:text-slate-400">Estado y gestión de clientes</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" icon={RefreshCw} onClick={fetchData}>
              Actualizar
            </Button>
            <Button variant="primary" icon={FileSpreadsheet} onClick={handleExport}>
              Exportar Excel
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Filtros - sin selector de cliente (no aplica para reporte de clientes) */}
        <ReportFilters filters={filters} onChange={setFilters} showCliente={false} />

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KpiCard
            title="Total Clientes"
            value={cl.total || 0}
            subtitle={`${cl.activos || 0} activos`}
            icon={Users}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <KpiCard
            title="Clientes Activos"
            value={cl.activos || 0}
            subtitle={cl.total ? `${Math.round((cl.activos / cl.total) * 100)}% del total` : '0%'}
            icon={CheckCircle}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <KpiCard
            title="Nuevos este Mes"
            value={cl.nuevosMes || 0}
            subtitle="Registrados recientemente"
            icon={UserPlus}
            iconBg="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
          />
        </div>

        {/* Tabla de Clientes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Últimos Clientes Registrados</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cliente</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">NIT/ID</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Estado</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      No hay clientes registrados
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer transition-colors"
                      onClick={() => navigate(`/clientes/${cliente.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                              {cliente.razon_social || cliente.nombre}
                            </p>
                            {cliente.codigo_cliente && (
                              <p className="text-xs text-slate-400 dark:text-slate-500">{cliente.codigo_cliente}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                          {cliente.nit || cliente.documento || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cliente.estado === 'activo'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        }`}>
                          {cliente.estado === 'activo'
                            ? <CheckCircle className="w-3 h-3" />
                            : <XCircle className="w-3 h-3" />
                          }
                          {cliente.estado || 'activo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {(cliente.created_at || cliente.createdAt)
                            ? new Date(cliente.created_at || cliente.createdAt).toLocaleDateString('es-CO')
                            : '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Exportar Listado Completo</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Descarga el listado completo de clientes con sus contactos, estado y datos comerciales.
            Los filtros de fecha seleccionados se aplicarán a la exportación.
          </p>
          <Button variant="outline" icon={FileSpreadsheet} onClick={handleExport}>
            Descargar Excel
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ReporteClientes;
