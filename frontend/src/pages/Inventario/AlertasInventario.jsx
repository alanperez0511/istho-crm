/**
 * ISTHO CRM - AlertasInventario Page
 * Gestión de alertas de inventario (bajo stock, agotados, vencimientos)
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  PackagePlus,
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, StatusChip, FilterDropdown, KpiCard } from '../../components/common';

// Local Components
import MovimientoForm from './components/MovimientoForm';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_ALERTAS = [
  { id: 1, tipo: 'agotado', productoId: 'PRD-007', codigo: 'SKU-CEM-001', nombre: 'Cemento Gris x50kg', cliente: 'Eternit Colombia', stockActual: 0, stockMinimo: 200, bodega: 'Área 04 - Construcción', ubicacion: 'B-02-01', fechaAlerta: '2026-01-05', prioridad: 'alta', estado: 'pendiente' },
  { id: 2, tipo: 'bajo_stock', productoId: 'PRD-003', codigo: 'SKU-TEJ-001', nombre: 'Tejas Onduladas', cliente: 'Eternit Colombia', stockActual: 450, stockMinimo: 500, bodega: 'Área 04 - Construcción', ubicacion: 'B-01-05', fechaAlerta: '2026-01-06', prioridad: 'alta', estado: 'pendiente' },
  { id: 3, tipo: 'bajo_stock', productoId: 'PRD-009', codigo: 'SKU-DES-001', nombre: 'Desinfectante 5L', cliente: 'Klar Colombia', stockActual: 150, stockMinimo: 200, bodega: 'Área 03 - Químicos', ubicacion: 'D-01-03', fechaAlerta: '2026-01-06', prioridad: 'media', estado: 'pendiente' },
  { id: 4, tipo: 'vencimiento', productoId: 'PRD-011', codigo: 'SKU-YGT-002', nombre: 'Yogurt Natural x6', cliente: 'Lácteos Betania', stockActual: 320, stockMinimo: 100, bodega: 'Área 01 - Refrigerados', ubicacion: 'A-02-04', fechaVencimiento: '2026-01-20', fechaAlerta: '2026-01-08', prioridad: 'alta', estado: 'pendiente' },
  { id: 5, tipo: 'bajo_stock', productoId: 'PRD-012', codigo: 'SKU-ENV-002', nombre: 'Envases Vidrio 750ml', cliente: 'Prodenvases', stockActual: 800, stockMinimo: 1000, bodega: 'Área 02 - Secos', ubicacion: 'C-02-01', fechaAlerta: '2026-01-07', prioridad: 'baja', estado: 'atendida' },
  { id: 6, tipo: 'vencimiento', productoId: 'PRD-013', codigo: 'SKU-QSO-002', nombre: 'Queso Campesino x1kg', cliente: 'Lácteos Betania', stockActual: 180, stockMinimo: 50, bodega: 'Área 01 - Refrigerados', ubicacion: 'A-03-01', fechaVencimiento: '2026-02-05', fechaAlerta: '2026-01-08', prioridad: 'media', estado: 'pendiente' },
];

// Opciones de filtros
const FILTER_OPTIONS = {
  tipo: [
    { value: 'agotado', label: 'Agotado' },
    { value: 'bajo_stock', label: 'Stock Bajo' },
    { value: 'vencimiento', label: 'Próximo a Vencer' },
  ],
  prioridad: [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' },
  ],
  estado: [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'atendida', label: 'Atendida' },
  ],
};

// ============================================
// ALERTA CARD COMPONENT
// ============================================
const AlertaCard = ({ alerta, onAction, onAtender, onDescartar }) => {
  const navigate = useNavigate();
  
  const tipoConfig = {
    agotado: {
      icon: XCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      label: 'Producto Agotado',
      labelBg: 'bg-red-100 text-red-700',
    },
    bajo_stock: {
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      label: 'Stock Bajo',
      labelBg: 'bg-amber-100 text-amber-700',
    },
    vencimiento: {
      icon: Clock,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      label: 'Próximo a Vencer',
      labelBg: 'bg-orange-100 text-orange-700',
    },
  };

  const prioridadConfig = {
    alta: { color: 'text-red-600', bg: 'bg-red-100' },
    media: { color: 'text-amber-600', bg: 'bg-amber-100' },
    baja: { color: 'text-slate-600', bg: 'bg-slate-100' },
  };

  const config = tipoConfig[alerta.tipo];
  const prioridad = prioridadConfig[alerta.prioridad];
  const Icon = config.icon;
  const isAtendida = alerta.estado === 'atendida';

  return (
    <div className={`
      rounded-2xl border p-5 transition-all duration-200
      ${isAtendida ? 'bg-slate-50 border-slate-200 opacity-60' : `${config.bg} ${config.border}`}
    `}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 ${config.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.labelBg}`}>
                  {config.label}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prioridad.bg} ${prioridad.color}`}>
                  {alerta.prioridad.toUpperCase()}
                </span>
                {isAtendida && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    ✓ Atendida
                  </span>
                )}
              </div>
              <h3 
                className="font-semibold text-slate-800 hover:text-orange-600 cursor-pointer"
                onClick={() => navigate(`/inventario/productos/${alerta.productoId}`)}
              >
                {alerta.nombre}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">{alerta.codigo} • {alerta.cliente}</p>
            </div>
          </div>

          {/* Details */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Stock Actual</p>
              <p className={`font-semibold ${alerta.stockActual === 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {alerta.stockActual.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Stock Mínimo</p>
              <p className="font-semibold text-slate-800">{alerta.stockMinimo.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Ubicación</p>
              <p className="font-medium text-slate-600">{alerta.ubicacion}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">
                {alerta.tipo === 'vencimiento' ? 'Vence' : 'Fecha Alerta'}
              </p>
              <p className="font-medium text-slate-600">
                {alerta.tipo === 'vencimiento' ? alerta.fechaVencimiento : alerta.fechaAlerta}
              </p>
            </div>
          </div>

          {/* Actions */}
          {!isAtendida && (
            <div className="mt-4 flex items-center gap-2">
              {(alerta.tipo === 'agotado' || alerta.tipo === 'bajo_stock') && (
                <Button 
                  variant="success" 
                  size="sm" 
                  icon={PackagePlus}
                  onClick={() => onAction(alerta)}
                >
                  Registrar Entrada
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                icon={CheckCircle}
                onClick={() => onAtender(alerta)}
              >
                Marcar Atendida
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDescartar(alerta)}
              >
                Descartar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const AlertasInventario = () => {
  const navigate = useNavigate();

  // Estados
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Modal
  const [movimientoModal, setMovimientoModal] = useState({ isOpen: false, producto: null });
  const [formLoading, setFormLoading] = useState(false);

  // Cargar datos
  useEffect(() => {
    const fetchAlertas = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setAlertas(MOCK_ALERTAS);
      setLoading(false);
    };
    fetchAlertas();
  }, []);

  // Filtrar alertas
  const filteredAlertas = useMemo(() => {
    return alertas.filter((alerta) => {
      if (filters.tipo && alerta.tipo !== filters.tipo) return false;
      if (filters.prioridad && alerta.prioridad !== filters.prioridad) return false;
      if (filters.estado && alerta.estado !== filters.estado) return false;
      return true;
    });
  }, [alertas, filters]);

  // KPIs calculados
  const kpis = useMemo(() => {
    const pendientes = alertas.filter(a => a.estado === 'pendiente').length;
    const agotados = alertas.filter(a => a.tipo === 'agotado' && a.estado === 'pendiente').length;
    const bajoStock = alertas.filter(a => a.tipo === 'bajo_stock' && a.estado === 'pendiente').length;
    const porVencer = alertas.filter(a => a.tipo === 'vencimiento' && a.estado === 'pendiente').length;
    
    return { pendientes, agotados, bajoStock, porVencer };
  }, [alertas]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleAction = (alerta) => {
    // Abrir modal de entrada con el producto
    setMovimientoModal({ 
      isOpen: true, 
      producto: {
        id: alerta.productoId,
        nombre: alerta.nombre,
        stockActual: alerta.stockActual,
        unidadMedida: 'unidad',
      }
    });
  };

  const handleAtender = async (alerta) => {
    setAlertas((prev) =>
      prev.map((a) => (a.id === alerta.id ? { ...a, estado: 'atendida' } : a))
    );
  };

  const handleDescartar = async (alerta) => {
    setAlertas((prev) => prev.filter((a) => a.id !== alerta.id));
  };

  const handleMovimientoSubmit = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    
    // Marcar la alerta como atendida
    const alertaRelacionada = alertas.find(a => a.productoId === movimientoModal.producto.id);
    if (alertaRelacionada) {
      setAlertas((prev) =>
        prev.map((a) => (a.id === alertaRelacionada.id ? { ...a, estado: 'atendida' } : a))
      );
    }

    setFormLoading(false);
    setMovimientoModal({ isOpen: false, producto: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader notificationCount={kpis.pendientes} />

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
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Alertas de Inventario</h1>
              <p className="text-slate-500 mt-1">
                Gestiona las alertas de stock bajo, agotados y vencimientos
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Alertas Pendientes"
            value={kpis.pendientes}
            icon={Bell}
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
          />
          <KpiCard
            title="Productos Agotados"
            value={kpis.agotados}
            icon={XCircle}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
          <KpiCard
            title="Stock Bajo"
            value={kpis.bajoStock}
            icon={AlertTriangle}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <KpiCard
            title="Por Vencer"
            value={kpis.porVencer}
            icon={Clock}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {filteredAlertas.length} alerta{filteredAlertas.length !== 1 && 's'} encontrada{filteredAlertas.length !== 1 && 's'}
            </p>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              icon={Filter}
              size="sm"
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
                  label="Tipo"
                  options={FILTER_OPTIONS.tipo}
                  value={filters.tipo}
                  onChange={(v) => handleFilterChange('tipo', v)}
                  placeholder="Todos los tipos"
                />
                <FilterDropdown
                  label="Prioridad"
                  options={FILTER_OPTIONS.prioridad}
                  value={filters.prioridad}
                  onChange={(v) => handleFilterChange('prioridad', v)}
                  placeholder="Todas las prioridades"
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

        {/* Alertas List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAlertas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">
              ¡Todo en orden!
            </h3>
            <p className="text-slate-500">
              {Object.keys(filters).length > 0
                ? 'No hay alertas que coincidan con los filtros'
                : 'No hay alertas pendientes en este momento'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlertas.map((alerta) => (
              <AlertaCard
                key={alerta.id}
                alerta={alerta}
                onAction={handleAction}
                onAtender={handleAtender}
                onDescartar={handleDescartar}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <MovimientoForm
        isOpen={movimientoModal.isOpen}
        onClose={() => setMovimientoModal({ isOpen: false, producto: null })}
        onSubmit={handleMovimientoSubmit}
        tipo="entrada"
        producto={movimientoModal.producto}
        loading={formLoading}
      />
    </div>
  );
};

export default AlertasInventario;