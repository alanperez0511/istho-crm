/**
 * ISTHO CRM - ProductoDetail Page
 * Vista de detalle completa del producto
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
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

// ============================================
// DATOS MOCK
// ============================================
const MOCK_PRODUCTO = {
  id: 'PRD-001',
  codigo: 'SKU-LCH-001',
  nombre: 'Leche UHT x24',
  descripcion: 'Caja de 24 unidades de leche UHT entera, larga vida. Presentación tetrapack 1 litro.',
  categoria: 'lacteos',
  clientePropietario: 'CLI-001',
  clienteNombre: 'Lácteos Betania S.A.S',
  bodega: 'BOD-01',
  bodegaNombre: 'Área 01 - Refrigerados',
  ubicacion: 'A-01-03',
  lote: 'LOT-2026-001',
  fechaVencimiento: '2026-06-15',
  stockActual: 12500,
  stockMinimo: 1000,
  stockMaximo: 20000,
  unidadMedida: 'caja',
  costoUnitario: 48000,
  precioVenta: 58000,
  estado: 'disponible',
  fechaCreacion: '2024-03-15',
  ultimoMovimiento: '2026-01-08',
};

const MOCK_MOVIMIENTOS = [
  { id: 1, tipo: 'salida', cantidad: 450, motivo: 'Despacho a cliente', documento: 'DSP-001', fecha: '2026-01-08 14:30', responsable: 'María López', stockResultante: 12500 },
  { id: 2, tipo: 'entrada', cantidad: 2000, motivo: 'Recepción de proveedor', documento: 'OC-2026-045', fecha: '2026-01-07 09:15', responsable: 'Carlos Martínez', stockResultante: 12950 },
  { id: 3, tipo: 'salida', cantidad: 320, motivo: 'Despacho a cliente', documento: 'DSP-002', fecha: '2026-01-06 16:00', responsable: 'María López', stockResultante: 10950 },
  { id: 4, tipo: 'salida', cantidad: 180, motivo: 'Despacho a cliente', documento: 'DSP-003', fecha: '2026-01-05 11:20', responsable: 'Juan Pérez', stockResultante: 11270 },
  { id: 5, tipo: 'entrada', cantidad: 1500, motivo: 'Recepción de proveedor', documento: 'OC-2026-042', fecha: '2026-01-04 08:00', responsable: 'Carlos Martínez', stockResultante: 11450 },
  { id: 6, tipo: 'salida', cantidad: 550, motivo: 'Despacho a cliente', documento: 'DSP-004', fecha: '2026-01-03 15:45', responsable: 'María López', stockResultante: 9950 },
  { id: 7, tipo: 'ajuste', cantidad: -25, motivo: 'Ajuste por merma', documento: 'AJ-001', fecha: '2026-01-02 10:00', responsable: 'Supervisor', stockResultante: 10500 },
  { id: 8, tipo: 'entrada', cantidad: 3000, motivo: 'Recepción de proveedor', documento: 'OC-2026-038', fecha: '2026-01-01 09:30', responsable: 'Carlos Martínez', stockResultante: 10525 },
];

const MOCK_ESTADISTICAS = [
  { label: 'Ago', value1: 4500, value2: 3200 },
  { label: 'Sep', value1: 5200, value2: 4800 },
  { label: 'Oct', value1: 4800, value2: 4200 },
  { label: 'Nov', value1: 6100, value2: 5500 },
  { label: 'Dic', value1: 7200, value2: 6800 },
  { label: 'Ene', value1: 3500, value2: 1500 },
];

// ============================================
// STOCK GAUGE COMPONENT
// ============================================
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
        {/* Zona de stock mínimo */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-red-100 opacity-50"
          style={{ width: `${minimoPos}%` }}
        />
        
        {/* Barra de stock actual */}
        <div 
          className={`absolute top-0 bottom-0 left-0 ${statusColor} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
        
        {/* Indicador de mínimo */}
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

// ============================================
// MOVIMIENTO ITEM COMPONENT
// ============================================
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

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className={`w-10 h-10 ${iconConfig.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconConfig.color}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isEntrada ? 'text-emerald-600' : isAjuste ? 'text-amber-600' : 'text-red-600'}`}>
                {isEntrada ? '+' : ''}{movimiento.cantidad.toLocaleString()}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {iconConfig.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">{movimiento.motivo}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">
              Stock: {movimiento.stockResultante.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {movimiento.fecha}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {movimiento.documento}
          </span>
          <span>{movimiento.responsable}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ProductoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados
  const [producto, setProducto] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Modals
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [movimientoModal, setMovimientoModal] = useState({ isOpen: false, tipo: 'entrada' });
  const [formLoading, setFormLoading] = useState(false);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setProducto(MOCK_PRODUCTO);
      setMovimientos(MOCK_MOVIMIENTOS);
      setEstadisticas(MOCK_ESTADISTICAS);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Handlers
  const handleEditProducto = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setProducto((prev) => ({ ...prev, ...data }));
    setFormLoading(false);
    setEditModal(false);
  };

  const handleDeleteProducto = async () => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setFormLoading(false);
    setDeleteModal(false);
    navigate('/inventario');
  };

  const handleMovimientoSubmit = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    
    const isEntrada = data.tipo === 'entrada';
    const nuevoStock = isEntrada 
      ? producto.stockActual + data.cantidad 
      : producto.stockActual - data.cantidad;

    // Agregar movimiento
    const nuevoMovimiento = {
      id: Date.now(),
      tipo: data.tipo,
      cantidad: data.cantidad,
      motivo: data.motivo,
      documento: data.documento || 'N/A',
      fecha: new Date().toLocaleString('es-CO'),
      responsable: data.responsable || 'Usuario',
      stockResultante: nuevoStock,
    };

    setMovimientos((prev) => [nuevoMovimiento, ...prev]);
    
    // Actualizar producto
    let nuevoEstado = 'disponible';
    if (nuevoStock === 0) nuevoEstado = 'agotado';
    else if (nuevoStock <= producto.stockMinimo) nuevoEstado = 'bajo_stock';

    setProducto((prev) => ({
      ...prev,
      stockActual: nuevoStock,
      estado: nuevoEstado,
      ultimoMovimiento: new Date().toISOString().split('T')[0],
    }));

    setFormLoading(false);
    setMovimientoModal({ isOpen: false, tipo: 'entrada' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calcular KPIs
  const kpis = {
    valorStock: producto ? producto.stockActual * producto.costoUnitario : 0,
    entradasMes: movimientos.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.cantidad, 0),
    salidasMes: movimientos.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + m.cantidad, 0),
    rotacion: producto ? (movimientos.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + m.cantidad, 0) / producto.stockActual * 100).toFixed(1) : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información' },
    { id: 'movimientos', label: `Movimientos (${movimientos.length})` },
    { id: 'estadisticas', label: 'Estadísticas' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Back & Header */}
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
                  <h1 className="text-2xl font-bold text-slate-800">{producto.nombre}</h1>
                  <StatusChip status={producto.estado} />
                </div>
                <p className="text-slate-500">{producto.codigo} • {producto.clienteNombre}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              disabled={producto.stockActual === 0}
            >
              Salida
            </Button>
            <Button variant="outline" icon={Pencil} onClick={() => setEditModal(true)}>
              Editar
            </Button>
            <Button variant="danger" icon={Trash2} onClick={() => setDeleteModal(true)}>
              Eliminar
            </Button>
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stock Gauge */}
          <div className="lg:col-span-1">
            <StockGauge 
              actual={producto.stockActual}
              minimo={producto.stockMinimo}
              maximo={producto.stockMaximo}
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
              {/* Tabs */}
              <div className="border-b border-gray-100">
                <nav className="flex px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        py-4 px-4 text-sm font-medium transition-colors relative
                        ${activeTab === tab.id ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'}
                      `}
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
                          <span className="text-slate-800 font-mono">{producto.codigo}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Layers className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Categoría:</span>
                          <span className="text-slate-800 capitalize">{producto.categoria}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Package className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Unidad:</span>
                          <span className="text-slate-800 capitalize">{producto.unidadMedida}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Vencimiento:</span>
                          <span className="text-slate-800">{producto.fechaVencimiento || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Ubicación</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Building2 className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Cliente:</span>
                          <span className="text-slate-800">{producto.clienteNombre}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Warehouse className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Bodega:</span>
                          <span className="text-slate-800">{producto.bodegaNombre}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Ubicación:</span>
                          <span className="text-slate-800 font-mono">{producto.ubicacion}</span>
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
                          <span className="text-slate-800 font-medium">{formatCurrency(producto.costoUnitario)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <DollarSign className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-500 w-28">Precio Venta:</span>
                          <span className="text-slate-800 font-medium">{formatCurrency(producto.precioVenta)}</span>
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
                    {movimientos.length === 0 ? (
                      <div className="py-12 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No hay movimientos registrados</p>
                      </div>
                    ) : (
                      movimientos.map((movimiento) => (
                        <MovimientoItem key={movimiento.id} movimiento={movimiento} />
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Estadísticas */}
                {activeTab === 'estadisticas' && (
                  <div>
                    <BarChart
                      title="Entradas vs Salidas"
                      subtitle="Últimos 6 meses"
                      data={estadisticas}
                      legend={[
                        { label: 'Entradas', color: '#10b981' },
                        { label: 'Salidas', color: '#ef4444' },
                      ]}
                      height={300}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
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
        message={`¿Estás seguro de eliminar "${producto?.nombre}"? Se perderá todo el historial de movimientos.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default ProductoDetail;