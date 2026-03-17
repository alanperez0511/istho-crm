/**
 * ============================================================================
 * ISTHO CRM - VehiculosList
 * ============================================================================
 * Lista de vehículos conectada al backend real.
 * Incluye alertas de vencimiento de SOAT y Tecnicomecánica.
 *
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Marzo 2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Menu, MenuItem, IconButton } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Truck,
  AlertTriangle,
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
import VehiculoForm from './components/VehiculoForm';

// Hooks
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import { ProtectedAction } from '../../components/auth/PrivateRoute';

// Services
import { vehiculosService } from '../../api/viajes.service';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE FILTROS
// ════════════════════════════════════════════════════════════════════════════

const FILTER_OPTIONS = {
  tipo_vehiculo: [
    { value: 'sencillo', label: 'Sencillo' },
    { value: 'tractomula', label: 'Tractomula' },
    { value: 'turbo', label: 'Turbo' },
    { value: 'dobletroque', label: 'Doble Troque' },
    { value: 'minimula', label: 'Minimula' },
    { value: 'otro', label: 'Otro' },
  ],
  estado: [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const formatTipoVehiculo = (tipo) => {
  const tipos = {
    sencillo: 'Sencillo',
    tractomula: 'Tractomula',
    turbo: 'Turbo',
    dobletroque: 'Doble Troque',
    minimula: 'Minimula',
    otro: 'Otro',
  };
  return tipos[tipo] || tipo || '-';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Calcula el estado de vencimiento de un documento.
 * @returns 'vencido' | 'por_vencer' | 'vigente'
 */
const getVencimientoStatus = (fechaVencimiento) => {
  if (!fechaVencimiento) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const diffMs = vencimiento - hoy;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return 'vencido';
  if (diffDias <= 30) return 'por_vencer';
  return 'vigente';
};

const VencimientoBadge = ({ fecha, label }) => {
  const status = getVencimientoStatus(fecha);
  if (!status) return <span className="text-sm text-slate-400">-</span>;

  const config = {
    vencido: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      icon: true,
    },
    por_vencer: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: true,
    },
    vigente: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      icon: false,
    },
  };

  const c = config[status];

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.icon && <AlertTriangle className="w-3 h-3" />}
      {formatDate(fecha)}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE ROW ACTIONS
// ════════════════════════════════════════════════════════════════════════════

const RowActions = ({ vehiculo, onView, onEdit, onDelete }) => {
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
        <MenuItem onClick={() => { onView(vehiculo); handleClose(); }}>
          <Eye className="w-4 h-4" />
          Ver detalle
        </MenuItem>

        <ProtectedAction module="vehiculos" action="editar">
          <MenuItem onClick={() => { onEdit(vehiculo); handleClose(); }}>
            <Pencil className="w-4 h-4" />
            Editar
          </MenuItem>
        </ProtectedAction>

        <ProtectedAction module="vehiculos" action="eliminar">
          <MenuItem
            onClick={() => { onDelete(vehiculo); handleClose(); }}
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

const VehiculosList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // ──────────────────────────────────────────────────────────────────────────
  // HOOKS
  // ──────────────────────────────────────────────────────────────────────────
  const { success, apiError, saved, deleted } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES
  // ──────────────────────────────────────────────────────────────────────────
  const [vehiculos, setVehiculos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tipo_vehiculo: searchParams.get('tipo_vehiculo') || '',
    estado: searchParams.get('estado') || '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [formModal, setFormModal] = useState({ isOpen: false, vehiculo: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, vehiculo: null });
  const [formLoading, setFormLoading] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // FETCH
  // ──────────────────────────────────────────────────────────────────────────

  const fetchVehiculos = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.tipo_vehiculo && { tipo_vehiculo: filters.tipo_vehiculo }),
        ...(filters.estado && { estado: filters.estado }),
      };
      const response = await vehiculosService.getAll(params);
      const data = response.data || response;
      setVehiculos(data.vehiculos || data.rows || data.data || []);
      setPagination((prev) => ({
        ...prev,
        page: data.page || data.currentPage || page,
        totalPages: data.totalPages || Math.ceil((data.total || 0) / prev.limit),
        total: data.total || data.count || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.limit]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    fetchVehiculos(page);
  }, [fetchVehiculos, searchParams]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS DE BÚSQUEDA Y FILTROS
  // ──────────────────────────────────────────────────────────────────────────

  const handleSearch = (value) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value || '' };
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setFilters({ tipo_vehiculo: '', estado: '' });
    setSearchTerm('');
    setSearchParams({});
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
  };

  const refresh = () => {
    const page = parseInt(searchParams.get('page')) || 1;
    fetchVehiculos(page);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS CRUD
  // ──────────────────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setFormModal({ isOpen: true, vehiculo: null });
  };

  const handleEdit = (vehiculo) => {
    setFormModal({ isOpen: true, vehiculo });
  };

  const handleView = (vehiculo) => {
    navigate(`/viajes/vehiculos/${vehiculo.id}`);
  };

  const handleDelete = (vehiculo) => {
    setDeleteModal({ isOpen: true, vehiculo });
  };

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (formModal.vehiculo) {
        await vehiculosService.update(formModal.vehiculo.id, data);
        saved('Vehículo');
      } else {
        await vehiculosService.create(data);
        saved('Vehículo');
      }
      setFormModal({ isOpen: false, vehiculo: null });
      refresh();
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await vehiculosService.delete(deleteModal.vehiculo.id);
      deleted('Vehículo');
      setDeleteModal({ isOpen: false, vehiculo: null });
      refresh();
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Vehículos</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Gestiona la flota de vehículos para despachos y viajes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ProtectedAction module="vehiculos" action="crear">
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Nuevo Vehículo
              </Button>
            </ProtectedAction>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            <p className="font-medium">Error al cargar vehículos</p>
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por placa..."
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
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FilterDropdown
                  label="Tipo de Vehículo"
                  options={FILTER_OPTIONS.tipo_vehiculo}
                  value={filters.tipo_vehiculo}
                  onChange={(v) => handleFilterChange('tipo_vehiculo', v)}
                  placeholder="Todos los tipos"
                />
                <FilterDropdown
                  label="Estado"
                  options={FILTER_OPTIONS.estado}
                  value={filters.estado}
                  onChange={(v) => handleFilterChange('estado', v)}
                  placeholder="Todos los estados"
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pagination.total} vehículo{pagination.total !== 1 && 's'} encontrado{pagination.total !== 1 && 's'}
          </p>
        </div>

        {/* TABLE */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          {loading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 dark:border-slate-700 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 dark:bg-slate-600 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-slate-700 rounded-full" />
                </div>
              ))}
            </div>
          ) : vehiculos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">
                No se encontraron vehículos
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchTerm || Object.values(filters).filter(Boolean).length > 0
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer vehículo'}
              </p>
              {!searchTerm && Object.values(filters).filter(Boolean).length === 0 && (
                <ProtectedAction module="vehiculos" action="crear">
                  <Button variant="primary" icon={Plus} onClick={handleCreate}>
                    Nuevo Vehículo
                  </Button>
                </ProtectedAction>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Capacidad (Ton)
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Conductor
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Venc. SOAT
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Venc. Tecnicomecánica
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map((vehiculo) => (
                    <tr
                      key={vehiculo.id}
                      className="border-b border-gray-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                            <Truck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <p
                            className="text-sm font-medium text-slate-800 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer font-mono"
                            onClick={() => handleView(vehiculo)}
                          >
                            {vehiculo.placa}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatTipoVehiculo(vehiculo.tipo_vehiculo)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300 text-center">
                        {vehiculo.capacidad_ton != null ? vehiculo.capacidad_ton : '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300">
                        {vehiculo.conductor || '-'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <VencimientoBadge fecha={vehiculo.vencimiento_soat} label="SOAT" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <VencimientoBadge fecha={vehiculo.vencimiento_tecnicomecanica} label="Tecnicomecánica" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusChip status={vehiculo.estado} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <RowActions
                          vehiculo={vehiculo}
                          onView={handleView}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))}
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

        {/* FOOTER */}
        <footer className="text-center py-6 mt-8 text-slate-500 dark:text-slate-400 text-sm border-t border-gray-200 dark:border-slate-700">
          &copy; 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* MODALS */}
      <VehiculoForm
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, vehiculo: null })}
        onSubmit={handleFormSubmit}
        vehiculo={formModal.vehiculo}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, vehiculo: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Vehículo"
        message={`¿Estás seguro de eliminar el vehículo "${deleteModal.vehiculo?.placa}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default VehiculosList;
