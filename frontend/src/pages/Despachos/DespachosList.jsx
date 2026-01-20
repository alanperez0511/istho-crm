/**
 * ============================================================================
 * ISTHO CRM - DespachosList (Fase 5 - Integración Completa)
 * ============================================================================
 * Listado de despachos conectado al backend real.
 * 
 * CORRECCIÓN v2.1.0:
 * - Mapeado correcto de funciones del hook useDespachos
 * - crearDespacho, anularDespacho (no cancelarDespacho)
 * - conteoEstados en lugar de kpis
 * - Eliminado isRefreshing (no existe en hook)
 * 
 * @author Coordinación TI ISTHO
 * @version 2.1.0
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Truck,
  MapPin,
  Calendar,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

// Layout


// Components
import {
  Button,
  SearchBar,
  FilterDropdown,
  StatusChip,
  Pagination,
  ConfirmDialog,
  KpiCard,
} from '../../components/common';

// Local Components
import DespachoForm from './components/DespachoForm';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS INTEGRADOS
// ════════════════════════════════════════════════════════════════════════════

import useDespachos from '../../hooks/useDespachos';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import { ProtectedAction } from '../../components/auth/PrivateRoute';

// ════════════════════════════════════════════════════════════════════════════
// OPCIONES DE FILTROS
// ════════════════════════════════════════════════════════════════════════════

const FILTER_OPTIONS = {
  estado: [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'en_transito', label: 'En Tránsito' },
    { value: 'cerrado', label: 'Cerrado' },
    { value: 'anulado', label: 'Anulado' },
  ],
  prioridad: [
    { value: 'urgente', label: 'Urgente' },
    { value: 'alta', label: 'Alta' },
    { value: 'normal', label: 'Normal' },
    { value: 'baja', label: 'Baja' },
  ],
  tipo: [
    { value: 'ingreso', label: 'Ingreso' },
    { value: 'salida', label: 'Salida' },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Badge de prioridad
 */
const PriorityBadge = ({ prioridad }) => {
  const config = {
    urgente: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
    alta: { color: 'bg-orange-100 text-orange-700', label: 'Alta' },
    normal: { color: 'bg-slate-100 text-slate-700', label: 'Normal' },
    baja: { color: 'bg-slate-100 text-slate-500', label: 'Baja' },
  };

  const c = config[prioridad] || config.normal;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${c.color}`}>
      {c.label}
    </span>
  );
};

/**
 * Menú de acciones por fila
 */
const RowActions = ({ despacho, onView, onEdit, onAnular, canEdit }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            <button
              onClick={() => { onView(despacho); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" />
              Ver detalle
            </button>

            {despacho.estado !== 'cerrado' && despacho.estado !== 'anulado' && canEdit && (
              <>
                <button
                  onClick={() => { onEdit(despacho); setIsOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { onAnular(despacho); setIsOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Anular
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Tarjeta de despacho (vista alternativa)
 */
const DespachoCard = ({ despacho, onView, onEdit }) => {
  const estadoIcon = {
    pendiente: Calendar,
    en_proceso: Package,
    en_transito: Truck,
    cerrado: CheckCircle,
    anulado: XCircle,
  };

  const Icon = estadoIcon[despacho.estado] || Truck;

  return (
    <div
      onClick={() => onView(despacho)}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {despacho.numero_operacion || despacho.numero || `OP-${despacho.id}`}
            </p>
            <p className="text-sm text-slate-500">
              {despacho.cliente?.razon_social || despacho.cliente_nombre || '-'}
            </p>
          </div>
        </div>
        <PriorityBadge prioridad={despacho.prioridad} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          {despacho.destino || despacho.origen || '-'}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          {despacho.fecha_operacion || '-'}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="w-4 h-4 text-slate-400" />
          {despacho.tipo === 'ingreso' ? 'Ingreso' : 'Salida'}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <StatusChip status={despacho.estado} />
        {despacho.vehiculo_placa && (
          <span className="text-xs text-slate-500">
            🚚 {despacho.vehiculo_placa}
          </span>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const DespachosList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
  const { success, apiError, saved } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // HOOK DE DESPACHOS - MAPEO CORRECTO
  // ──────────────────────────────────────────────────────────────────────────

  const {
    // Estado de lista
    despachos,
    loading,
    error,
    pagination,
    conteoEstados,

    // CRUD - Nombres correctos del hook
    fetchDespachos,
    crearDespacho,
    anularDespacho,

    // Filtros y paginación
    search,
    applyFilters,
    clearFilters,
    goToPage,
    refresh,
  } = useDespachos({
    autoFetch: true,
    // Si es cliente, filtrar por su cliente_id
    initialFilters: user?.rol === 'cliente' ? { cliente_id: user.cliente_id } : {},
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES
  // ──────────────────────────────────────────────────────────────────────────

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [formModal, setFormModal] = useState({ isOpen: false, despacho: null });
  const [anularModal, setAnularModal] = useState({ isOpen: false, despacho: null });
  const [formLoading, setFormLoading] = useState(false);

  // Permisos
  const canCreate = hasPermission('despachos', 'crear');
  const canEdit = hasPermission('despachos', 'editar');
  const canExport = hasPermission('despachos', 'exportar');

  // ──────────────────────────────────────────────────────────────────────────
  // APLICAR FILTRO DE URL
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'pendientes') {
      setFilters({ estado: 'pendiente' });
      applyFilters({ estado: 'pendiente' });
    } else if (filterParam === 'cerrados') {
      setFilters({ estado: 'cerrado' });
      applyFilters({ estado: 'cerrado' });
    } else if (filterParam === 'en_proceso') {
      setFilters({ estado: 'en_proceso' });
      applyFilters({ estado: 'en_proceso' });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    search(value);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    clearFilters();
  };

  const handleCreate = () => {
    setFormModal({ isOpen: true, despacho: null });
  };

  const handleEdit = (despacho) => {
    setFormModal({ isOpen: true, despacho });
  };

  const handleView = (despacho) => {
    navigate(`/despachos/${despacho.id}`);
  };

  const handleAnular = (despacho) => {
    setAnularModal({ isOpen: true, despacho });
  };

  // ✅ CORRECCIÓN: Usar crearDespacho del hook
  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (formModal.despacho) {
        // TODO: Implementar actualización cuando el backend lo soporte
        // Por ahora, el hook no tiene updateDespacho
        console.warn('Actualización de despacho no implementada aún');
        success('Funcionalidad en desarrollo');
      } else {
        // ✅ Usar crearDespacho (nombre correcto)
        await crearDespacho(data);
        saved('Despacho');
      }
      setFormModal({ isOpen: false, despacho: null });
    } catch (err) {
      console.error('Error en formulario:', err);
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ✅ CORRECCIÓN: Usar anularDespacho del hook
  const handleConfirmAnular = async () => {
    setFormLoading(true);
    try {
      await anularDespacho(anularModal.despacho.id, 'Anulado por usuario');
      success('Despacho anulado correctamente');
      setAnularModal({ isOpen: false, despacho: null });
    } catch (err) {
      console.error('Error anulando despacho:', err);
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // KPIs - Usar conteoEstados del hook
  // ──────────────────────────────────────────────────────────────────────────

  const displayKpis = {
    enProceso: conteoEstados?.en_proceso || 0,
    pendientes: conteoEstados?.pendiente || 0,
    cerrados: conteoEstados?.cerrado || 0,
    anulados: conteoEstados?.anulado || 0,
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">


      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PAGE HEADER */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Despachos</h1>
            <p className="text-slate-500 mt-1">
              Gestiona los despachos y entregas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              icon={RefreshCw}
              onClick={handleRefresh}
              loading={refreshing}
              title="Actualizar datos"
            />

            <ProtectedAction module="despachos" action="exportar">
              <Button variant="outline" icon={Download} size="md">
                Exportar
              </Button>
            </ProtectedAction>

            <ProtectedAction module="despachos" action="crear">
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Nuevo Despacho
              </Button>
            </ProtectedAction>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* KPIs */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="En Proceso"
            value={displayKpis.enProceso}
            icon={Truck}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            onClick={() => handleFilterChange('estado', 'en_proceso')}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
          <KpiCard
            title="Pendientes"
            value={displayKpis.pendientes}
            icon={Clock}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            onClick={() => handleFilterChange('estado', 'pendiente')}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
          <KpiCard
            title="Cerrados"
            value={displayKpis.cerrados}
            icon={CheckCircle}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            onClick={() => handleFilterChange('estado', 'cerrado')}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
          <KpiCard
            title="Anulados"
            value={displayKpis.anulados}
            icon={XCircle}
            iconBg="bg-red-100"
            iconColor="text-red-600"
            onClick={() => handleFilterChange('estado', 'anulado')}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SEARCH & FILTERS */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por número, cliente o destino..."
                value={searchTerm}
                onChange={handleSearch}
                onClear={() => handleSearch('')}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
                    }`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
                    }`}
                >
                  Tarjetas
                </button>
              </div>

              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtros
                {Object.keys(filters).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                    {Object.keys(filters).length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterDropdown
                  label="Estado"
                  options={FILTER_OPTIONS.estado}
                  value={filters.estado}
                  onChange={(v) => handleFilterChange('estado', v)}
                  placeholder="Todos los estados"
                />
                <FilterDropdown
                  label="Prioridad"
                  options={FILTER_OPTIONS.prioridad}
                  value={filters.prioridad}
                  onChange={(v) => handleFilterChange('prioridad', v)}
                  placeholder="Todas las prioridades"
                />
                <FilterDropdown
                  label="Tipo"
                  options={FILTER_OPTIONS.tipo}
                  value={filters.tipo}
                  onChange={(v) => handleFilterChange('tipo', v)}
                  placeholder="Todos los tipos"
                />
              </div>

              {Object.keys(filters).length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* RESULTS COUNT */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <div className="mb-4">
          <p className="text-sm text-slate-500">
            {pagination?.total || despachos.length} despacho{(pagination?.total || despachos.length) !== 1 ? 's' : ''} encontrado{(pagination?.total || despachos.length) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ERROR STATE */}
        {/* ════════════════════════════════════════════════════════════════ */}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CONTENT */}
        {/* ════════════════════════════════════════════════════════════════ */}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : despachos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">
              No se encontraron despachos
            </h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primer despacho'}
            </p>
            {!searchTerm && Object.keys(filters).length === 0 && canCreate && (
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Nuevo Despacho
              </Button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          // Cards View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {despachos.map((despacho) => (
              <DespachoCard
                key={despacho.id}
                despacho={despacho}
                onView={handleView}
                onEdit={handleEdit}
              />
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Operación
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Destino / Origen
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {despachos.map((despacho) => (
                    <tr
                      key={despacho.id}
                      className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p
                              className="text-sm font-semibold text-slate-800 hover:text-orange-600 cursor-pointer"
                              onClick={() => handleView(despacho)}
                            >
                              {despacho.numero_operacion || `OP-${despacho.id}`}
                            </p>
                            {despacho.vehiculo_placa && (
                              <p className="text-xs text-slate-500">🚚 {despacho.vehiculo_placa}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-slate-800">
                          {despacho.cliente?.razon_social || despacho.cliente_nombre || '-'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {despacho.cliente?.codigo_cliente || ''}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {despacho.tipo === 'salida'
                              ? (despacho.destino || '-')
                              : (despacho.origen || '-')
                            }
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <p className="text-sm text-slate-800">
                          {despacho.fecha_operacion || '-'}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${despacho.tipo === 'ingreso'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                          {despacho.tipo === 'ingreso' ? 'Ingreso' : 'Salida'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <PriorityBadge prioridad={despacho.prioridad} />
                      </td>

                      <td className="py-4 px-4 text-center">
                        <StatusChip status={despacho.estado} />
                      </td>

                      <td className="py-4 px-4 text-center">
                        <RowActions
                          despacho={despacho}
                          onView={handleView}
                          onEdit={handleEdit}
                          onAnular={handleAnular}
                          canEdit={canEdit}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={goToPage}
              />
            )}
          </div>
        )}

        {/* Pagination for Cards */}
        {viewMode === 'cards' && pagination && pagination.totalPages > 1 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={goToPage}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      <DespachoForm
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, despacho: null })}
        onSubmit={handleFormSubmit}
        despacho={formModal.despacho}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={anularModal.isOpen}
        onClose={() => setAnularModal({ isOpen: false, despacho: null })}
        onConfirm={handleConfirmAnular}
        title="Anular Despacho"
        message={`¿Estás seguro de anular el despacho "${anularModal.despacho?.numero_operacion || anularModal.despacho?.id || ''}"? Esta acción no se puede deshacer.`}
        confirmText="Anular Despacho"
        type="warning"
        loading={formLoading}
      />
    </div>
  );
};

export default DespachosList;