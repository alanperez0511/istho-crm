/**
 * ============================================================================
 * ISTHO CRM - MovimientosList
 * ============================================================================
 * Lista de movimientos de caja menor (gastos/ingresos) con aprobacion masiva.
 *
 * @author Coordinacion TI ISTHO
 * @version 1.0.0
 * @date Marzo 2026
 */

import { useState, useEffect } from 'react';
import { Menu, MenuItem, IconButton, Checkbox, Chip } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Receipt,
  RefreshCw,
} from 'lucide-react';

// Components
import {
  Button,
  SearchBar,
  FilterDropdown,
  StatusChip,
  Pagination,
  ConfirmDialog,
} from '../../components/common';

// Local Components
import MovimientoForm from './components/MovimientoForm';

// Services
import { movimientosService } from '../../api/viajes.service';

// Hooks
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import { ProtectedAction } from '../../components/auth/PrivateRoute';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACION
// ════════════════════════════════════════════════════════════════════════════

const CONCEPTO_LABELS = {
  cuadre_de_caja: 'Cuadre de Caja',
  descargues: 'Descargues',
  acpm: 'ACPM',
  administracion: 'Administracion',
  alimentacion: 'Alimentacion',
  comisiones: 'Comisiones',
  desencarpe: 'Desencarpe',
  encarpe: 'Encarpe',
  hospedaje: 'Hospedaje',
  otros: 'Otros',
  seguros: 'Seguros',
  repuestos: 'Repuestos',
  tecnicomecanica: 'Tecnomecanica',
  peajes: 'Peajes',
  ligas: 'Ligas',
  parqueadero: 'Parqueadero',
  urea: 'UREA',
  ingreso_adicional: 'Ingreso Adicional',
  peajes_ingreso: 'Peajes Ingreso',
  ligas_ingresos: 'Ligas Ingresos',
  parqueadero_ingresos: 'Parqueadero Ingresos',
  urea_ingresos: 'UREA Ingresos',
};

const FILTER_OPTIONS = {
  tipo_movimiento: [
    { value: 'ingreso', label: 'Ingreso' },
    { value: 'egreso', label: 'Egreso' },
  ],
  concepto: Object.entries(CONCEPTO_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
  aprobado: [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'true', label: 'Aprobado' },
    { value: 'rechazado', label: 'Rechazado' },
  ],
};

const formatMoney = (value) => {
  if (value == null) return '-';
  return `$${Number(value).toLocaleString('es-CO')}`;
};

const getApprovalDisplay = (aprobado) => {
  if (aprobado === true || aprobado === 'true') {
    return { label: 'Aprobado', color: 'success', icon: CheckCircle };
  }
  if (aprobado === false || aprobado === 'rechazado') {
    return { label: 'Rechazado', color: 'error', icon: XCircle };
  }
  return { label: 'Pendiente', color: 'warning', icon: null };
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: AprobarMovimientoDialog
// ════════════════════════════════════════════════════════════════════════════

const AprobarMovimientoDialog = ({ isOpen, onClose, movimiento, onAprobar, onRechazar, loading }) => {
  const [valorAprobado, setValorAprobado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (movimiento) {
      setValorAprobado(movimiento.valor || '');
      setObservaciones('');
    }
  }, [movimiento]);

  if (!isOpen || !movimiento) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Aprobar Movimiento</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Valor Original
            </label>
            <p className="text-lg font-semibold text-slate-800">
              {formatMoney(movimiento.valor)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Valor Aprobado
            </label>
            <input
              type="number"
              value={valorAprobado}
              onChange={(e) => setValorAprobado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Valor aprobado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Observaciones de aprobacion..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => onAprobar({ valor_aprobado: Number(valorAprobado), observaciones_aprobacion: observaciones })}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Aprobar
          </button>
          <button
            onClick={() => onRechazar({ observaciones_aprobacion: observaciones })}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: RowActions
// ════════════════════════════════════════════════════════════════════════════

const RowActions = ({ movimiento, onView, onEdit, onDelete, onAprobar }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 0.5,
            borderRadius: '0.75rem',
            border: '1px solid #f3f4f6',
            minWidth: '160px',
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              color: '#334155',
              padding: '8px 16px',
              gap: '8px',
              '&:hover': {
                backgroundColor: '#f8fafc',
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => { onView(movimiento); handleClose(); }}>
          <Eye className="w-4 h-4" />
          Ver detalle
        </MenuItem>

        <ProtectedAction module="viajes" action="editar">
          <MenuItem onClick={() => { onEdit(movimiento); handleClose(); }}>
            <Pencil className="w-4 h-4" />
            Editar
          </MenuItem>
        </ProtectedAction>

        <ProtectedAction module="viajes" action="aprobar">
          <MenuItem
            onClick={() => { onAprobar(movimiento); handleClose(); }}
            sx={{ color: '#16a34a !important', '&:hover': { backgroundColor: '#f0fdf4 !important' } }}
          >
            <CheckCircle className="w-4 h-4" />
            Aprobar
          </MenuItem>
        </ProtectedAction>

        <ProtectedAction module="viajes" action="eliminar">
          <MenuItem
            onClick={() => { onDelete(movimiento); handleClose(); }}
            sx={{ color: '#dc2626 !important', '&:hover': { backgroundColor: '#fef2f2 !important' } }}
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </MenuItem>
        </ProtectedAction>
      </Menu>
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const MovimientosList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, apiError, saved, deleted } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────
  const [movimientos, setMovimientos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tipo_movimiento: searchParams.get('tipo_movimiento') || '',
    concepto: searchParams.get('concepto') || '',
    aprobado: searchParams.get('aprobado') || '',
    caja_menor_id: searchParams.get('caja_menor_id') || '',
    conductor_id: searchParams.get('conductor_id') || '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Seleccion masiva
  const [selected, setSelected] = useState([]);

  // Modales
  const [formModal, setFormModal] = useState({ isOpen: false, movimiento: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, movimiento: null });
  const [aprobarModal, setAprobarModal] = useState({ isOpen: false, movimiento: null });
  const [formLoading, setFormLoading] = useState(false);

  // Listas para filtros dinamicos
  const [cajasMenores, setCajasMenores] = useState([]);
  const [conductores, setConductores] = useState([]);

  // ──────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ──────────────────────────────────────────────────────────────────────────

  const fetchMovimientos = async (page = 1, currentFilters = filters, search = searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search: search || undefined,
      };

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const response = await movimientosService.getAll(params);
      setMovimientos(response.data || []);
      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          page: response.pagination.page || page,
          totalPages: response.pagination.totalPages || 1,
          total: response.pagination.total || 0,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar movimientos');
      apiError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [cajasRes, conductoresRes] = await Promise.all([
        movimientosService.getCajasMenores?.() || Promise.resolve({ data: [] }),
        movimientosService.getConductores?.() || Promise.resolve({ data: [] }),
      ]);
      setCajasMenores(
        (cajasRes.data || []).map((c) => ({ value: String(c.id), label: `Caja #${c.numero}` }))
      );
      setConductores(
        (conductoresRes.data || []).map((c) => ({ value: String(c.id), label: c.nombre_completo || c.username || c.nombre }))
      );
    } catch {
      // Filtros dinamicos opcionales
    }
  };

  useEffect(() => {
    fetchMovimientos();
    fetchFilterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => {
    setSelected([]);
    fetchMovimientos(pagination.page);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS DE BUSQUEDA Y FILTROS
  // ──────────────────────────────────────────────────────────────────────────

  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchMovimientos(1, filters, value);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    fetchMovimientos(1, newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    const empty = { tipo_movimiento: '', concepto: '', aprobado: '', caja_menor_id: '', conductor_id: '' };
    setFilters(empty);
    setSearchTerm('');
    setSearchParams({});
    fetchMovimientos(1, empty, '');
  };

  const goToPage = (page) => {
    fetchMovimientos(page);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS DE SELECCION MASIVA
  // ──────────────────────────────────────────────────────────────────────────

  const pendientes = movimientos.filter(
    (m) => m.aprobado === null || m.aprobado === 'pendiente' || m.aprobado === undefined
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(pendientes.map((m) => m.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleMassApproval = async () => {
    setFormLoading(true);
    try {
      await movimientosService.aprobarMasivo(selected);
      success(`${selected.length} movimiento(s) aprobado(s) correctamente`);
      setSelected([]);
      fetchMovimientos(pagination.page);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS CRUD
  // ──────────────────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setFormModal({ isOpen: true, movimiento: null });
  };

  const handleEdit = (movimiento) => {
    setFormModal({ isOpen: true, movimiento });
  };

  const handleView = (movimiento) => {
    setFormModal({ isOpen: true, movimiento: { ...movimiento, _readOnly: true } });
  };

  const handleDelete = (movimiento) => {
    setDeleteModal({ isOpen: true, movimiento });
  };

  const handleAprobar = (movimiento) => {
    setAprobarModal({ isOpen: true, movimiento });
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await movimientosService.delete(deleteModal.movimiento.id);
      deleted('Movimiento');
      setDeleteModal({ isOpen: false, movimiento: null });
      fetchMovimientos(pagination.page);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmAprobar = async (data) => {
    setFormLoading(true);
    try {
      await movimientosService.aprobar(aprobarModal.movimiento.id, {
        aprobado: true,
        ...data,
      });
      success('Movimiento aprobado correctamente');
      setAprobarModal({ isOpen: false, movimiento: null });
      fetchMovimientos(pagination.page);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmRechazar = async (data) => {
    setFormLoading(true);
    try {
      await movimientosService.aprobar(aprobarModal.movimiento.id, {
        aprobado: false,
        ...data,
      });
      success('Movimiento rechazado');
      setAprobarModal({ isOpen: false, movimiento: null });
      fetchMovimientos(pagination.page);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  const isPendiente = (m) =>
    m.aprobado === null || m.aprobado === 'pendiente' || m.aprobado === undefined;

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Movimientos de Caja Menor</h1>
            <p className="text-slate-500 mt-1">
              Gestiona los ingresos y egresos de caja menor
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ProtectedAction module="viajes" action="crear">
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Nuevo Movimiento
              </Button>
            </ProtectedAction>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <p className="font-medium">Error al cargar movimientos</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por consecutivo, concepto o conductor..."
                value={searchTerm}
                onChange={handleSearch}
                onClear={() => handleSearch('')}
              />
            </div>

            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtros
              {Object.values(filters).filter(Boolean).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={refresh}
              loading={loading}
            >
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <FilterDropdown
                  label="Tipo Movimiento"
                  options={FILTER_OPTIONS.tipo_movimiento}
                  value={filters.tipo_movimiento}
                  onChange={(v) => handleFilterChange('tipo_movimiento', v)}
                  placeholder="Todos"
                />
                <FilterDropdown
                  label="Concepto"
                  options={FILTER_OPTIONS.concepto}
                  value={filters.concepto}
                  onChange={(v) => handleFilterChange('concepto', v)}
                  placeholder="Todos"
                />
                <FilterDropdown
                  label="Estado Aprobacion"
                  options={FILTER_OPTIONS.aprobado}
                  value={filters.aprobado}
                  onChange={(v) => handleFilterChange('aprobado', v)}
                  placeholder="Todos"
                />
                <FilterDropdown
                  label="Caja Menor"
                  options={cajasMenores}
                  value={filters.caja_menor_id}
                  onChange={(v) => handleFilterChange('caja_menor_id', v)}
                  placeholder="Todas"
                />
                <FilterDropdown
                  label="Conductor"
                  options={conductores}
                  value={filters.conductor_id}
                  onChange={(v) => handleFilterChange('conductor_id', v)}
                  placeholder="Todos"
                />
              </div>

              {Object.values(filters).filter(Boolean).length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RESULTS COUNT */}
        <div className="mb-4">
          <p className="text-sm text-slate-500">
            {pagination.total} movimiento{pagination.total !== 1 && 's'} encontrado{pagination.total !== 1 && 's'}
          </p>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : movimientos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">
                No se encontraron movimientos
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || Object.values(filters).filter(Boolean).length > 0
                  ? 'Intenta ajustar los filtros de busqueda'
                  : 'Comienza registrando el primer movimiento'}
              </p>
              {!searchTerm && Object.values(filters).filter(Boolean).length === 0 && (
                <ProtectedAction module="viajes" action="crear">
                  <Button variant="primary" icon={Plus} onClick={handleCreate}>
                    Nuevo Movimiento
                  </Button>
                </ProtectedAction>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 px-4 text-center">
                      <Checkbox
                        size="small"
                        checked={pendientes.length > 0 && selected.length === pendientes.length}
                        indeterminate={selected.length > 0 && selected.length < pendientes.length}
                        onChange={handleSelectAll}
                        sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#f97316' } }}
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Consecutivo
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Concepto
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Aprobado
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Valor Aprobado
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Caja Menor
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Viaje
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Conductor
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov) => {
                    const approval = getApprovalDisplay(mov.aprobado);
                    const ApprovalIcon = approval.icon;

                    return (
                      <tr
                        key={mov.id}
                        className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4 text-center">
                          {isPendiente(mov) ? (
                            <Checkbox
                              size="small"
                              checked={selected.includes(mov.id)}
                              onChange={() => handleSelectOne(mov.id)}
                              sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#f97316' } }}
                            />
                          ) : (
                            <span className="inline-block w-[42px]" />
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm font-mono text-slate-800 font-medium">
                          {mov.consecutivo || mov.id}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {CONCEPTO_LABELS[mov.concepto] || mov.concepto || '-'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Chip
                            label={mov.tipo_movimiento === 'ingreso' ? 'Ingreso' : 'Egreso'}
                            size="small"
                            sx={{
                              backgroundColor: mov.tipo_movimiento === 'ingreso' ? '#dcfce7' : '#fee2e2',
                              color: mov.tipo_movimiento === 'ingreso' ? '#16a34a' : '#dc2626',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          />
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-800 font-semibold text-right">
                          {formatMoney(mov.valor)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            approval.color === 'success'
                              ? 'bg-green-100 text-green-700'
                              : approval.color === 'error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {ApprovalIcon && <ApprovalIcon className="w-3.5 h-3.5" />}
                            {approval.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-800 text-right">
                          {formatMoney(mov.valor_aprobado)}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {mov.caja_menor?.numero ? `#${mov.caja_menor.numero}` : mov.caja_menor_id || '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {mov.viaje
                            ? `#${mov.viaje.numero}${mov.viaje.destino ? ` - ${mov.viaje.destino}` : ''}`
                            : '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {mov.conductor?.nombre_completo || mov.conductor?.username || '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-500">
                          {mov.fecha
                            ? new Date(mov.fecha).toLocaleDateString('es-CO')
                            : '-'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <RowActions
                            movimiento={mov}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAprobar={handleAprobar}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={goToPage}
            />
          )}
        </div>

        {/* MASS APPROVAL FLOATING BAR */}
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
              <span className="text-sm font-medium">
                {selected.length} movimiento{selected.length !== 1 && 's'} seleccionado{selected.length !== 1 && 's'}
              </span>
              <button
                onClick={handleMassApproval}
                disabled={formLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar {selected.length} seleccionado{selected.length !== 1 && 's'}
              </button>
              <button
                onClick={() => setSelected([])}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          &copy; 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logistico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* MODALS */}
      <MovimientoForm
        open={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, movimiento: null })}
        onSuccess={() => {
          setFormModal({ isOpen: false, movimiento: null });
          refresh();
        }}
        movimientoId={formModal.movimiento?.id}
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, movimiento: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Movimiento"
        message={`¿Estas seguro de eliminar el movimiento "${deleteModal.movimiento?.consecutivo || deleteModal.movimiento?.id}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />

      <AprobarMovimientoDialog
        isOpen={aprobarModal.isOpen}
        onClose={() => setAprobarModal({ isOpen: false, movimiento: null })}
        movimiento={aprobarModal.movimiento}
        onAprobar={handleConfirmAprobar}
        onRechazar={handleConfirmRechazar}
        loading={formLoading}
      />
    </div>
  );
};

export default MovimientosList;
