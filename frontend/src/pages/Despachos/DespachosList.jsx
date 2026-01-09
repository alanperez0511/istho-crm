/**
 * ============================================================================
 * ISTHO CRM - DespachosList (Fase 5 - Integración Completa)
 * ============================================================================
 * Listado de despachos conectado al backend real.
 * 
 * CAMBIOS vs versión anterior:
 * - Eliminado MOCK_DESPACHOS
 * - Conectado con useDespachos hook
 * - CRUD real de despachos
 * - Estados y cancelaciones conectados a API
 * - Control de permisos con ProtectedAction
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
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
import FloatingHeader from '../../components/layout/FloatingHeader';

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
    { value: 'programado', label: 'Programado' },
    { value: 'en_preparacion', label: 'En Preparación' },
    { value: 'en_transito', label: 'En Tránsito' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' },
  ],
  prioridad: [
    { value: 'urgente', label: 'Urgente' },
    { value: 'alta', label: 'Alta' },
    { value: 'normal', label: 'Normal' },
    { value: 'baja', label: 'Baja' },
  ],
  fecha: [
    { value: 'hoy', label: 'Hoy' },
    { value: 'manana', label: 'Mañana' },
    { value: 'semana', label: 'Esta Semana' },
    { value: 'mes', label: 'Este Mes' },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Badge de prioridad
 */
const PriorityBadge = function({ prioridad }) {
  var config = {
    urgente: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
    alta: { color: 'bg-orange-100 text-orange-700', label: 'Alta' },
    normal: { color: 'bg-slate-100 text-slate-700', label: 'Normal' },
    baja: { color: 'bg-slate-100 text-slate-500', label: 'Baja' },
  };

  var c = config[prioridad] || config.normal;

  return (
    <span className={'px-2 py-0.5 text-xs font-medium rounded-full ' + c.color}>
      {c.label}
    </span>
  );
};

/**
 * Menú de acciones por fila
 */
const RowActions = function({ despacho, onView, onEdit, onDelete, onCancel, canEdit, canDelete }) {
  var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];

  return (
    <div className="relative">
      <button
        onClick={function() { setIsOpen(!isOpen); }}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={function() { setIsOpen(false); }} />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            <button
              onClick={function() { onView(despacho); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" />
              Ver detalle
            </button>
            {despacho.estado !== 'completado' && despacho.estado !== 'cancelado' && canEdit && (
              <>
                <button
                  onClick={function() { onEdit(despacho); setIsOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={function() { onCancel(despacho); setIsOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar
                </button>
              </>
            )}
            {despacho.estado === 'cancelado' && canDelete && (
              <button
                onClick={function() { onDelete(despacho); setIsOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
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
const DespachoCard = function({ despacho, onView, onEdit }) {
  var estadoIcon = {
    programado: Calendar,
    en_preparacion: Package,
    en_transito: Truck,
    completado: CheckCircle,
    cancelado: XCircle,
  };

  var Icon = estadoIcon[despacho.estado] || Truck;

  return (
    <div 
      onClick={function() { onView(despacho); }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{despacho.numero || despacho.id}</p>
            <p className="text-sm text-slate-500">{despacho.cliente_nombre || despacho.cliente}</p>
          </div>
        </div>
        <PriorityBadge prioridad={despacho.prioridad} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          {despacho.destino || despacho.ciudad_destino || '-'}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          {despacho.fecha_programada || despacho.fechaProgramada} • {despacho.hora_estimada || despacho.horaEstimada || '--:--'}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="w-4 h-4 text-slate-400" />
          {despacho.total_productos || despacho.productos || 0} productos • {(despacho.total_unidades || despacho.unidades || 0).toLocaleString()} unidades
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <StatusChip status={despacho.estado} />
        {despacho.vehiculo && (
          <span className="text-xs text-slate-500">
            🚚 {despacho.vehiculo}
          </span>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const DespachosList = function() {
  var navigate = useNavigate();
  var searchParamsHook = useSearchParams();
  var searchParams = searchParamsHook[0];
  var authHook = useAuth();
  var user = authHook.user;
  var hasPermission = authHook.hasPermission;
  var notif = useNotification();
  var success = notif.success;
  var apiError = notif.apiError;
  var saved = notif.saved;
  var deleted = notif.deleted;

  // ──────────────────────────────────────────────────────────────────────────
  // HOOK DE DESPACHOS
  // ──────────────────────────────────────────────────────────────────────────
  var despachosHook = useDespachos({ 
    autoFetch: true,
    // Si es cliente, filtrar por su cliente_id
    initialFilters: user && user.rol === 'cliente' ? { cliente_id: user.cliente_id } : {},
  });
  
  var despachos = despachosHook.despachos;
  var loading = despachosHook.loading;
  var error = despachosHook.error;
  var pagination = despachosHook.pagination;
  var kpis = despachosHook.kpis;
  var isRefreshing = despachosHook.isRefreshing;
  var refresh = despachosHook.refresh;
  var search = despachosHook.search;
  var applyFilters = despachosHook.applyFilters;
  var goToPage = despachosHook.goToPage;
  var createDespacho = despachosHook.createDespacho;
  var updateDespacho = despachosHook.updateDespacho;
  var deleteDespacho = despachosHook.deleteDespacho;
  var cancelarDespacho = despachosHook.cancelarDespacho;

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES
  // ──────────────────────────────────────────────────────────────────────────
  var _a = useState(''), searchTerm = _a[0], setSearchTerm = _a[1];
  var _b = useState({}), filters = _b[0], setFilters = _b[1];
  var _c = useState(false), showFilters = _c[0], setShowFilters = _c[1];
  var _d = useState('table'), viewMode = _d[0], setViewMode = _d[1];
  
  // Modals
  var _e = useState({ isOpen: false, despacho: null }), formModal = _e[0], setFormModal = _e[1];
  var _f = useState({ isOpen: false, despacho: null }), cancelModal = _f[0], setCancelModal = _f[1];
  var _g = useState({ isOpen: false, despacho: null }), deleteModal = _g[0], setDeleteModal = _g[1];
  var _h = useState(false), formLoading = _h[0], setFormLoading = _h[1];

  // Permisos
  var canCreate = hasPermission('despachos', 'crear');
  var canEdit = hasPermission('despachos', 'editar');
  var canDelete = hasPermission('despachos', 'eliminar');
  var canExport = hasPermission('despachos', 'exportar');

  // ──────────────────────────────────────────────────────────────────────────
  // APLICAR FILTRO DE URL
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(function() {
    var filterParam = searchParams.get('filter');
    if (filterParam === 'programados') {
      setFilters({ estado: 'programado' });
      applyFilters({ estado: 'programado' });
    } else if (filterParam === 'completados') {
      setFilters({ estado: 'completado' });
      applyFilters({ estado: 'completado' });
    } else if (filterParam === 'en_transito') {
      setFilters({ estado: 'en_transito' });
      applyFilters({ estado: 'en_transito' });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  var handleSearch = function(value) {
    setSearchTerm(value);
    search(value);
  };

  var handleFilterChange = function(key, value) {
    var newFilters = Object.assign({}, filters);
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  var handleClearFilters = function() {
    setFilters({});
    setSearchTerm('');
    applyFilters({});
    search('');
  };

  var handleCreate = function() {
    setFormModal({ isOpen: true, despacho: null });
  };

  var handleEdit = function(despacho) {
    setFormModal({ isOpen: true, despacho: despacho });
  };

  var handleView = function(despacho) {
    navigate('/despachos/' + (despacho.id || despacho.numero));
  };

  var handleCancel = function(despacho) {
    setCancelModal({ isOpen: true, despacho: despacho });
  };

  var handleDelete = function(despacho) {
    setDeleteModal({ isOpen: true, despacho: despacho });
  };

  var handleFormSubmit = async function(data) {
    setFormLoading(true);
    try {
      if (formModal.despacho) {
        await updateDespacho(formModal.despacho.id, data);
        saved('Despacho');
      } else {
        await createDespacho(data);
        saved('Despacho');
      }
      setFormModal({ isOpen: false, despacho: null });
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  var handleConfirmCancel = async function() {
    setFormLoading(true);
    try {
      await cancelarDespacho(cancelModal.despacho.id, {
        motivo: 'Cancelado por usuario',
      });
      success('Despacho cancelado correctamente');
      setCancelModal({ isOpen: false, despacho: null });
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  var handleConfirmDelete = async function() {
    setFormLoading(true);
    try {
      await deleteDespacho(deleteModal.despacho.id);
      deleted('Despacho');
      setDeleteModal({ isOpen: false, despacho: null });
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // KPIs LOCALES (fallback si API no provee)
  // ──────────────────────────────────────────────────────────────────────────
  
  var displayKpis = kpis || {
    enTransito: despachos.filter(function(d) { return d.estado === 'en_transito'; }).length,
    programadosHoy: despachos.filter(function(d) { return d.estado === 'programado'; }).length,
    completadosHoy: despachos.filter(function(d) { return d.estado === 'completado'; }).length,
    pendientes: despachos.filter(function(d) { 
      return d.estado === 'programado' || d.estado === 'en_preparacion'; 
    }).length,
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader notificationCount={displayKpis.pendientes} />

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
              onClick={refresh}
              loading={isRefreshing}
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
            title="En Tránsito"
            value={displayKpis.enTransito}
            icon={Truck}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            onClick={function() { handleFilterChange('estado', 'en_transito'); }}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
          <KpiCard
            title="Programados Hoy"
            value={displayKpis.programadosHoy}
            icon={Calendar}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            onClick={function() { handleFilterChange('estado', 'programado'); }}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
          <KpiCard
            title="Completados Hoy"
            value={displayKpis.completadosHoy}
            icon={CheckCircle}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            onClick={function() { handleFilterChange('estado', 'completado'); }}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
          <KpiCard
            title="Pendientes"
            value={displayKpis.pendientes}
            icon={Clock}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SEARCH & FILTERS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por ID, cliente o destino..."
                value={searchTerm}
                onChange={handleSearch}
                onClear={function() { handleSearch(''); }}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={function() { setViewMode('table'); }}
                  className={'px-3 py-1.5 text-sm rounded-md transition-colors ' + (viewMode === 'table' ? 'bg-white shadow text-slate-800' : 'text-slate-500')}
                >
                  Tabla
                </button>
                <button
                  onClick={function() { setViewMode('cards'); }}
                  className={'px-3 py-1.5 text-sm rounded-md transition-colors ' + (viewMode === 'cards' ? 'bg-white shadow text-slate-800' : 'text-slate-500')}
                >
                  Tarjetas
                </button>
              </div>

              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                icon={Filter}
                onClick={function() { setShowFilters(!showFilters); }}
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
                  onChange={function(v) { handleFilterChange('estado', v); }}
                  placeholder="Todos los estados"
                />
                <FilterDropdown
                  label="Prioridad"
                  options={FILTER_OPTIONS.prioridad}
                  value={filters.prioridad}
                  onChange={function(v) { handleFilterChange('prioridad', v); }}
                  placeholder="Todas las prioridades"
                />
                <FilterDropdown
                  label="Fecha"
                  options={FILTER_OPTIONS.fecha}
                  value={filters.fecha}
                  onChange={function(v) { handleFilterChange('fecha', v); }}
                  placeholder="Todas las fechas"
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
            {pagination ? pagination.total : despachos.length} despacho{(pagination ? pagination.total : despachos.length) !== 1 ? 's' : ''} encontrado{(pagination ? pagination.total : despachos.length) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CONTENT */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            {[0, 1, 2, 3, 4].map(function(i) {
              return (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
              );
            })}
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
            {despachos.map(function(despacho) {
              return (
                <DespachoCard
                  key={despacho.id}
                  despacho={despacho}
                  onView={handleView}
                  onEdit={handleEdit}
                />
              );
            })}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Despacho
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cliente / Destino
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Fecha / Hora
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Productos
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
                  {despachos.map(function(despacho) {
                    return (
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
                                onClick={function() { handleView(despacho); }}
                              >
                                {despacho.numero || despacho.id}
                              </p>
                              {despacho.vehiculo && (
                                <p className="text-xs text-slate-500">🚚 {despacho.vehiculo}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{despacho.cliente_nombre || despacho.cliente}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {despacho.destino || despacho.ciudad_destino || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div>
                            <p className="text-sm text-slate-800">{despacho.fecha_programada || despacho.fechaProgramada || '-'}</p>
                            <p className="text-xs text-slate-500">{despacho.hora_estimada || despacho.horaEstimada || '--:--'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{despacho.total_productos || despacho.productos || 0}</p>
                            <p className="text-xs text-slate-500">{(despacho.total_unidades || despacho.unidades || 0).toLocaleString()} uds</p>
                          </div>
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
                            onCancel={handleCancel}
                            onDelete={handleDelete}
                            canEdit={canEdit}
                            canDelete={canDelete}
                          />
                        </td>
                      </tr>
                    );
                  })}
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
        onClose={function() { setFormModal({ isOpen: false, despacho: null }); }}
        onSubmit={handleFormSubmit}
        despacho={formModal.despacho}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={cancelModal.isOpen}
        onClose={function() { setCancelModal({ isOpen: false, despacho: null }); }}
        onConfirm={handleConfirmCancel}
        title="Cancelar Despacho"
        message={'¿Estás seguro de cancelar el despacho "' + (cancelModal.despacho ? (cancelModal.despacho.numero || cancelModal.despacho.id) : '') + '"? Esta acción notificará al cliente.'}
        confirmText="Cancelar Despacho"
        type="warning"
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={function() { setDeleteModal({ isOpen: false, despacho: null }); }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Despacho"
        message={'¿Eliminar permanentemente "' + (deleteModal.despacho ? (deleteModal.despacho.numero || deleteModal.despacho.id) : '') + '"? Esta acción no se puede deshacer.'}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default DespachosList;