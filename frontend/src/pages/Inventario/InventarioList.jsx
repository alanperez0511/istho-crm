/**
 * ISTHO CRM - InventarioList Page
 * Listado de productos con búsqueda, filtros y paginación
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
  Package,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  Warehouse,
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
import ProductoForm from './components/ProductoForm';
import MovimientoForm from './components/MovimientoForm';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_PRODUCTOS = [
  { id: 'PRD-001', codigo: 'SKU-LCH-001', nombre: 'Leche UHT x24', categoria: 'lacteos', clientePropietario: 'CLI-001', clienteNombre: 'Lácteos Betania', bodega: 'BOD-01', ubicacion: 'A-01-03', stockActual: 12500, stockMinimo: 1000, unidadMedida: 'caja', estado: 'disponible', costoUnitario: 48000, ultimoMovimiento: '2026-01-08' },
  { id: 'PRD-002', codigo: 'SKU-YGT-001', nombre: 'Yogurt Griego x12', categoria: 'lacteos', clientePropietario: 'CLI-001', clienteNombre: 'Lácteos Betania', bodega: 'BOD-01', ubicacion: 'A-02-01', stockActual: 8200, stockMinimo: 500, unidadMedida: 'caja', estado: 'disponible', costoUnitario: 72000, ultimoMovimiento: '2026-01-07' },
  { id: 'PRD-003', codigo: 'SKU-TEJ-001', nombre: 'Tejas Onduladas', categoria: 'construccion', clientePropietario: 'CLI-003', clienteNombre: 'Eternit Colombia', bodega: 'BOD-04', ubicacion: 'B-01-05', stockActual: 450, stockMinimo: 500, unidadMedida: 'unidad', estado: 'bajo_stock', costoUnitario: 35000, ultimoMovimiento: '2026-01-06' },
  { id: 'PRD-004', codigo: 'SKU-ENV-001', nombre: 'Envases PET 500ml', categoria: 'envases', clientePropietario: 'CLI-004', clienteNombre: 'Prodenvases', bodega: 'BOD-02', ubicacion: 'C-03-02', stockActual: 45000, stockMinimo: 5000, unidadMedida: 'unidad', estado: 'disponible', costoUnitario: 850, ultimoMovimiento: '2026-01-08' },
  { id: 'PRD-005', codigo: 'SKU-DET-001', nombre: 'Detergente Industrial 20L', categoria: 'quimicos', clientePropietario: 'CLI-005', clienteNombre: 'Klar Colombia', bodega: 'BOD-03', ubicacion: 'D-02-01', stockActual: 320, stockMinimo: 100, unidadMedida: 'unidad', estado: 'disponible', costoUnitario: 125000, ultimoMovimiento: '2026-01-07' },
  { id: 'PRD-006', codigo: 'SKU-QSO-001', nombre: 'Queso Doble Crema x5kg', categoria: 'lacteos', clientePropietario: 'CLI-001', clienteNombre: 'Lácteos Betania', bodega: 'BOD-01', ubicacion: 'A-03-02', stockActual: 890, stockMinimo: 200, unidadMedida: 'unidad', estado: 'disponible', costoUnitario: 85000, ultimoMovimiento: '2026-01-08' },
  { id: 'PRD-007', codigo: 'SKU-CEM-001', nombre: 'Cemento Gris x50kg', categoria: 'construccion', clientePropietario: 'CLI-003', clienteNombre: 'Eternit Colombia', bodega: 'BOD-04', ubicacion: 'B-02-01', stockActual: 0, stockMinimo: 200, unidadMedida: 'bulto', estado: 'agotado', costoUnitario: 28000, ultimoMovimiento: '2026-01-05' },
  { id: 'PRD-008', codigo: 'SKU-BOT-001', nombre: 'Botellones Agua 20L', categoria: 'envases', clientePropietario: 'CLI-004', clienteNombre: 'Prodenvases', bodega: 'BOD-02', ubicacion: 'C-01-04', stockActual: 2800, stockMinimo: 500, unidadMedida: 'unidad', estado: 'disponible', costoUnitario: 12000, ultimoMovimiento: '2026-01-08' },
  { id: 'PRD-009', codigo: 'SKU-DES-001', nombre: 'Desinfectante 5L', categoria: 'quimicos', clientePropietario: 'CLI-005', clienteNombre: 'Klar Colombia', bodega: 'BOD-03', ubicacion: 'D-01-03', stockActual: 150, stockMinimo: 200, unidadMedida: 'unidad', estado: 'bajo_stock', costoUnitario: 45000, ultimoMovimiento: '2026-01-06' },
  { id: 'PRD-010', codigo: 'SKU-MNT-001', nombre: 'Mantequilla x500g', categoria: 'lacteos', clientePropietario: 'CLI-001', clienteNombre: 'Lácteos Betania', bodega: 'BOD-01', ubicacion: 'A-01-05', stockActual: 3200, stockMinimo: 800, unidadMedida: 'unidad', estado: 'disponible', costoUnitario: 18000, ultimoMovimiento: '2026-01-08' },
];

// Opciones de filtros
const FILTER_OPTIONS = {
  categoria: [
    { value: 'lacteos', label: 'Lácteos' },
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'construccion', label: 'Construcción' },
    { value: 'envases', label: 'Envases' },
    { value: 'quimicos', label: 'Químicos' },
    { value: 'alimentos', label: 'Alimentos' },
  ],
  bodega: [
    { value: 'BOD-01', label: 'Área 01 - Refrigerados' },
    { value: 'BOD-02', label: 'Área 02 - Secos' },
    { value: 'BOD-03', label: 'Área 03 - Químicos' },
    { value: 'BOD-04', label: 'Área 04 - Construcción' },
  ],
  estado: [
    { value: 'disponible', label: 'Disponible' },
    { value: 'bajo_stock', label: 'Bajo Stock' },
    { value: 'agotado', label: 'Agotado' },
    { value: 'reservado', label: 'Reservado' },
  ],
};

// ============================================
// COMPONENTE ROW ACTIONS
// ============================================
const RowActions = ({ producto, onView, onEdit, onDelete, onEntrada, onSalida }) => {
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
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            <button
              onClick={() => { onView(producto); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" />
              Ver detalle
            </button>
            <button
              onClick={() => { onEdit(producto); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => { onEntrada(producto); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
            >
              <PackagePlus className="w-4 h-4" />
              Registrar Entrada
            </button>
            <button
              onClick={() => { onSalida(producto); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
              disabled={producto.stockActual === 0}
            >
              <PackageMinus className="w-4 h-4" />
              Registrar Salida
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => { onDelete(producto); setIsOpen(false); }}
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
// STOCK INDICATOR
// ============================================
const StockIndicator = ({ actual, minimo }) => {
  const porcentaje = minimo > 0 ? (actual / minimo) * 100 : 100;
  let colorClass = 'bg-emerald-500';
  
  if (actual === 0) {
    colorClass = 'bg-red-500';
  } else if (porcentaje <= 100) {
    colorClass = 'bg-amber-500';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-slate-700">
        {actual.toLocaleString()}
      </span>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const InventarioList = () => {
  const navigate = useNavigate();

  // Estados
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [formModal, setFormModal] = useState({ isOpen: false, producto: null });
  const [movimientoModal, setMovimientoModal] = useState({ isOpen: false, tipo: 'entrada', producto: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, producto: null });
  const [formLoading, setFormLoading] = useState(false);

  const itemsPerPage = 8;

  // Cargar datos
  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setProductos(MOCK_PRODUCTOS);
      setLoading(false);
    };
    fetchProductos();
  }, []);

  // KPIs calculados
  const kpis = useMemo(() => {
    const total = productos.length;
    const disponibles = productos.filter(p => p.estado === 'disponible').length;
    const bajoStock = productos.filter(p => p.estado === 'bajo_stock').length;
    const agotados = productos.filter(p => p.estado === 'agotado').length;
    const valorTotal = productos.reduce((sum, p) => sum + (p.stockActual * p.costoUnitario), 0);

    return { total, disponibles, bajoStock, agotados, valorTotal };
  }, [productos]);

  // Filtrar productos
  const filteredProductos = useMemo(() => {
    return productos.filter((producto) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchSearch = 
          producto.nombre.toLowerCase().includes(search) ||
          producto.codigo.toLowerCase().includes(search) ||
          producto.clienteNombre.toLowerCase().includes(search);
        if (!matchSearch) return false;
      }

      if (filters.categoria && producto.categoria !== filters.categoria) return false;
      if (filters.bodega && producto.bodega !== filters.bodega) return false;
      if (filters.estado && producto.estado !== filters.estado) return false;

      return true;
    });
  }, [productos, searchTerm, filters]);

  // Paginar
  const paginatedProductos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProductos.slice(start, start + itemsPerPage);
  }, [filteredProductos, currentPage]);

  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

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
    setFormModal({ isOpen: true, producto: null });
  };

  const handleEdit = (producto) => {
    setFormModal({ isOpen: true, producto });
  };

  const handleView = (producto) => {
    navigate(`/inventario/productos/${producto.id}`);
  };

  const handleDelete = (producto) => {
    setDeleteModal({ isOpen: true, producto });
  };

  const handleEntrada = (producto) => {
    setMovimientoModal({ isOpen: true, tipo: 'entrada', producto });
  };

  const handleSalida = (producto) => {
    setMovimientoModal({ isOpen: true, tipo: 'salida', producto });
  };

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    
    if (formModal.producto) {
      setProductos((prev) =>
        prev.map((p) => (p.id === formModal.producto.id ? { ...p, ...data } : p))
      );
    } else {
      const newProducto = {
        ...data,
        id: `PRD-${String(productos.length + 1).padStart(3, '0')}`,
        ultimoMovimiento: new Date().toISOString().split('T')[0],
      };
      setProductos((prev) => [newProducto, ...prev]);
    }

    setFormLoading(false);
    setFormModal({ isOpen: false, producto: null });
  };

  const handleMovimientoSubmit = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    
    // Actualizar stock
    const isEntrada = data.tipo === 'entrada';
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id === movimientoModal.producto.id) {
          const nuevoStock = isEntrada 
            ? p.stockActual + data.cantidad 
            : p.stockActual - data.cantidad;
          
          let nuevoEstado = 'disponible';
          if (nuevoStock === 0) nuevoEstado = 'agotado';
          else if (nuevoStock <= p.stockMinimo) nuevoEstado = 'bajo_stock';

          return {
            ...p,
            stockActual: nuevoStock,
            estado: nuevoEstado,
            ultimoMovimiento: data.fecha,
          };
        }
        return p;
      })
    );

    setFormLoading(false);
    setMovimientoModal({ isOpen: false, tipo: 'entrada', producto: null });
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setProductos((prev) => prev.filter((p) => p.id !== deleteModal.producto.id));
    setFormLoading(false);
    setDeleteModal({ isOpen: false, producto: null });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader notificationCount={kpis.bajoStock + kpis.agotados} />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Inventario</h1>
            <p className="text-slate-500 mt-1">
              Gestiona el inventario de productos
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
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Productos"
            value={kpis.total}
            icon={Package}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Disponibles"
            value={kpis.disponibles}
            change={`${((kpis.disponibles / kpis.total) * 100).toFixed(0)}% del total`}
            positive={true}
            icon={Warehouse}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Stock Bajo / Agotado"
            value={kpis.bajoStock + kpis.agotados}
            change={kpis.agotados > 0 ? `${kpis.agotados} agotados` : 'Sin agotados'}
            positive={kpis.agotados === 0}
            icon={AlertTriangle}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <KpiCard
            title="Valor Total"
            value={formatCurrency(kpis.valorTotal)}
            icon={Package}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por nombre, SKU o cliente..."
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
              {Object.keys(filters).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {Object.keys(filters).length}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterDropdown
                  label="Categoría"
                  options={FILTER_OPTIONS.categoria}
                  value={filters.categoria}
                  onChange={(v) => handleFilterChange('categoria', v)}
                  placeholder="Todas las categorías"
                />
                <FilterDropdown
                  label="Bodega"
                  options={FILTER_OPTIONS.bodega}
                  value={filters.bodega}
                  onChange={(v) => handleFilterChange('bodega', v)}
                  placeholder="Todas las bodegas"
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
            {filteredProductos.length} producto{filteredProductos.length !== 1 && 's'} encontrado{filteredProductos.length !== 1 && 's'}
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : paginatedProductos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">
                No se encontraron productos
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer producto'}
              </p>
              {!searchTerm && Object.keys(filters).length === 0 && (
                <Button variant="primary" icon={Plus} onClick={handleCreate}>
                  Nuevo Producto
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProductos.map((producto) => (
                    <tr
                      key={producto.id}
                      className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p 
                              className="text-sm font-medium text-slate-800 hover:text-orange-600 cursor-pointer"
                              onClick={() => handleView(producto)}
                            >
                              {producto.nombre}
                            </p>
                            <p className="text-xs text-slate-500">{producto.codigo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {producto.clienteNombre}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <p className="text-slate-800">{producto.ubicacion}</p>
                          <p className="text-xs text-slate-500">{FILTER_OPTIONS.bodega.find(b => b.value === producto.bodega)?.label}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StockIndicator actual={producto.stockActual} minimo={producto.stockMinimo} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusChip status={producto.estado} />
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-800 text-right font-medium">
                        {formatCurrency(producto.stockActual * producto.costoUnitario)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <RowActions
                          producto={producto}
                          onView={handleView}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onEntrada={handleEntrada}
                          onSalida={handleSalida}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProductos.length}
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

      {/* Modals */}
      <ProductoForm
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, producto: null })}
        onSubmit={handleFormSubmit}
        producto={formModal.producto}
        loading={formLoading}
      />

      <MovimientoForm
        isOpen={movimientoModal.isOpen}
        onClose={() => setMovimientoModal({ isOpen: false, tipo: 'entrada', producto: null })}
        onSubmit={handleMovimientoSubmit}
        tipo={movimientoModal.tipo}
        producto={movimientoModal.producto}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, producto: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de eliminar "${deleteModal.producto?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default InventarioList;