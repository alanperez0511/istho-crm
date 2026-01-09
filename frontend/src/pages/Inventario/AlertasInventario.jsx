/**
 * ============================================================================
 * ISTHO CRM - AlertasInventario (Fase 5 - Integración Completa)
 * ============================================================================
 * Gestión de alertas de inventario conectada al backend real.
 * 
 * CAMBIOS vs versión anterior:
 * - Eliminado MOCK_ALERTAS
 * - Conectado con useInventario hook (fetchAlertas)
 * - Acciones de atender/descartar conectadas a API
 * - Movimientos de entrada conectados a API
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
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
  RefreshCw,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, StatusChip, FilterDropdown, KpiCard } from '../../components/common';

// Local Components
import MovimientoForm from './components/MovimientoForm';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS INTEGRADOS
// ════════════════════════════════════════════════════════════════════════════
import useInventario from '../../hooks/useInventario';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// ════════════════════════════════════════════════════════════════════════════
// OPCIONES DE FILTROS
// ════════════════════════════════════════════════════════════════════════════
var FILTER_OPTIONS = {
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

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tarjeta de alerta
 */
var AlertaCard = function(props) {
  var alerta = props.alerta;
  var onAction = props.onAction;
  var onAtender = props.onAtender;
  var onDescartar = props.onDescartar;
  var canEdit = props.canEdit;
  
  var navigate = useNavigate();
  
  var tipoConfig = {
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

  var prioridadConfig = {
    alta: { color: 'text-red-600', bg: 'bg-red-100' },
    media: { color: 'text-amber-600', bg: 'bg-amber-100' },
    baja: { color: 'text-slate-600', bg: 'bg-slate-100' },
  };

  var config = tipoConfig[alerta.tipo] || tipoConfig.bajo_stock;
  var prioridad = prioridadConfig[alerta.prioridad] || prioridadConfig.media;
  var Icon = config.icon;
  var isAtendida = alerta.estado === 'atendida';

  return (
    <div className={
      'rounded-2xl border p-5 transition-all duration-200 ' +
      (isAtendida ? 'bg-slate-50 border-slate-200 opacity-60' : config.bg + ' ' + config.border)
    }>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ' + config.iconBg}>
          <Icon className={'w-6 h-6 ' + config.iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + config.labelBg}>
                  {config.label}
                </span>
                <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + prioridad.bg + ' ' + prioridad.color}>
                  {(alerta.prioridad || 'media').toUpperCase()}
                </span>
                {isAtendida && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    ✓ Atendida
                  </span>
                )}
              </div>
              <h3 
                className="font-semibold text-slate-800 hover:text-orange-600 cursor-pointer"
                onClick={function() { navigate('/inventario/productos/' + alerta.producto_id); }}
              >
                {alerta.producto_nombre || alerta.nombre}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {alerta.producto_codigo || alerta.codigo} • {alerta.cliente_nombre || alerta.cliente}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Stock Actual</p>
              <p className={'font-semibold ' + ((alerta.stock_actual || alerta.stockActual || 0) === 0 ? 'text-red-600' : 'text-slate-800')}>
                {(alerta.stock_actual || alerta.stockActual || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Stock Mínimo</p>
              <p className="font-semibold text-slate-800">{(alerta.stock_minimo || alerta.stockMinimo || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Ubicación</p>
              <p className="font-medium text-slate-600">{alerta.ubicacion || '-'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">
                {alerta.tipo === 'vencimiento' ? 'Vence' : 'Fecha Alerta'}
              </p>
              <p className="font-medium text-slate-600">
                {alerta.tipo === 'vencimiento' 
                  ? (alerta.fecha_vencimiento || alerta.fechaVencimiento)
                  : (alerta.fecha_alerta || alerta.fechaAlerta || new Date(alerta.created_at).toLocaleDateString('es-CO'))
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          {!isAtendida && canEdit && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {(alerta.tipo === 'agotado' || alerta.tipo === 'bajo_stock') && (
                <Button 
                  variant="success" 
                  size="sm" 
                  icon={PackagePlus}
                  onClick={function() { onAction(alerta); }}
                >
                  Registrar Entrada
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                icon={CheckCircle}
                onClick={function() { onAtender(alerta); }}
              >
                Marcar Atendida
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={function() { onDescartar(alerta); }}
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

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
var AlertasInventario = function() {
  var navigate = useNavigate();
  var authHook = useAuth();
  var user = authHook.user;
  var hasPermission = authHook.hasPermission;
  var notif = useNotification();
  var success = notif.success;
  var apiError = notif.apiError;

  // ──────────────────────────────────────────────────────────────────────────
  // HOOK DE INVENTARIO
  // ──────────────────────────────────────────────────────────────────────────
  var inventarioHook = useInventario({ autoFetch: false });
  
  var alertas = inventarioHook.alertas;
  var loadingAlertas = inventarioHook.loadingAlertas;
  var fetchAlertas = inventarioHook.fetchAlertas;
  var atenderAlerta = inventarioHook.atenderAlerta;
  var descartarAlerta = inventarioHook.descartarAlerta;
  var registrarMovimiento = inventarioHook.registrarMovimiento;

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES
  // ──────────────────────────────────────────────────────────────────────────
  var _a = useState({}), filters = _a[0], setFilters = _a[1];
  var _b = useState(false), showFilters = _b[0], setShowFilters = _b[1];
  var _c = useState(false), isRefreshing = _c[0], setIsRefreshing = _c[1];

  // Modal
  var _d = useState({ isOpen: false, producto: null }), movimientoModal = _d[0], setMovimientoModal = _d[1];
  var _e = useState(false), formLoading = _e[0], setFormLoading = _e[1];

  // Permisos
  var canEdit = hasPermission('inventario', 'editar');

  // ──────────────────────────────────────────────────────────────────────────
  // CARGAR DATOS
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(function() {
    var clienteFilter = user && user.rol === 'cliente' ? { cliente_id: user.cliente_id } : {};
    fetchAlertas(clienteFilter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // FILTRAR ALERTAS
  // ──────────────────────────────────────────────────────────────────────────
  var filteredAlertas = useMemo(function() {
    return alertas.filter(function(alerta) {
      if (filters.tipo && alerta.tipo !== filters.tipo) return false;
      if (filters.prioridad && alerta.prioridad !== filters.prioridad) return false;
      if (filters.estado && alerta.estado !== filters.estado) return false;
      return true;
    });
  }, [alertas, filters]);

  // ──────────────────────────────────────────────────────────────────────────
  // KPIs
  // ──────────────────────────────────────────────────────────────────────────
  var kpis = useMemo(function() {
    var pendientes = alertas.filter(function(a) { return a.estado === 'pendiente'; }).length;
    var agotados = alertas.filter(function(a) { return a.tipo === 'agotado' && a.estado === 'pendiente'; }).length;
    var bajoStock = alertas.filter(function(a) { return a.tipo === 'bajo_stock' && a.estado === 'pendiente'; }).length;
    var porVencer = alertas.filter(function(a) { return a.tipo === 'vencimiento' && a.estado === 'pendiente'; }).length;
    
    return { pendientes: pendientes, agotados: agotados, bajoStock: bajoStock, porVencer: porVencer };
  }, [alertas]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  var handleRefresh = async function() {
    setIsRefreshing(true);
    try {
      var clienteFilter = user && user.rol === 'cliente' ? { cliente_id: user.cliente_id } : {};
      await fetchAlertas(clienteFilter);
    } finally {
      setIsRefreshing(false);
    }
  };

  var handleFilterChange = function(key, value) {
    var newFilters = Object.assign({}, filters);
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
  };

  var handleClearFilters = function() {
    setFilters({});
  };

  var handleAction = function(alerta) {
    // Abrir modal de entrada con el producto
    setMovimientoModal({ 
      isOpen: true, 
      producto: {
        id: alerta.producto_id,
        nombre: alerta.producto_nombre || alerta.nombre,
        stock_actual: alerta.stock_actual || alerta.stockActual,
        unidad_medida: alerta.unidad_medida || 'unidad',
      }
    });
  };

  var handleAtender = async function(alerta) {
    try {
      if (atenderAlerta) {
        await atenderAlerta(alerta.id);
      }
      success('Alerta marcada como atendida');
      handleRefresh();
    } catch (err) {
      apiError(err);
    }
  };

  var handleDescartar = async function(alerta) {
    try {
      if (descartarAlerta) {
        await descartarAlerta(alerta.id);
      }
      success('Alerta descartada');
      handleRefresh();
    } catch (err) {
      apiError(err);
    }
  };

  var handleMovimientoSubmit = async function(data) {
    setFormLoading(true);
    try {
      await registrarMovimiento(movimientoModal.producto.id, {
        tipo: 'entrada',
        cantidad: data.cantidad,
        motivo: data.motivo || 'Reposición de stock',
        documento_referencia: data.documento,
        observaciones: data.observaciones,
      });
      
      success('Entrada registrada correctamente');
      setMovimientoModal({ isOpen: false, producto: null });
      
      // Refrescar alertas
      handleRefresh();
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
      <FloatingHeader notificationCount={kpis.pendientes} />

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
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Alertas de Inventario</h1>
              <p className="text-slate-500 mt-1">
                Gestiona las alertas de stock bajo, agotados y vencimientos
              </p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            icon={RefreshCw} 
            onClick={handleRefresh}
            loading={isRefreshing}
            title="Actualizar alertas"
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* KPIs */}
        {/* ════════════════════════════════════════════════════════════════ */}
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
            onClick={function() { handleFilterChange('tipo', 'agotado'); }}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
          <KpiCard
            title="Stock Bajo"
            value={kpis.bajoStock}
            icon={AlertTriangle}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            onClick={function() { handleFilterChange('tipo', 'bajo_stock'); }}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
          <KpiCard
            title="Por Vencer"
            value={kpis.porVencer}
            icon={Clock}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            onClick={function() { handleFilterChange('tipo', 'vencimiento'); }}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FILTERS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {filteredAlertas.length} alerta{filteredAlertas.length !== 1 ? 's' : ''} encontrada{filteredAlertas.length !== 1 ? 's' : ''}
            </p>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              icon={Filter}
              size="sm"
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
                  label="Tipo"
                  options={FILTER_OPTIONS.tipo}
                  value={filters.tipo}
                  onChange={function(v) { handleFilterChange('tipo', v); }}
                  placeholder="Todos los tipos"
                />
                <FilterDropdown
                  label="Prioridad"
                  options={FILTER_OPTIONS.prioridad}
                  value={filters.prioridad}
                  onChange={function(v) { handleFilterChange('prioridad', v); }}
                  placeholder="Todas las prioridades"
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
        {/* ALERTAS LIST */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {loadingAlertas ? (
          <div className="space-y-4">
            {[0, 1, 2].map(function(i) {
              return (
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
              );
            })}
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
            {filteredAlertas.map(function(alerta) {
              return (
                <AlertaCard
                  key={alerta.id}
                  alerta={alerta}
                  canEdit={canEdit}
                  onAction={handleAction}
                  onAtender={handleAtender}
                  onDescartar={handleDescartar}
                />
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      
      <MovimientoForm
        isOpen={movimientoModal.isOpen}
        onClose={function() { setMovimientoModal({ isOpen: false, producto: null }); }}
        onSubmit={handleMovimientoSubmit}
        tipo="entrada"
        producto={movimientoModal.producto}
        loading={formLoading}
      />
    </div>
  );
};

export default AlertasInventario;