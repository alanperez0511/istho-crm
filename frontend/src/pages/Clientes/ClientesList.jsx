/**
 * ISTHO CRM - ClientesList Page
 * Listado de clientes con búsqueda, filtros y paginación
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

// ============================================
// DATOS MOCK
// ============================================
const MOCK_CLIENTES = [
  { id: 'CLI-001', razonSocial: 'Lácteos Betania S.A.S', nit: '900.123.456-1', tipoCliente: 'corporativo', sector: 'alimentos', ciudad: 'Medellín', telefono: '+57 300 123 4567', email: 'contacto@lacteosb.com', estado: 'activo', despachosMes: 45, facturacionMes: 125400000 },
  { id: 'CLI-002', razonSocial: 'Almacenes Éxito S.A', nit: '890.900.123-4', tipoCliente: 'corporativo', sector: 'retail', ciudad: 'Bogotá', telefono: '+57 310 234 5678', email: 'proveedor@exito.com', estado: 'activo', despachosMes: 32, facturacionMes: 89200000 },
  { id: 'CLI-003', razonSocial: 'Eternit Colombia S.A', nit: '800.456.789-2', tipoCliente: 'corporativo', sector: 'construccion', ciudad: 'Cali', telefono: '+57 320 345 6789', email: 'logistica@eternit.co', estado: 'activo', despachosMes: 18, facturacionMes: 67800000 },
  { id: 'CLI-004', razonSocial: 'Prodenvases S.A.S', nit: '901.234.567-8', tipoCliente: 'pyme', sector: 'manufactura', ciudad: 'Barranquilla', telefono: '+57 315 456 7890', email: 'compras@prodenvases.com', estado: 'activo', despachosMes: 25, facturacionMes: 45600000 },
  { id: 'CLI-005', razonSocial: 'Klar Colombia S.A.S', nit: '900.987.654-3', tipoCliente: 'distribuidor', sector: 'manufactura', ciudad: 'Cartagena', telefono: '+57 318 567 8901', email: 'ventas@klar.co', estado: 'inactivo', despachosMes: 0, facturacionMes: 0 },
  { id: 'CLI-006', razonSocial: 'Distribuidora Nacional LTDA', nit: '800.111.222-3', tipoCliente: 'distribuidor', sector: 'retail', ciudad: 'Bucaramanga', telefono: '+57 311 678 9012', email: 'info@distnacional.com', estado: 'activo', despachosMes: 15, facturacionMes: 34500000 },
  { id: 'CLI-007', razonSocial: 'FarmaCorp S.A', nit: '900.333.444-5', tipoCliente: 'corporativo', sector: 'farmaceutico', ciudad: 'Medellín', telefono: '+57 312 789 0123', email: 'logistica@farmacorp.com', estado: 'activo', despachosMes: 28, facturacionMes: 78900000 },
  { id: 'CLI-008', razonSocial: 'Construcciones del Valle S.A.S', nit: '901.555.666-7', tipoCliente: 'pyme', sector: 'construccion', ciudad: 'Cali', telefono: '+57 313 890 1234', email: 'compras@consvalle.com', estado: 'suspendido', despachosMes: 0, facturacionMes: 0 },
  { id: 'CLI-009', razonSocial: 'Alimentos del Caribe S.A', nit: '800.777.888-9', tipoCliente: 'corporativo', sector: 'alimentos', ciudad: 'Barranquilla', telefono: '+57 314 901 2345', email: 'operaciones@alicaribe.com', estado: 'activo', despachosMes: 22, facturacionMes: 56700000 },
  { id: 'CLI-010', razonSocial: 'Minimarket Express', nit: '900.999.000-1', tipoCliente: 'minorista', sector: 'retail', ciudad: 'Pereira', telefono: '+57 316 012 3456', email: 'pedidos@miniexpress.com', estado: 'activo', despachosMes: 8, facturacionMes: 12300000 },
];

// Opciones de filtros
const FILTER_OPTIONS = {
  tipoCliente: [
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
  ],
  estado: [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'suspendido', label: 'Suspendido' },
  ],
};

// ============================================
// COMPONENTE ROW ACTIONS
// ============================================
const RowActions = ({ cliente, onView, onEdit, onDelete }) => {
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
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            <button
              onClick={() => { onView(cliente); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" />
              Ver detalle
            </button>
            <button
              onClick={() => { onEdit(cliente); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={() => { onDelete(cliente); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ClientesList = () => {
  const navigate = useNavigate();

  // Estados
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [formModal, setFormModal] = useState({ isOpen: false, cliente: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, cliente: null });
  const [formLoading, setFormLoading] = useState(false);

  const itemsPerPage = 8;

  // Cargar datos
  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setClientes(MOCK_CLIENTES);
      setLoading(false);
    };
    fetchClientes();
  }, []);

  // Filtrar clientes
  const filteredClientes = useMemo(() => {
    return clientes.filter((cliente) => {
      // Búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchSearch = 
          cliente.razonSocial.toLowerCase().includes(search) ||
          cliente.nit.includes(search) ||
          cliente.ciudad.toLowerCase().includes(search);
        if (!matchSearch) return false;
      }

      // Filtros
      if (filters.tipoCliente && cliente.tipoCliente !== filters.tipoCliente) return false;
      if (filters.sector && cliente.sector !== filters.sector) return false;
      if (filters.estado && cliente.estado !== filters.estado) return false;

      return true;
    });
  }, [clientes, searchTerm, filters]);

  // Paginar
  const paginatedClientes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClientes.slice(start, start + itemsPerPage);
  }, [filteredClientes, currentPage]);

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  // Handlers
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

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

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    
    if (formModal.cliente) {
      // Editar
      setClientes((prev) =>
        prev.map((c) => (c.id === formModal.cliente.id ? { ...c, ...data } : c))
      );
    } else {
      // Crear
      const newCliente = {
        ...data,
        id: `CLI-${String(clientes.length + 1).padStart(3, '0')}`,
        despachosMes: 0,
        facturacionMes: 0,
      };
      setClientes((prev) => [newCliente, ...prev]);
    }

    setFormLoading(false);
    setFormModal({ isOpen: false, cliente: null });
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setClientes((prev) => prev.filter((c) => c.id !== deleteModal.cliente.id));
    setFormLoading(false);
    setDeleteModal({ isOpen: false, cliente: null });
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader notificationCount={3} />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Clientes</h1>
            <p className="text-slate-500 mt-1">
              Gestiona la información de tus clientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" icon={Download} size="md">
              Exportar
            </Button>
            <Button variant="outline" icon={Upload} size="md">
              Importar
            </Button>
            <Button variant="primary" icon={Plus} onClick={handleCreate}>
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Search & Filters Bar */}
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
              {Object.keys(filters).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {Object.keys(filters).length}
                </span>
              )}
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterDropdown
                  label="Tipo de Cliente"
                  options={FILTER_OPTIONS.tipoCliente}
                  value={filters.tipoCliente}
                  onChange={(v) => handleFilterChange('tipoCliente', v)}
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

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-slate-500">
            {filteredClientes.length} cliente{filteredClientes.length !== 1 && 's'} encontrado{filteredClientes.length !== 1 && 's'}
          </p>
        </div>

        {/* Table */}
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
          ) : paginatedClientes.length === 0 ? (
            // Empty state
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">
                No se encontraron clientes
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer cliente'}
              </p>
              {!searchTerm && Object.keys(filters).length === 0 && (
                <Button variant="primary" icon={Plus} onClick={handleCreate}>
                  Nuevo Cliente
                </Button>
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
                      Despachos/Mes
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Facturación/Mes
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
                  {paginatedClientes.map((cliente) => (
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
                              {cliente.razonSocial}
                            </p>
                            <p className="text-xs text-slate-500">{cliente.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {cliente.nit}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 capitalize">
                        {cliente.tipoCliente}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {cliente.ciudad}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 text-center">
                        {cliente.despachosMes}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-800 text-right font-medium">
                        {formatCurrency(cliente.facturacionMes)}
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
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredClientes.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* Form Modal */}
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
        message={`¿Estás seguro de eliminar a "${deleteModal.cliente?.razonSocial}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default ClientesList;