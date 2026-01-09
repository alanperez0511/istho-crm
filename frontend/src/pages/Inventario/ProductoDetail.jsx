/**
 * ============================================================================
 * ISTHO CRM - ProductoDetail (Fase 5 - Integración Completa)
 * ============================================================================
 * Vista de detalle del producto conectada al backend real.
 * 
 * CAMBIOS vs versión anterior:
 * - Eliminados MOCK_PRODUCTO, MOCK_MOVIMIENTOS, MOCK_ESTADISTICAS
 * - Conectado con useInventario hook
 * - Movimientos reales desde API
 * - Estadísticas calculadas desde backend
 * - Control de permisos
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  MapPin,
  Building2,
  Barcode,
  Calendar,
  Pencil,
  Trash2,
  PackagePlus,
  PackageMinus,
  Layers,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Warehouse,
  FileText,
  RefreshCw,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, StatusChip, KpiCard, ConfirmDialog } from '../../components/common';

// Charts
import { BarChart } from '../../components/charts';

// Local Components
import ProductoForm from './components/ProductoForm';
import MovimientoForm from './components/MovimientoForm';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS INTEGRADOS
// ════════════════════════════════════════════════════════════════════════════
import useInventario from '../../hooks/useInventario';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Gauge de stock visual
 */
var StockGauge = function(props) {
  var actual = props.actual;
  var minimo = props.minimo;
  var maximo = props.maximo;
  
  var porcentaje = maximo > 0 ? (actual / maximo) * 100 : 0;
  var minimoPos = maximo > 0 ? (minimo / maximo) * 100 : 0;
  
  var statusColor = 'bg-emerald-500';
  var statusText = 'Óptimo';
  
  if (actual === 0) {
    statusColor = 'bg-red-500';
    statusText = 'Agotado';
  } else if (actual <= minimo) {
    statusColor = 'bg-amber-500';
    statusText = 'Bajo';
  } else if (actual >= maximo * 0.9) {
    statusColor = 'bg-blue-500';
    statusText = 'Máximo';
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Nivel de Stock</h3>
      
      <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div 
          className="absolute top-0 bottom-0 left-0 bg-red-100 opacity-50"
          style={{ width: minimoPos + '%' }}
        />
        
        <div 
          className={'absolute top-0 bottom-0 left-0 transition-all duration-500 rounded-full ' + statusColor}
          style={{ width: Math.min(porcentaje, 100) + '%' }}
        />
        
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
          style={{ left: minimoPos + '%' }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={'w-3 h-3 rounded-full ' + statusColor} />
          <span className="font-medium text-slate-700">{statusText}</span>
        </div>
        <span className="text-slate-500">
          {actual.toLocaleString()} / {maximo.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-800">{actual.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Stock Actual</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{minimo.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Mínimo</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{maximo.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Máximo</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Item de movimiento
 */
var MovimientoItem = function(props) {
  var movimiento = props.movimiento;
  
  var isEntrada = movimiento.tipo === 'entrada';
  var isAjuste = movimiento.tipo === 'ajuste';
  
  var iconConfig = {
    icon: PackageMinus,
    bg: 'bg-red-100',
    color: 'text-red-600',
    label: 'Salida',
  };
  
  if (isEntrada) {
    iconConfig = {
      icon: PackagePlus,
      bg: 'bg-emerald-100',
      color: 'text-emerald-600',
      label: 'Entrada',
    };
  } else if (isAjuste) {
    iconConfig = {
      icon: Layers,
      bg: 'bg-amber-100',
      color: 'text-amber-600',
      label: 'Ajuste',
    };
  }

  var Icon = iconConfig.icon;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ' + iconConfig.bg}>
        <Icon className={'w-5 h-5 ' + iconConfig.color} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={'text-sm font-semibold ' + (isEntrada ? 'text-emerald-600' : isAjuste ? 'text-amber-600' : 'text-red-600')}>
                {isEntrada ? '+' : ''}{(movimiento.cantidad || 0).toLocaleString()}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {iconConfig.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">{movimiento.motivo || movimiento.descripcion || '-'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">
              Stock: {(movimiento.stock_resultante || movimiento.stockResultante || 0).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(movimiento.fecha || movimiento.created_at).toLocaleString('es-CO')}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {movimiento.documento_referencia || movimiento.documento || 'N/A'}
          </span>
          <span>{movimiento.usuario_nombre || movimiento.responsable || 'Sistema'}</span>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
var ProductoDetail = function() {
  var params = useParams();
  var id = params.id;
  var navigate = useNavigate();
  var authHook = useAuth();
  var hasPermission = authHook.hasPermission;
  var notif = useNotification();
  var success = notif.success;
  var apiError = notif.apiError;
  var saved = notif.saved;
  var deleted = notif.deleted;

  // ──────────────────────────────────────────────────────────────────────────
  // HOOK DE INVENTARIO
  // ──────────────────────────────────────────────────────────────────────────
  var inventarioHook = useInventario({ autoFetch: false });
  
  var currentProducto = inventarioHook.currentProducto;
  var loading = inventarioHook.loading;
  var error = inventarioHook.error;
  var movimientos = inventarioHook.movimientos;
  var loadingMovimientos = inventarioHook.loadingMovimientos;
  var estadisticas = inventarioHook.estadisticas;
  var fetchById = inventarioHook.fetchById;
  var fetchMovimientos = inventarioHook.fetchMovimientos;
  var fetchEstadisticas = inventarioHook.fetchEstadisticas;
  var updateProducto = inventarioHook.updateProducto;
  var deleteProducto = inventarioHook.deleteProducto;
  var registrarMovimiento = inventarioHook.registrarMovimiento;

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES
  // ──────────────────────────────────────────────────────────────────────────
  var _a = useState('info'), activeTab = _a[0], setActiveTab = _a[1];

  // Modals
  var _b = useState(false), editModal = _b[0], setEditModal = _b[1];
  var _c = useState(false), deleteModal = _c[0], setDeleteModal = _c[1];
  var _d = useState({ isOpen: false, tipo: 'entrada' }), movimientoModal = _d[0], setMovimientoModal = _d[1];
  var _e = useState(false), formLoading = _e[0], setFormLoading = _e[1];

  // Permisos
  var canEdit = hasPermission('inventario', 'editar');
  var canDelete = hasPermission('inventario', 'eliminar');

  // ──────────────────────────────────────────────────────────────────────────
  // CARGAR DATOS
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(function() {
    if (id) {
      fetchById(id);
      fetchMovimientos(id);
      fetchEstadisticas(id);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  var handleEditProducto = async function(data) {
    setFormLoading(true);
    try {
      await updateProducto(id, data);
      saved('Producto');
      setEditModal(false);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  var handleDeleteProducto = async function() {
    setFormLoading(true);
    try {
      await deleteProducto(id);
      deleted('Producto');
      navigate('/inventario');
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  var handleMovimientoSubmit = async function(data) {
    setFormLoading(true);
    try {
      await registrarMovimiento(id, {
        tipo: movimientoModal.tipo,
        cantidad: data.cantidad,
        motivo: data.motivo,
        documento_referencia: data.documento,
        observaciones: data.observaciones,
      });
      success('Movimiento de ' + movimientoModal.tipo + ' registrado correctamente');
      setMovimientoModal({ isOpen: false, tipo: 'entrada' });
      // Refrescar datos
      fetchById(id);
      fetchMovimientos(id);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // FORMATTERS
  // ──────────────────────────────────────────────────────────────────────────
  
  var formatCurrency = function(value) {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(function(i) {
                return <div key={i} className="h-32 bg-gray-200 rounded-2xl" />;
              })}
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ERROR STATE
  // ──────────────────────────────────────────────────────────────────────────
  
  if (error || !currentProducto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Producto no encontrado</h2>
            <p className="text-slate-500 mb-4">{error || 'El producto solicitado no existe'}</p>
            <Button variant="primary" onClick={function() { navigate('/inventario'); }}>
              Volver a Inventario
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VARIABLES CALCULADAS
  // ──────────────────────────────────────────────────────────────────────────
  
  var producto = currentProducto;
  
  // KPIs calculados desde movimientos
  var kpis = useMemo(function() {
    var entradas = movimientos.filter(function(m) { return m.tipo === 'entrada'; });
    var salidas = movimientos.filter(function(m) { return m.tipo === 'salida'; });
    
    var entradasMes = entradas.reduce(function(sum, m) { return sum + (m.cantidad || 0); }, 0);
    var salidasMes = salidas.reduce(function(sum, m) { return sum + Math.abs(m.cantidad || 0); }, 0);
    var stockActual = producto.stock_actual || producto.stockActual || 0;
    var costoUnitario = producto.costo_unitario || producto.costoUnitario || 0;
    
    return {
      valorStock: stockActual * costoUnitario,
      entradasMes: entradasMes,
      salidasMes: salidasMes,
      rotacion: stockActual > 0 ? ((salidasMes / stockActual) * 100).toFixed(1) : '0',
    };
  }, [movimientos, producto]);

  // Datos para gráfico (usar estadísticas de API o calcular)
  var chartData = estadisticas || [];

  var tabs = [
    { id: 'info', label: 'Información' },
    { id: 'movimientos', label: 'Movimientos (' + movimientos.length + ')' },
    { id: 'estadisticas', label: 'Estadísticas' },
  ];

  var stockActual = producto.stock_actual || producto.stockActual || 0;
  var stockMinimo = producto.stock_minimo || producto.stockMinimo || 0;
  var stockMaximo = producto.stock_maximo || producto.stockMaximo || stockMinimo * 20;

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={function() { navigate('/inventario'); }}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-slate-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-800">{producto.nombre}</h1>
                  <StatusChip status={producto.estado} />
                </div>
                <p className="text-slate-500">
                  {producto.codigo || producto.sku} • {producto.cliente_nombre || producto.clienteNombre}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button 
                  variant="success" 
                  icon={PackagePlus}
                  onClick={function() { setMovimientoModal({ isOpen: true, tipo: 'entrada' }); }}
                >
                  Entrada
                </Button>
                <Button 
                  variant="outline" 
                  icon={PackageMinus}
                  onClick={function() { setMovimientoModal({ isOpen: true, tipo: 'salida' }); }}
                  disabled={stockActual === 0}
                >
                  Salida
                </Button>
                <Button variant="outline" icon={Pencil} onClick={function() { setEditModal(true); }}>
                  Editar
                </Button>
              </>
            )}
            {canDelete && (
              <Button variant="danger" icon={Trash2} onClick={function() { setDeleteModal(true); }}>
                Eliminar
              </Button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* KPIs */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Valor en Stock"
            value={formatCurrency(kpis.valorStock)}
            icon={DollarSign}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Entradas del Mes"
            value={'+' + kpis.entradasMes.toLocaleString()}
            icon={TrendingUp}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Salidas del Mes"
            value={'-' + kpis.salidasMes.toLocaleString()}
            icon={TrendingDown}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
          <KpiCard
            title="Rotación"
            value={kpis.rotacion + '%'}
            icon={Layers}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MAIN CONTENT */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stock Gauge */}
          <div className="lg:col-span-1">
            <StockGauge 
              actual={stockActual}
              minimo={stockMinimo}
              maximo={stockMaximo}
            />

            {/* Alerta si stock bajo */}
            {producto.estado === 'bajo_stock' && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Stock Bajo</p>
                    <p className="text-sm text-amber-600 mt-1">
                      El stock actual está por debajo del mínimo requerido.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {producto.estado === 'agotado' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Producto Agotado</p>
                    <p className="text-sm text-red-600 mt-1">
                      No hay unidades disponibles en inventario.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100">
                <nav className="flex px-6">
                  {tabs.map(function(tab) {
                    return (
                      <button
                        key={tab.id}
                        onClick={function() { setActiveTab(tab.id); }}
                        className={
                          'py-4 px-4 text-sm font-medium transition-colors relative ' +
                          (activeTab === tab.id ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700')
                        }
                      >
                        {tab.label}
                        {activeTab === tab.id && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {/* Tab: Información */}
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Información General</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Barcode className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Código:</span>
                          <span className="text-slate-800 font-mono">{producto.codigo || producto.sku}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Layers className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Categoría:</span>
                          <span className="text-slate-800 capitalize">{producto.categoria || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Package className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Unidad:</span>
                          <span className="text-slate-800 capitalize">{producto.unidad_medida || producto.unidadMedida || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Vencimiento:</span>
                          <span className="text-slate-800">{producto.fecha_vencimiento || producto.fechaVencimiento || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Ubicación</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Building2 className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Cliente:</span>
                          <span className="text-slate-800">{producto.cliente_nombre || producto.clienteNombre}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Warehouse className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Bodega:</span>
                          <span className="text-slate-800">{producto.bodega_nombre || producto.bodegaNombre || producto.bodega}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Ubicación:</span>
                          <span className="text-slate-800 font-mono">{producto.ubicacion || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Lote:</span>
                          <span className="text-slate-800 font-mono">{producto.lote || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Costos</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <DollarSign className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Costo Unit.:</span>
                          <span className="text-slate-800 font-medium">
                            {formatCurrency(producto.costo_unitario || producto.costoUnitario)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <DollarSign className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Precio Venta:</span>
                          <span className="text-slate-800 font-medium">
                            {formatCurrency(producto.precio_venta || producto.precioVenta)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {producto.descripcion && (
                      <div className="space-y-4 md:col-span-2">
                        <h4 className="font-semibold text-slate-800">Descripción</h4>
                        <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">
                          {producto.descripcion}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Movimientos */}
                {activeTab === 'movimientos' && (
                  <div className="space-y-0">
                    {loadingMovimientos ? (
                      <div className="space-y-3">
                        {[0, 1, 2, 3].map(function(i) {
                          return <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />;
                        })}
                      </div>
                    ) : movimientos.length === 0 ? (
                      <div className="py-12 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No hay movimientos registrados</p>
                      </div>
                    ) : (
                      movimientos.map(function(movimiento) {
                        return <MovimientoItem key={movimiento.id} movimiento={movimiento} />;
                      })
                    )}
                  </div>
                )}

                {/* Tab: Estadísticas */}
                {activeTab === 'estadisticas' && (
                  <div>
                    {chartData.length > 0 ? (
                      <BarChart
                        title="Entradas vs Salidas"
                        subtitle="Últimos 6 meses"
                        data={chartData}
                        legend={[
                          { label: 'Entradas', color: '#10b981' },
                          { label: 'Salidas', color: '#ef4444' },
                        ]}
                        height={300}
                      />
                    ) : (
                      <div className="py-12 text-center">
                        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No hay suficientes datos para mostrar estadísticas</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      
      <ProductoForm
        isOpen={editModal}
        onClose={function() { setEditModal(false); }}
        onSubmit={handleEditProducto}
        producto={producto}
        loading={formLoading}
      />

      <MovimientoForm
        isOpen={movimientoModal.isOpen}
        onClose={function() { setMovimientoModal({ isOpen: false, tipo: 'entrada' }); }}
        onSubmit={handleMovimientoSubmit}
        tipo={movimientoModal.tipo}
        producto={producto}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteModal}
        onClose={function() { setDeleteModal(false); }}
        onConfirm={handleDeleteProducto}
        title="Eliminar Producto"
        message={'¿Estás seguro de eliminar "' + producto.nombre + '"? Se perderá todo el historial de movimientos.'}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default ProductoDetail;