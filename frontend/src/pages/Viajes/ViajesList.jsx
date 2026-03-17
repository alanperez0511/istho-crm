/**
 * ============================================================================
 * ISTHO CRM - ViajesList
 * ============================================================================
 * Lista de viajes conectada al backend real.
 *
 * @author Coordinacion TI ISTHO
 * @version 1.0.0
 * @date Marzo 2026
 */

import { useState, useEffect } from 'react';
import { Menu, MenuItem, IconButton } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  RefreshCw,
  Check,
  X,
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

// Services
import { viajesService } from '../../api/viajes.service';

// Hooks
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import { ProtectedAction } from '../../components/auth/PrivateRoute';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACION DE FILTROS
// ════════════════════════════════════════════════════════════════════════════

const FILTER_OPTIONS = {
  estado: [
    { value: 'activo', label: 'Activo' },
    { value: 'completado', label: 'Completado' },
    { value: 'anulado', label: 'Anulado' },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Formatear fecha DD/MM/YYYY
// ════════════════════════════════════════════════════════════════════════════

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE ROW ACTIONS
// ════════════════════════════════════════════════════════════════════════════

const RowActions = ({ viaje, onView, onEdit, onDelete }) => {
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
              }
            },
          },
        }}
      >
        <MenuItem onClick={() => { onView(viaje); handleClose(); }}>
          <Eye className="w-4 h-4" />
          Ver detalle
        </MenuItem>

        <ProtectedAction module="viajes" action="editar">
          <MenuItem onClick={() => { onEdit(viaje); handleClose(); }}>
            <Pencil className="w-4 h-4" />
            Editar
          </MenuItem>
        </ProtectedAction>

        <ProtectedAction module="viajes" action="eliminar">
          <MenuItem
            onClick={() => { onDelete(viaje); handleClose(); }}
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

const ViajesList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // ──────────────────────────────────────────────────────────────────────────
  // HOOKS
  // ──────────────────────────────────────────────────────────────────────────
  const { success, apiError, deleted } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES
  // ──────────────────────────────────────────────────────────────────────────
  const [viajes, setViajes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    estado: searchParams.get('estado') || '',
    fecha_desde: searchParams.get('fecha_desde') || '',
    fecha_hasta: searchParams.get('fecha_hasta') || '',
    conductor_id: searchParams.get('conductor_id') || '',
    vehiculo_id: searchParams.get('vehiculo_id') || '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, viaje: null });
  const [formLoading, setFormLoading] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ──────────────────────────────────────────────────────────────────────────

  const fetchViajes = async (page = 1, currentFilters = filters, query = searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(query && { search: query }),
      };

      // Agregar filtros activos
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const response = await viajesService.getAll(params);
      const data = response.data || response;

      setViajes(data.viajes || data.rows || data.data || []);
      setPagination((prev) => ({
        ...prev,
        page: data.page || data.currentPage || page,
        totalPages: data.totalPages || Math.ceil((data.total || 0) / prev.limit),
        total: data.total || data.count || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar viajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViajes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => fetchViajes(pagination.page, filters, searchTerm);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS DE BUSQUEDA Y FILTROS
  // ──────────────────────────────────────────────────────────────────────────

  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchViajes(1, filters, value);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value || '' };
    setFilters(newFilters);
    fetchViajes(1, newFilters, searchTerm);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
      conductor_id: '',
      vehiculo_id: '',
    };
    setFilters(emptyFilters);
    setSearchTerm('');
    fetchViajes(1, emptyFilters, '');
    setSearchParams({});
  };

  const goToPage = (page) => {
    fetchViajes(page, filters, searchTerm);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS CRUD
  // ──────────────────────────────────────────────────────────────────────────

  const handleCreate = () => {
    navigate('/viajes/viajes/nuevo');
  };

  const handleEdit = (viaje) => {
    navigate(`/viajes/viajes/${viaje.id}`);
  };

  const handleView = (viaje) => {
    navigate(`/viajes/viajes/${viaje.id}`);
  };

  const handleDelete = (viaje) => {
    setDeleteModal({ isOpen: true, viaje });
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await viajesService.delete(deleteModal.viaje.id);
      deleted('Viaje');
      setDeleteModal({ isOpen: false, viaje: null });
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

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Viajes</h1>
            <p className="text-slate-500 mt-1">
              Gestiona los viajes y despachos de carga
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ProtectedAction module="viajes" action="crear">
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Nuevo Viaje
              </Button>
            </ProtectedAction>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <p className="font-medium">Error al cargar viajes</p>
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
                placeholder="Buscar por numero, destino, cliente o documento..."
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
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {activeFilterCount}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterDropdown
                  label="Estado"
                  options={FILTER_OPTIONS.estado}
                  value={filters.estado}
                  onChange={(v) => handleFilterChange('estado', v)}
                  placeholder="Todos los estados"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    value={filters.fecha_desde}
                    onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    value={filters.fecha_hasta}
                    onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {activeFilterCount > 0 && (
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
            {pagination.total} viaje{pagination.total !== 1 && 's'} encontrado{pagination.total !== 1 && 's'}
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
          ) : viajes.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">
                No se encontraron viajes
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || activeFilterCount > 0
                  ? 'Intenta ajustar los filtros de busqueda'
                  : 'Comienza registrando tu primer viaje'}
              </p>
              {!searchTerm && activeFilterCount === 0 && (
                <ProtectedAction module="viajes" action="crear">
                  <Button variant="primary" icon={Plus} onClick={handleCreate}>
                    Nuevo Viaje
                  </Button>
                </ProtectedAction>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Numero
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Destino
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Doc. Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Vehiculo
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Conductor
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Facturado
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
                  {viajes.map((viaje) => (
                    <tr
                      key={viaje.id}
                      className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p
                              className="text-sm font-medium text-slate-800 hover:text-orange-600 cursor-pointer"
                              onClick={() => handleView(viaje)}
                            >
                              {viaje.numero}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {formatDate(viaje.fecha)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {viaje.origen || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {viaje.destino || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {viaje.cliente_nombre || viaje.Cliente?.razon_social || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 font-mono">
                        {viaje.documento_cliente || viaje.Cliente?.nit || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {viaje.vehiculo_placa || viaje.Vehiculo?.placa || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {viaje.conductor_nombre || viaje.Conductor?.nombre || '-'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {viaje.facturado ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                            <Check className="w-4 h-4 text-green-600" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                            <X className="w-4 h-4 text-gray-400" />
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusChip status={viaje.estado} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <RowActions
                          viaje={viaje}
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
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          &copy; 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logistico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* MODALS */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, viaje: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Viaje"
        message={`¿Estas seguro de eliminar el viaje "${deleteModal.viaje?.numero}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default ViajesList;
