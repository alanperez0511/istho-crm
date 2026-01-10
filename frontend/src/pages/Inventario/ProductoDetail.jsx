/**
 * ============================================================================
 * ISTHO CRM - ProductoDetail (Versión Corregida v2.3.0)
 * ============================================================================
 * Vista de detalle del producto conectada al backend real.
 * 
 * CORRECCIONES v2.3.0:
 * - Transformación de estadísticas para BarChart
 * - Todos los hooks ANTES de returns condicionales
 * - Template literals corregidos
 * - snake_case para campos del backend
 * 
 * @author Coordinación TI ISTHO
 * @version 2.3.0
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

// Hooks
import useInventario from '../../hooks/useInventario';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

// Mapeo de nombres de meses inglés → español
const MESES_ES = {
  'January': 'Enero',
  'February': 'Febrero', 
  'March': 'Marzo',
  'April': 'Abril',
  'May': 'Mayo',
  'June': 'Junio',
  'July': 'Julio',
  'August': 'Agosto',
  'September': 'Septiembre',
  'October': 'Octubre',
  'November': 'Noviembre',
  'December': 'Diciembre',
};

// ════════════════════════════════════════════════════════════════════════════
// HELPER DE PERMISOS
// ════════════════════════════════════════════════════════════════════════════

const checkPermission = (userRole, action) => {
  const permissions = {
    admin: ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'importar'],
    supervisor: ['ver', 'crear', 'editar', 'exportar'],
    operador: ['ver', 'crear', 'editar'],
    cliente: ['ver'],
  };
  return permissions[userRole]?.includes(action) || false;
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Gauge de stock visual
 */
const StockGauge = ({ actual, minimo, maximo }) => {
  const porcentaje = maximo > 0 ? (actual / maximo) * 100 : 0;
  const minimoPos = maximo > 0 ? (minimo / maximo) * 100 : 0;
  
  let statusColor = 'bg-emerald-500';
  let statusText = 'Óptimo';
  
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
          style={{ width: `${minimoPos}%` }}
        />
        
        <div 
          className={`absolute top-0 bottom-0 left-0 transition-all duration-500 rounded-full ${statusColor}`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
        
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
          style={{ left: `${minimoPos}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${statusColor}`} />
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
const MovimientoItem = ({ movimiento }) => {
  const isEntrada = movimiento.tipo === 'entrada';
  const isAjuste = movimiento.tipo === 'ajuste';
  
  let iconConfig = {
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

  const Icon = iconConfig.icon;
  
  // Usar snake_case para campos del backend
  const cantidad = movimiento.cantidad || 0;
  const stockResultante = movimiento.stock_resultante || movimiento.stockResultante || 0;
  const documentoRef = movimiento.documento_referencia || movimiento.documento || 'N/A';
  const usuarioNombre = movimiento.usuario_nombre || movimiento.responsable || 'Sistema';
  const fecha = movimiento.fecha || movimiento.created_at;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconConfig.bg}`}>
        <Icon className={`w-5 h-5 ${iconConfig.color}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isEntrada ? 'text-emerald-600' : isAjuste ? 'text-amber-600' : 'text-red-600'}`}>
                {cantidad > 0 ? '+' : ''}{cantidad.toLocaleString()}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {iconConfig.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">{movimiento.motivo || movimiento.descripcion || '-'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">
              Stock: {stockResultante.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fecha ? new Date(fecha).toLocaleString('es-CO') : '-'}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {documentoRef}
          </span>
          <span>{usuarioNombre}</span>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const ProductoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: notifyError, saved, deleted } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // HOOK DE INVENTARIO
  // ──────────────────────────────────────────────────────────────────────────
  const {
    currentProducto,
    loadingDetail,
    errorDetail,
    movimientos,
    loadingMovimientos,
    estadisticas,
    loadingEstadisticas,
    fetchById,
    fetchMovimientos,
    fetchEstadisticas,
    updateProducto,
    deleteProducto,
    registrarMovimiento,
  } = useInventario({ autoFetch: false });

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES (TODOS los hooks ANTES de cualquier return)
  // ──────────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('info');
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [movimientoModal, setMovimientoModal] = useState({ isOpen: false, tipo: 'entrada' });
  const [formLoading, setFormLoading] = useState(false);

  // Permisos
  const canEdit = checkPermission(user?.rol, 'editar');
  const canDelete = checkPermission(user?.rol, 'eliminar');

  // ──────────────────────────────────────────────────────────────────────────
  // VARIABLES DERIVADAS
  // ──────────────────────────────────────────────────────────────────────────
  const producto = currentProducto || {};
  
  const stockActual = producto.stock_actual || producto.cantidad || 0;
  const stockMinimo = producto.stock_minimo || 0;
  const stockMaximo = producto.stock_maximo || stockMinimo * 20 || 1000;
  const costoUnitario = producto.costo_unitario || 0;
  const precioVenta = producto.precio_venta || 0;
  const clienteNombre = producto.cliente_nombre || producto.cliente?.razon_social || '-';
  const bodegaNombre = producto.bodega_nombre || producto.zona || producto.bodega || '-';
  const unidadMedida = producto.unidad_medida || 'UND';
  const fechaVencimiento = producto.fecha_vencimiento || null;

  // ──────────────────────────────────────────────────────────────────────────
  // MEMOS (SIEMPRE se ejecutan)
  // ──────────────────────────────────────────────────────────────────────────
  
  // KPIs calculados desde movimientos
  const kpis = useMemo(() => {
    const entradas = (movimientos || []).filter(m => m.tipo === 'entrada');
    const salidas = (movimientos || []).filter(m => m.tipo === 'salida');
    
    const entradasMes = entradas.reduce((sum, m) => sum + Math.abs(m.cantidad || 0), 0);
    const salidasMes = salidas.reduce((sum, m) => sum + Math.abs(m.cantidad || 0), 0);
    
    return {
      valorStock: stockActual * costoUnitario,
      entradasMes,
      salidasMes,
      rotacion: stockActual > 0 ? ((salidasMes / stockActual) * 100).toFixed(1) : '0',
    };
  }, [movimientos, stockActual, costoUnitario]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSFORMACIÓN DE DATOS PARA BARCHART
  // ═══════════════════════════════════════════════════════════════════════════
  const chartData = useMemo(() => {
    if (!estadisticas || estadisticas.length === 0) {
      return [];
    }
    
    return estadisticas.map(item => {
      // Si ya viene con label y value1/value2 (backend actualizado)
      if (item.label !== undefined && item.value1 !== undefined) {
        return {
          label: item.label,
          value1: parseFloat(item.value1) || 0,
          value2: parseFloat(item.value2) || 0,
        };
      }
      
      // Transformar formato antiguo del backend
      // Puede venir como "January" (MONTHNAME) o como número
      let mesLabel = item.periodo || '';
      
      if (item.mes) {
        // Si es nombre en inglés, traducir
        mesLabel = MESES_ES[item.mes]?.substring(0, 3) || item.mes.substring(0, 3);
      } else if (item.periodo) {
        // Extraer mes del periodo "2026-01" → "Ene"
        const mesNum = parseInt(item.periodo.split('-')[1]);
        const mesesCortos = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        mesLabel = mesesCortos[mesNum] || item.periodo;
      }
      
      return {
        label: mesLabel,
        value1: parseFloat(item.entradas) || 0,
        value2: parseFloat(item.salidas) || 0,
      };
    });
  }, [estadisticas]);

  // Tabs
  const tabs = useMemo(() => [
    { id: 'info', label: 'Información' },
    { id: 'movimientos', label: `Movimientos (${(movimientos || []).length})` },
    { id: 'estadisticas', label: 'Estadísticas' },
  ], [movimientos]);

  // ──────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      fetchById(id);
      fetchMovimientos(id);
      fetchEstadisticas(id);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  const handleEditProducto = async (data) => {
    setFormLoading(true);
    try {
      await updateProducto(id, data);
      saved('Producto');
      setEditModal(false);
      fetchById(id);
    } catch (err) {
      notifyError(err.message || 'Error al actualizar producto');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProducto = async () => {
    setFormLoading(true);
    try {
      await deleteProducto(id);
      deleted('Producto');
      navigate('/inventario');
    } catch (err) {
      notifyError(err.message || 'Error al eliminar producto');
    } finally {
      setFormLoading(false);
    }
  };

  const handleMovimientoSubmit = async (data) => {
    setFormLoading(true);
    try {
      await registrarMovimiento(id, {
        tipo: movimientoModal.tipo,
        cantidad: data.cantidad,
        motivo: data.motivo,
        documento_referencia: data.documento_referencia || data.documento,
        observaciones: data.observaciones,
      });
      success(`Movimiento de ${movimientoModal.tipo} registrado correctamente`);
      setMovimientoModal({ isOpen: false, tipo: 'entrada' });
      fetchById(id);
      fetchMovimientos(id);
    } catch (err) {
      notifyError(err.message || 'Error al registrar movimiento');
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
    }).format(value);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDERS CONDICIONALES (DESPUÉS de todos los hooks)
  // ══════════════════════════════════════════════════════════════════════════
  
  if (loadingDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (errorDetail || !currentProducto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Producto no encontrado</h2>
            <p className="text-slate-500 mb-4">{errorDetail || 'El producto solicitado no existe'}</p>
            <Button variant="primary" onClick={() => navigate('/inventario')}>
              Volver a Inventario
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/inventario')}
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
                  <h1 className="text-2xl font-bold text-slate-800">
                    {producto.nombre || producto.producto}
                  </h1>
                  <StatusChip status={producto.estado} />
                </div>
                <p className="text-slate-500">
                  {producto.codigo || producto.sku} • {clienteNombre}
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
                  onClick={() => setMovimientoModal({ isOpen: true, tipo: 'entrada' })}
                >
                  Entrada
                </Button>
                <Button 
                  variant="outline" 
                  icon={PackageMinus}
                  onClick={() => setMovimientoModal({ isOpen: true, tipo: 'salida' })}
                  disabled={stockActual === 0}
                >
                  Salida
                </Button>
                <Button variant="outline" icon={Pencil} onClick={() => setEditModal(true)}>
                  Editar
                </Button>
              </>
            )}
            {canDelete && (
              <Button variant="danger" icon={Trash2} onClick={() => setDeleteModal(true)}>
                Eliminar
              </Button>
            )}
          </div>
        </div>

        {/* KPIs */}
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
            value={`+${kpis.entradasMes.toLocaleString()}`}
            icon={TrendingUp}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Salidas del Mes"
            value={`-${kpis.salidasMes.toLocaleString()}`}
            icon={TrendingDown}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
          <KpiCard
            title="Rotación"
            value={`${kpis.rotacion}%`}
            icon={Layers}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stock Gauge */}
          <div className="lg:col-span-1">
            <StockGauge 
              actual={stockActual}
              minimo={stockMinimo}
              maximo={stockMaximo}
            />

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

            {(producto.estado === 'agotado' || stockActual === 0) && (
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
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-4 text-sm font-medium transition-colors relative ${
                        activeTab === tab.id ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                      )}
                    </button>
                  ))}
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
                          <span className="text-slate-800 capitalize">{unidadMedida}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Vencimiento:</span>
                          <span className="text-slate-800">
                            {fechaVencimiento 
                              ? new Date(fechaVencimiento).toLocaleDateString('es-CO')
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Ubicación</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Building2 className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Cliente:</span>
                          <span className="text-slate-800">{clienteNombre}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Warehouse className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Bodega:</span>
                          <span className="text-slate-800">{bodegaNombre}</span>
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
                            {formatCurrency(costoUnitario)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <DollarSign className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Precio Venta:</span>
                          <span className="text-slate-800 font-medium">
                            {formatCurrency(precioVenta)}
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
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : (movimientos || []).length === 0 ? (
                      <div className="py-12 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No hay movimientos registrados</p>
                      </div>
                    ) : (
                      (movimientos || []).map((movimiento) => (
                        <MovimientoItem key={movimiento.id} movimiento={movimiento} />
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Estadísticas */}
                {activeTab === 'estadisticas' && (
                  <div>
                    {loadingEstadisticas ? (
                      <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                    ) : chartData.length > 0 ? (
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
                        <p className="text-xs text-slate-400 mt-2">
                          Los movimientos deben estar en el rango de los últimos 6 meses
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      <ProductoForm
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        onSubmit={handleEditProducto}
        producto={producto}
        loading={formLoading}
      />

      <MovimientoForm
        isOpen={movimientoModal.isOpen}
        onClose={() => setMovimientoModal({ isOpen: false, tipo: 'entrada' })}
        onSubmit={handleMovimientoSubmit}
        tipo={movimientoModal.tipo}
        producto={producto}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDeleteProducto}
        title="Eliminar Producto"
        message={`¿Estás seguro de eliminar "${producto.nombre || producto.producto}"? Se perderá todo el historial de movimientos.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default ProductoDetail;