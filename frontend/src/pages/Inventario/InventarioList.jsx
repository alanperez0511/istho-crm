/**
 * ============================================================================
 * ISTHO CRM - InventarioList (Fase 5 - Integración Completa)
 * ============================================================================
 * Listado de productos conectado al backend real.
 * 
 * CAMBIOS vs versión anterior:
 * - Eliminado MOCK_PRODUCTOS
 * - Conectado con useInventario hook
 * - CRUD real de productos
 * - Movimientos (entrada/salida) conectados a API
 * - Control de permisos con ProtectedAction
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import { useState, useEffect, useMemo } from 'react';
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
  Package,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  Warehouse,
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
import ProductoForm from './components/ProductoForm';
import MovimientoForm from './components/MovimientoForm';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS INTEGRADOS
// ════════════════════════════════════════════════════════════════════════════
import useInventario from '../../hooks/useInventario';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import { ProtectedAction } from '../../components/auth/PrivateRoute';

// ════════════════════════════════════════════════════════════════════════════
// OPCIONES DE FILTROS
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Menú de acciones por fila
 */
const RowActions = ({ producto, onView, onEdit, onDelete, onEntrada, onSalida, canEdit, canDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

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
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            <button
              onClick={function() { onView(producto); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" />
              Ver detalle
            </button>
            {canEdit && (
              <button
                onClick={function() { onEdit(producto); setIsOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            )}
            {canEdit && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={function() { onEntrada(producto); setIsOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                >
                  <PackagePlus className="w-4 h-4" />
                  Registrar Entrada
                </button>
                <button
                  onClick={function() { onSalida(producto); setIsOpen(false); }}
                  className={'flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-blue-50 ' + (producto.stock_actual === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600')}
                  disabled={producto.stock_actual === 0}
                >
                  <PackageMinus className="w-4 h-4" />
                  Registrar Salida
                </button>
              </>
            )}
            {canDelete && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={function() { onDelete(producto); setIsOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
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
 * Indicador visual de stock
 */
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
          className={'h-full transition-all duration-300 ' + colorClass}
          style={{ width: Math.min(porcentaje, 100) + '%' }}
        />
      </div>
      <span className="text-sm font-medium text-slate-700">
        {actual.toLocaleString()}
      </span>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const InventarioList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
  const { success, apiError, saved, deleted, stockAlert } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // HOOK DE INVENTARIO
  // ──────────────────────────────────────────────────────────────────────────
  const {
    productos,
    loading,
    error,
    pagination,
    kpis,
    isRefreshing,
    // Acciones
    refresh,
    search,
    applyFilters,
    goToPage,
    createProducto,
    updateProducto,
    deleteProducto,
    registrarMovimiento,
  } = useInventario({ 
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
  
  // Modals
  const [formModal, setFormModal] = useState({ isOpen: false, producto: null });
  const [movimientoModal, setMovimientoModal] = useState({ isOpen: false, tipo: 'entrada', producto: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, producto: null });
  const [formLoading, setFormLoading] = useState(false);

  // Permisos
  const canCreate = hasPermission('inventario', 'crear');
  const canEdit = hasPermission('inventario', 'editar');
  const canDelete = hasPermission('inventario', 'eliminar');
  const canExport = hasPermission('inventario', 'exportar');
  const canImport = hasPermission('inventario', 'importar');

  // ──────────────────────────────────────────────────────────────────────────
  // APLICAR FILTRO DE URL
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(function() {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'alertas') {
      setFilters({ estado: 'bajo_stock' });
      applyFilters({ estado: 'bajo_stock' });
    } else if (filterParam === 'agotados') {
      setFilters({ estado: 'agotado' });
      applyFilters({ estado: 'agotado' });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // NOTIFICAR ALERTAS AL CARGAR
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(function() {
    if (kpis && (kpis.bajoStock + kpis.agotados) > 0 && !loading) {
      stockAlert(kpis.bajoStock + kpis.agotados);
    }
  }, [kpis?.bajoStock, kpis?.agotados]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  const handleSearch = function(value) {
    setSearchTerm(value);
    search(value);
  };

  const handleFilterChange = function(key, value) {
    var newFilters = Object.assign({}, filters);
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleClearFilters = function() {
    setFilters({});
    setSearchTerm('');
    applyFilters({});
    search('');
  };

  const handleCreate = function() {
    setFormModal({ isOpen: true, producto: null });
  };

  const handleEdit = function(producto) {
    setFormModal({ isOpen: true, producto: producto });
  };

  const handleView = function(producto) {
    navigate('/inventario/productos/' + producto.id);
  };

  const handleDelete = function(producto) {
    setDeleteModal({ isOpen: true, producto: producto });
  };

  const handleEntrada = function(producto) {
    setMovimientoModal({ isOpen: true, tipo: 'entrada', producto: producto });
  };

  const handleSalida = function(producto) {
    setMovimientoModal({ isOpen: true, tipo: 'salida', producto: producto });
  };

  const handleFormSubmit = async function(data) {
    setFormLoading(true);
    try {
      if (formModal.producto) {
        await updateProducto(formModal.producto.id, data);
        saved('Producto');
      } else {
        await createProducto(data);
        saved('Producto');
      }
      setFormModal({ isOpen: false, producto: null });
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleMovimientoSubmit = async function(data) {
    setFormLoading(true);
    try {
      await registrarMovimiento(movimientoModal.producto.id, {
        tipo: movimientoModal.tipo,
        cantidad: data.cantidad,
        motivo: data.motivo,
        documento_referencia: data.documento_referencia,
        observaciones: data.observaciones,
      });
      success('Movimiento de ' + movimientoModal.tipo + ' registrado correctamente');
      setMovimientoModal({ isOpen: false, tipo: 'entrada', producto: null });
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async function() {
    setFormLoading(true);
    try {
      await deleteProducto(deleteModal.producto.id);
      deleted('Producto');
      setDeleteModal({ isOpen: false, producto: null });
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // FORMATTERS
  // ──────────────────────────────────────────────────────────────────────────
  
  const formatCurrency = function(value) {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // KPIs LOCALES (fallback si API no provee)
  // ──────────────────────────────────────────────────────────────────────────
  
  const displayKpis = kpis || {
    total: productos.length,
    disponibles: productos.filter(function(p) { return p.estado === 'disponible'; }).length,
    bajoStock: productos.filter(function(p) { return p.estado === 'bajo_stock'; }).length,
    agotados: productos.filter(function(p) { return p.estado === 'agotado'; }).length,
    valorTotal: productos.reduce(function(sum, p) { 
      return sum + ((p.stock_actual || 0) * (p.costo_unitario || 0)); 
    }, 0),
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader notificationCount={displayKpis.bajoStock + displayKpis.agotados} />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PAGE HEADER */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Inventario</h1>
            <p className="text-slate-500 mt-1">
              Gestiona el inventario de productos
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
            
            <ProtectedAction module="inventario" action="exportar">
              <Button variant="outline" icon={Download} size="md">
                Exportar
              </Button>
            </ProtectedAction>
            
            <ProtectedAction module="inventario" action="importar">
              <Button variant="outline" icon={Upload} size="md">
                Importar
              </Button>
            </ProtectedAction>
            
            <ProtectedAction module="inventario" action="crear">
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Nuevo Producto
              </Button>
            </ProtectedAction>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* KPIs */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Productos"
            value={displayKpis.total}
            icon={Package}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Disponibles"
            value={displayKpis.disponibles}
            change={displayKpis.total > 0 ? Math.round((displayKpis.disponibles / displayKpis.total) * 100) + '% del total' : '0%'}
            positive={true}
            icon={Warehouse}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Stock Bajo / Agotado"
            value={displayKpis.bajoStock + displayKpis.agotados}
            change={displayKpis.agotados > 0 ? displayKpis.agotados + ' agotados' : 'Sin agotados'}
            positive={displayKpis.agotados === 0}
            icon={AlertTriangle}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            onClick={function() { handleFilterChange('estado', 'bajo_stock'); }}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
          <KpiCard
            title="Valor Total"
            value={formatCurrency(displayKpis.valorTotal)}
            icon={Package}
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
                placeholder="Buscar por nombre, SKU o cliente..."
                value={searchTerm}
                onChange={handleSearch}
                onClear={function() { handleSearch(''); }}
              />
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

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterDropdown
                  label="Categoría"
                  options={FILTER_OPTIONS.categoria}
                  value={filters.categoria}
                  onChange={function(v) { handleFilterChange('categoria', v); }}
                  placeholder="Todas las categorías"
                />
                <FilterDropdown
                  label="Bodega"
                  options={FILTER_OPTIONS.bodega}
                  value={filters.bodega}
                  onChange={function(v) { handleFilterChange('bodega', v); }}
                  placeholder="Todas las bodegas"
                />
                <FilterDropdown
                  label="Estado"
                  options={FILTER_OPTIONS.estado}
                  value={filters.estado}
                  onChange={function(v) { handleFilterChange('estado', v); }}
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

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* RESULTS COUNT */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="mb-4">
          <p className="text-sm text-slate-500">
            {pagination?.total || productos.length} producto{(pagination?.total || productos.length) !== 1 ? 's' : ''} encontrado{(pagination?.total || productos.length) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TABLE */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-4">
              {[0, 1, 2, 3, 4].map(function(i) {
                return (
                  <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  </div>
                );
              })}
            </div>
          ) : productos.length === 0 ? (
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
              {!searchTerm && Object.keys(filters).length === 0 && canCreate && (
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
                  {productos.map(function(producto) {
                    var bodegaLabel = FILTER_OPTIONS.bodega.find(function(b) { 
                      return b.value === producto.bodega; 
                    });
                    
                    return (
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
                                onClick={function() { handleView(producto); }}
                              >
                                {producto.nombre}
                              </p>
                              <p className="text-xs text-slate-500">{producto.codigo || producto.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {producto.cliente_nombre || producto.clienteNombre || '-'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <p className="text-slate-800">{producto.ubicacion || '-'}</p>
                            <p className="text-xs text-slate-500">
                              {bodegaLabel ? bodegaLabel.label : producto.bodega}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <StockIndicator 
                            actual={producto.stock_actual || producto.stockActual || 0} 
                            minimo={producto.stock_minimo || producto.stockMinimo || 0} 
                          />
                        </td>
                        <td className="py-4 px-4 text-center">
                          <StatusChip status={producto.estado} />
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-800 text-right font-medium">
                          {formatCurrency((producto.stock_actual || 0) * (producto.costo_unitario || 0))}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <RowActions
                            producto={producto}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onEntrada={handleEntrada}
                            onSalida={handleSalida}
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
          )}

          {!loading && pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={goToPage}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      
      <ProductoForm
        isOpen={formModal.isOpen}
        onClose={function() { setFormModal({ isOpen: false, producto: null }); }}
        onSubmit={handleFormSubmit}
        producto={formModal.producto}
        loading={formLoading}
      />

      <MovimientoForm
        isOpen={movimientoModal.isOpen}
        onClose={function() { setMovimientoModal({ isOpen: false, tipo: 'entrada', producto: null }); }}
        onSubmit={handleMovimientoSubmit}
        tipo={movimientoModal.tipo}
        producto={movimientoModal.producto}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={function() { setDeleteModal({ isOpen: false, producto: null }); }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Producto"
        message={'¿Estás seguro de eliminar "' + (deleteModal.producto ? deleteModal.producto.nombre : '') + '"? Esta acción no se puede deshacer.'}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default InventarioList;