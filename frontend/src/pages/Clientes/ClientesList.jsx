/**
 * ============================================================================
 * ISTHO CRM - ClientesList (Fase 5 - Integración Completa)
 * ============================================================================
 * Lista de clientes conectada al backend real mediante hooks.
 * 
 * CAMBIOS vs versión anterior:
 * - Eliminados datos MOCK
 * - Conectado con useClientes hook
 * - Integrado con sistema de notificaciones
 * - CRUD completo conectado a API
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
  Upload,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Building2,
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
} from '../../components/common';

// Local Components
import ClienteForm from './components/ClienteForm';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS INTEGRADOS
// ════════════════════════════════════════════════════════════════════════════
import useClientes from '../../hooks/useClientes';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import { ProtectedAction } from '../../components/auth/PrivateRoute';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE FILTROS
// ════════════════════════════════════════════════════════════════════════════
const FILTER_OPTIONS = {
  tipo_cliente: [
    { value: 'corporativo', label: 'Corporativo' },
    { value: 'pyme', label: 'PyME' },
    { value: 'distribuidor', label: 'Distribuidor' },
    { value: 'minorista', label: 'Minorista' },
  ],
  sector: [
    { value: 'alimentos', label: 'Alimentos y Bebidas' },
    { value: 'construccion', label: 'Construcción' },
    { value: 'manufactura', label: 'Manufactura' },
    { value: 'retail', label: 'Retail' },
    { value: 'farmaceutico', label: 'Farmacéutico' },
    { value: 'quimico', label: 'Químico' },
  ],
  estado: [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'suspendido', label: 'Suspendido' },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE ROW ACTIONS
// ════════════════════════════════════════════════════════════════════════════
const RowActions = ({ cliente, onView, onEdit, onDelete, onChangeStatus }) => {
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
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            <button
              onClick={() => { onView(cliente); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" />
              Ver detalle
            </button>
            
            {/* Solo admin y supervisor pueden editar */}
            <ProtectedAction module="clientes" action="editar">
              <button
                onClick={() => { onEdit(cliente); setIsOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            </ProtectedAction>

            {/* Solo admin puede cambiar estado */}
            <ProtectedAction module="clientes" action="cambiar_estado">
              <button
                onClick={() => { onChangeStatus(cliente); setIsOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
              >
                <RefreshCw className="w-4 h-4" />
                Cambiar Estado
              </button>
            </ProtectedAction>
            
            {/* Solo admin puede eliminar */}
            <ProtectedAction module="clientes" action="eliminar">
              <button
                onClick={() => { onDelete(cliente); setIsOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </ProtectedAction>
          </div>
        </>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const ClientesList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // ──────────────────────────────────────────────────────────────────────────
  // HOOKS
  // ──────────────────────────────────────────────────────────────────────────
  const { success, error: showError, apiError, saved, deleted } = useNotification();
  
  // Hook de clientes con autoFetch
  const {
    // Lista
    clientes,
    pagination,
    loading,
    error,
    // Acciones CRUD
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    changeStatus,
    // Paginación
    goToPage,
    setPageSize,
    // Filtros
    applyFilters,
    clearFilters,
    search,
    // Utilidades
    refresh,
  } = useClientes({ 
    autoFetch: true,
    initialFilters: {
      // Aplicar filtros de URL si existen
      estado: searchParams.get('estado') || undefined,
      sector: searchParams.get('sector') || undefined,
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES
  // ──────────────────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tipo_cliente: searchParams.get('tipo') || '',
    sector: searchParams.get('sector') || '',
    estado: searchParams.get('estado') || '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [formModal, setFormModal] = useState({ isOpen: false, cliente: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, cliente: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, cliente: null });
  const [formLoading, setFormLoading] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS DE BÚSQUEDA Y FILTROS
  // ──────────────────────────────────────────────────────────────────────────
  
  const handleSearch = (value) => {
    setSearchTerm(value);
    search(value);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    
    // Aplicar filtros al hook
    applyFilters(newFilters);
    
    // Actualizar URL
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    clearFilters();
    setSearchParams({});
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS CRUD
  // ──────────────────────────────────────────────────────────────────────────
  
  const handleCreate = () => {
    setFormModal({ isOpen: true, cliente: null });
  };

  const handleEdit = (cliente) => {
    setFormModal({ isOpen: true, cliente });
  };

  const handleView = (cliente) => {
    navigate(`/clientes/${cliente.id}`);
  };

  const handleDelete = (cliente) => {
    setDeleteModal({ isOpen: true, cliente });
  };

  const handleChangeStatus = (cliente) => {
    setStatusModal({ isOpen: true, cliente });
  };

  // Submit del formulario (crear/editar)
  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (formModal.cliente) {
        // Editar cliente existente
        await updateCliente(formModal.cliente.id, data);
        saved('Cliente');
      } else {
        // Crear nuevo cliente
        await createCliente(data);
        saved('Cliente');
      }
      setFormModal({ isOpen: false, cliente: null });
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    setFormLoading(true);
    try {
      await deleteCliente(deleteModal.cliente.id);
      deleted('Cliente');
      setDeleteModal({ isOpen: false, cliente: null });
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Confirmar cambio de estado
  const handleConfirmStatusChange = async (nuevoEstado) => {
    setFormLoading(true);
    try {
      await changeStatus(statusModal.cliente.id, nuevoEstado);
      success(`Estado cambiado a ${nuevoEstado}`);
      setStatusModal({ isOpen: false, cliente: null });
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // FORMATTERS
  // ──────────────────────────────────────────────────────────────────────────
  
  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PAGE HEADER */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Clientes</h1>
            <p className="text-slate-500 mt-1">
              Gestiona la información de tus clientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Exportar - Solo supervisor y admin */}
            <ProtectedAction module="clientes" action="exportar">
              <Button variant="outline" icon={Download} size="md">
                Exportar
              </Button>
            </ProtectedAction>

            {/* Importar - Solo admin */}
            <ProtectedAction module="clientes" action="importar">
              <Button variant="outline" icon={Upload} size="md">
                Importar
              </Button>
            </ProtectedAction>

            {/* Crear - Admin y Supervisor */}
            <ProtectedAction module="clientes" action="crear">
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Nuevo Cliente
              </Button>
            </ProtectedAction>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ERROR STATE */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <p className="font-medium">Error al cargar clientes</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={refresh}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SEARCH & FILTERS BAR */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por nombre, NIT o ciudad..."
                value={searchTerm}
                onChange={handleSearch}
                onClear={() => handleSearch('')}
              />
            </div>

            {/* Filter Toggle */}
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

            {/* Refresh */}
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={refresh}
              loading={loading}
            >
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterDropdown
                  label="Tipo de Cliente"
                  options={FILTER_OPTIONS.tipo_cliente}
                  value={filters.tipo_cliente}
                  onChange={(v) => handleFilterChange('tipo_cliente', v)}
                  placeholder="Todos los tipos"
                />
                <FilterDropdown
                  label="Sector"
                  options={FILTER_OPTIONS.sector}
                  value={filters.sector}
                  onChange={(v) => handleFilterChange('sector', v)}
                  placeholder="Todos los sectores"
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

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* RESULTS COUNT */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="mb-4">
          <p className="text-sm text-slate-500">
            {pagination.total} cliente{pagination.total !== 1 && 's'} encontrado{pagination.total !== 1 && 's'}
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TABLE */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            // Loading skeleton
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
          ) : clientes.length === 0 ? (
            // Empty state
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">
                No se encontraron clientes
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || Object.values(filters).filter(Boolean).length > 0
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer cliente'}
              </p>
              {!searchTerm && Object.values(filters).filter(Boolean).length === 0 && (
                <ProtectedAction module="clientes" action="crear">
                  <Button variant="primary" icon={Plus} onClick={handleCreate}>
                    Nuevo Cliente
                  </Button>
                </ProtectedAction>
              )}
            </div>
          ) : (
            // Table
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      NIT
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ciudad
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
                  {clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p 
                              className="text-sm font-medium text-slate-800 hover:text-orange-600 cursor-pointer"
                              onClick={() => handleView(cliente)}
                            >
                              {cliente.razon_social}
                            </p>
                            <p className="text-xs text-slate-500">{cliente.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {cliente.nit}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 capitalize">
                        {cliente.tipo_cliente || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {cliente.ciudad}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusChip status={cliente.estado} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <RowActions
                          cliente={cliente}
                          onView={handleView}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onChangeStatus={handleChangeStatus}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
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

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FOOTER */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      
      {/* Form Modal (Crear/Editar) */}
      <ClienteForm
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, cliente: null })}
        onSubmit={handleFormSubmit}
        cliente={formModal.cliente}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, cliente: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar a "${deleteModal.cliente?.razon_social}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />

      {/* Status Change Modal */}
      {statusModal.isOpen && (
        <ConfirmDialog
          isOpen={statusModal.isOpen}
          onClose={() => setStatusModal({ isOpen: false, cliente: null })}
          title="Cambiar Estado"
          message={`Selecciona el nuevo estado para "${statusModal.cliente?.razon_social}"`}
          loading={formLoading}
          customContent={
            <div className="space-y-2 mt-4">
              {FILTER_OPTIONS.estado.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleConfirmStatusChange(opt.value)}
                  disabled={statusModal.cliente?.estado === opt.value}
                  className={`
                    w-full p-3 text-left rounded-xl border transition-colors
                    ${statusModal.cliente?.estado === opt.value 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-white border-slate-200 hover:border-orange-500 hover:bg-orange-50'
                    }
                  `}
                >
                  {opt.label}
                  {statusModal.cliente?.estado === opt.value && (
                    <span className="text-xs ml-2">(actual)</span>
                  )}
                </button>
              ))}
            </div>
          }
          hideConfirmButton
        />
      )}
    </div>
  );
};

export default ClientesList;