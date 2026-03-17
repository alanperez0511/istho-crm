/**
 * ============================================================================
 * ISTHO CRM - CajaMenorList
 * ============================================================================
 * Lista de cajas menores conectada al backend real.
 *
 * @author Coordinacion TI ISTHO
 * @version 1.0.0
 * @date Marzo 2026
 */

import { useState, useEffect } from 'react';
import { Menu, MenuItem, IconButton, Chip } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Wallet,
  Lock,
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
import CajaMenorForm from './components/CajaMenorForm';

// Services
import { cajasMenoresService } from '../../api/viajes.service';

// Hooks
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import { ProtectedAction } from '../../components/auth/PrivateRoute';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACION DE FILTROS
// ════════════════════════════════════════════════════════════════════════════

const FILTER_OPTIONS = {
  estado: [
    { value: 'abierta', label: 'Abierta' },
    { value: 'en_revision', label: 'En Revision' },
    { value: 'cerrada', label: 'Cerrada' },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Formato de moneda colombiana
// ════════════════════════════════════════════════════════════════════════════

const formatMoney = (value) => {
  if (value == null) return '$0';
  return `$${Number(value).toLocaleString('es-CO')}`;
};

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Chip de estado
// ════════════════════════════════════════════════════════════════════════════

const EstadoChip = ({ estado }) => {
  const config = {
    abierta: { label: 'Abierta', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    en_revision: { label: 'En Revision', color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
    cerrada: { label: 'Cerrada', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  };

  const c = config[estado] || config.cerrada;

  return (
    <Chip
      label={c.label}
      size="small"
      sx={{
        backgroundColor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
    />
  );
};

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Formatear fecha
// ════════════════════════════════════════════════════════════════════════════

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE ROW ACTIONS
// ════════════════════════════════════════════════════════════════════════════

const RowActions = ({ caja, onView, onEdit, onClose, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
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
        onClose={handleCloseMenu}
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
        <MenuItem onClick={() => { onView(caja); handleCloseMenu(); }}>
          <Eye className="w-4 h-4" />
          Ver detalle
        </MenuItem>

        <ProtectedAction module="viajes" action="editar">
          <MenuItem onClick={() => { onEdit(caja); handleCloseMenu(); }}>
            <Pencil className="w-4 h-4" />
            Editar
          </MenuItem>
        </ProtectedAction>

        {caja.estado === 'abierta' && (
          <ProtectedAction module="viajes" action="cerrar_caja">
            <MenuItem
              onClick={() => { onClose(caja); handleCloseMenu(); }}
              sx={{ color: '#d97706 !important', '&:hover': { backgroundColor: '#fffbeb !important' } }}
            >
              <Lock className="w-4 h-4" />
              Cerrar Caja
            </MenuItem>
          </ProtectedAction>
        )}

        <ProtectedAction module="viajes" action="eliminar">
          <MenuItem
            onClick={() => { onDelete(caja); handleCloseMenu(); }}
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
// COMPONENTE STATS CARDS
// ════════════════════════════════════════════════════════════════════════════

const StatsCards = ({ stats }) => {
  const cards = [
    {
      label: 'Abiertas',
      value: stats.abiertas ?? 0,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'En Revision',
      value: stats.en_revision ?? 0,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
    },
    {
      label: 'Cerradas',
      value: stats.cerradas ?? 0,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} ${card.border} border rounded-2xl p-4 flex items-center gap-4`}
        >
          <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
            <Wallet className={`w-6 h-6 ${card.color}`} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const CajaMenorList = () => {
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
  const [cajas, setCajas] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ abiertas: 0, en_revision: 0, cerradas: 0 });

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    estado: searchParams.get('estado') || '',
    conductor_id: searchParams.get('conductor_id') || '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [formModal, setFormModal] = useState({ isOpen: false, caja: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, caja: null });
  const [closeModal, setCloseModal] = useState({ isOpen: false, caja: null });
  const [formLoading, setFormLoading] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ──────────────────────────────────────────────────────────────────────────

  const fetchCajas = async (page = 1, currentFilters = filters, query = searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(query && { search: query }),
        ...(currentFilters.estado && { estado: currentFilters.estado }),
        ...(currentFilters.conductor_id && { conductor_id: currentFilters.conductor_id }),
      };
      const response = await cajasMenoresService.getAll(params);
      setCajas(response.data || []);
      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          page: response.pagination.page || page,
          totalPages: response.pagination.totalPages || 1,
          total: response.pagination.total || 0,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar las cajas menores');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await cajasMenoresService.getStats();
      setStats(response.data || response);
    } catch (err) {
      console.error('Error al cargar estadisticas:', err);
    }
  };

  useEffect(() => {
    fetchCajas();
    fetchStats();
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS DE BUSQUEDA Y FILTROS
  // ──────────────────────────────────────────────────────────────────────────

  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchCajas(1, filters, value);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    fetchCajas(1, newFilters, searchTerm);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    fetchCajas(1, {}, '');
    setSearchParams({});
  };

  const handleRefresh = () => {
    fetchCajas(pagination.page, filters, searchTerm);
    fetchStats();
  };

  const goToPage = (page) => {
    fetchCajas(page, filters, searchTerm);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS CRUD
  // ──────────────────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setFormModal({ isOpen: true, caja: null });
  };

  const handleEdit = (caja) => {
    setFormModal({ isOpen: true, caja });
  };

  const handleView = (caja) => {
    navigate(`/viajes/cajas-menores/${caja.id}`);
  };

  const handleDelete = (caja) => {
    setDeleteModal({ isOpen: true, caja });
  };

  const handleCloseCaja = (caja) => {
    setCloseModal({ isOpen: true, caja });
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await cajasMenoresService.delete(deleteModal.caja.id);
      deleted('Caja menor');
      setDeleteModal({ isOpen: false, caja: null });
      fetchCajas(pagination.page, filters, searchTerm);
      fetchStats();
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmClose = async () => {
    setFormLoading(true);
    try {
      await cajasMenoresService.close(closeModal.caja.id);
      success('Caja menor cerrada exitosamente');
      setCloseModal({ isOpen: false, caja: null });
      fetchCajas(pagination.page, filters, searchTerm);
      fetchStats();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Cajas Menores</h1>
            <p className="text-slate-500 mt-1">
              Gestiona las cajas menores de los viajes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ProtectedAction module="viajes" action="crear">
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Nueva Caja Menor
              </Button>
            </ProtectedAction>
          </div>
        </div>

        {/* STATS CARDS */}
        <StatsCards stats={stats} />

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <p className="font-medium">Error al cargar cajas menores</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={handleRefresh}
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
                placeholder="Buscar por numero o conductor..."
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
              onClick={handleRefresh}
              loading={loading}
            >
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <p className="text-sm text-slate-500">
            {pagination.total} caja{pagination.total !== 1 && 's'} menor{pagination.total !== 1 && 'es'} encontrada{pagination.total !== 1 && 's'}
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
          ) : cajas.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">
                No se encontraron cajas menores
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || Object.values(filters).filter(Boolean).length > 0
                  ? 'Intenta ajustar los filtros de busqueda'
                  : 'Comienza creando tu primera caja menor'}
              </p>
              {!searchTerm && Object.values(filters).filter(Boolean).length === 0 && (
                <ProtectedAction module="viajes" action="crear">
                  <Button variant="primary" icon={Plus} onClick={handleCreate}>
                    Nueva Caja Menor
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
                      Conductor
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Saldo Inicial
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Saldo Actual
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Fecha Apertura
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Caja Anterior
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cajas.map((caja) => (
                    <tr
                      key={caja.id}
                      className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p
                              className="text-sm font-medium text-slate-800 hover:text-orange-600 cursor-pointer"
                              onClick={() => handleView(caja)}
                            >
                              {caja.numero || `CM-${caja.id}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {caja.conductor?.nombre_completo || caja.conductor?.username || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 text-right font-mono">
                        {formatMoney(caja.saldo_inicial)}
                      </td>
                      <td className="py-4 px-4 text-sm text-right font-mono font-semibold">
                        <span className={caja.saldo_actual < 0 ? 'text-red-600' : 'text-slate-800'}>
                          {formatMoney(caja.saldo_actual)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <EstadoChip estado={caja.estado} />
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {formatDate(caja.fecha_apertura)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {caja.caja_anterior?.numero || caja.caja_anterior_numero || '-'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <RowActions
                          caja={caja}
                          onView={handleView}
                          onEdit={handleEdit}
                          onClose={handleCloseCaja}
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
      <CajaMenorForm
        open={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, caja: null })}
        onSuccess={() => {
          setFormModal({ isOpen: false, caja: null });
          handleRefresh();
        }}
        cajaId={formModal.caja?.id}
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, caja: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Caja Menor"
        message={`Estas seguro de eliminar la caja menor "${deleteModal.caja?.numero || ''}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={closeModal.isOpen}
        onClose={() => setCloseModal({ isOpen: false, caja: null })}
        onConfirm={handleConfirmClose}
        title="Cerrar Caja Menor"
        message={`Estas seguro de cerrar la caja menor "${closeModal.caja?.numero || ''}"? Una vez cerrada no se podran registrar mas gastos.`}
        confirmText="Cerrar Caja"
        type="warning"
        loading={formLoading}
      />
    </div>
  );
};

export default CajaMenorList;
