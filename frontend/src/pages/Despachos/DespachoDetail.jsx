/**
 * ============================================================================
 * ISTHO CRM - DespachoDetail (Fase 5 - Integración Completa)
 * ============================================================================
 * Vista de detalle del despacho conectada al backend real.
 * 
 * CAMBIOS vs versión anterior:
 * - Eliminados MOCK_DESPACHO, MOCK_PRODUCTOS, MOCK_TIMELINE
 * - Conectado con useDespachos hook (fetchById, productos, timeline)
 * - Cambios de estado conectados a API
 * - Cancelación conectada a API
 * - Control de permisos
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Building2,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pencil,
  Printer,
  Navigation,
  Camera,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, StatusChip, ConfirmDialog, Modal } from '../../components/common';

// Local Components
import DespachoForm from './components/DespachoForm';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS INTEGRADOS
// ════════════════════════════════════════════════════════════════════════════
import useDespachos from '../../hooks/useDespachos';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Item del timeline
 */
var TimelineItem = function(props) {
  var item = props.item;
  var isLast = props.isLast;
  
  var iconConfig = {
    creacion: { icon: FileText, bg: 'bg-slate-100', color: 'text-slate-600' },
    asignacion: { icon: Truck, bg: 'bg-blue-100', color: 'text-blue-600' },
    preparacion: { icon: Package, bg: 'bg-amber-100', color: 'text-amber-600' },
    verificacion: { icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    salida: { icon: Navigation, bg: 'bg-violet-100', color: 'text-violet-600' },
    transito: { icon: MapPin, bg: 'bg-blue-100', color: 'text-blue-600' },
    entrega: { icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    incidente: { icon: AlertCircle, bg: 'bg-red-100', color: 'text-red-600' },
    cancelacion: { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
    estado: { icon: Clock, bg: 'bg-orange-100', color: 'text-orange-600' },
  };

  var config = iconConfig[item.tipo] || iconConfig.creacion;
  var Icon = config.icon;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={'w-10 h-10 rounded-full flex items-center justify-center z-10 ' + config.bg}>
          <Icon className={'w-5 h-5 ' + config.color} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-2" />}
      </div>

      <div className={'flex-1 ' + (!isLast ? 'pb-6' : '')}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-slate-800">{item.titulo || item.accion}</p>
            <p className="text-sm text-slate-500 mt-0.5">{item.descripcion || item.detalle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(item.fecha || item.created_at).toLocaleString('es-CO')}
          </span>
          <span>•</span>
          <span>{item.usuario || item.usuario_nombre || 'Sistema'}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Fila de producto
 */
var ProductoRow = function(props) {
  var producto = props.producto;
  
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
        <Package className="w-5 h-5 text-slate-500" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-800">{producto.nombre || producto.producto_nombre}</p>
        <p className="text-xs text-slate-500">
          {producto.codigo || producto.sku} • Lote: {producto.lote || 'N/A'}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-slate-800">{(producto.cantidad || 0).toLocaleString()}</p>
        <p className="text-xs text-slate-500">{producto.unidad || producto.unidad_medida || 'unidades'}</p>
      </div>
    </div>
  );
};

/**
 * Tarjeta de información
 */
var InfoCard = function(props) {
  var title = props.title;
  var Icon = props.icon;
  var children = props.children;
  var action = props.action;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-slate-500" />}
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

/**
 * Modal de cambio de estado
 */
var EstadoChangeModal = function(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var onSubmit = props.onSubmit;
  var currentEstado = props.currentEstado;
  var loading = props.loading;
  
  var _a = useState(''), nuevoEstado = _a[0], setNuevoEstado = _a[1];
  var _b = useState(''), observacion = _b[0], setObservacion = _b[1];

  var estados = [
    { value: 'programado', label: 'Programado', disabled: ['en_transito', 'completado'].includes(currentEstado) },
    { value: 'en_preparacion', label: 'En Preparación', disabled: ['en_transito', 'completado'].includes(currentEstado) },
    { value: 'en_transito', label: 'En Tránsito', disabled: ['completado'].includes(currentEstado) },
    { value: 'completado', label: 'Completado', disabled: false },
  ];

  var handleSubmit = function() {
    if (!nuevoEstado) return;
    onSubmit({ estado: nuevoEstado, observacion: observacion });
  };

  useEffect(function() {
    if (isOpen) {
      setNuevoEstado('');
      setObservacion('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Estado"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!nuevoEstado}>
            Actualizar Estado
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nuevo Estado
          </label>
          <div className="space-y-2">
            {estados.map(function(e) {
              return (
                <label
                  key={e.value}
                  className={
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ' +
                    (e.disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 ' : 'hover:bg-slate-50 ') +
                    (nuevoEstado === e.value ? 'border-orange-500 bg-orange-50' : 'border-slate-200')
                  }
                >
                  <input
                    type="radio"
                    name="estado"
                    value={e.value}
                    checked={nuevoEstado === e.value}
                    onChange={function() { if (!e.disabled) setNuevoEstado(e.value); }}
                    disabled={e.disabled}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-slate-700">{e.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Observación (opcional)
          </label>
          <textarea
            value={observacion}
            onChange={function(e) { setObservacion(e.target.value); }}
            placeholder="Agregar nota sobre el cambio de estado..."
            rows={2}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
var DespachoDetail = function() {
  var params = useParams();
  var id = params.id;
  var navigate = useNavigate();
  var authHook = useAuth();
  var hasPermission = authHook.hasPermission;
  var notif = useNotification();
  var success = notif.success;
  var apiError = notif.apiError;
  var despachoCerrado = notif.despachoCerrado;

  // ──────────────────────────────────────────────────────────────────────────
  // HOOK DE DESPACHOS
  // ──────────────────────────────────────────────────────────────────────────
  var despachosHook = useDespachos({ autoFetch: false });
  
  var currentDespacho = despachosHook.currentDespacho;
  var loading = despachosHook.loading;
  var error = despachosHook.error;
  var productos = despachosHook.despachoProductos;
  var timeline = despachosHook.despachoTimeline;
  var loadingProductos = despachosHook.loadingProductos;
  var loadingTimeline = despachosHook.loadingTimeline;
  var fetchById = despachosHook.fetchById;
  var fetchDespachoProductos = despachosHook.fetchDespachoProductos;
  var fetchDespachoTimeline = despachosHook.fetchDespachoTimeline;
  var updateDespacho = despachosHook.updateDespacho;
  var cancelarDespacho = despachosHook.cancelarDespacho;
  var cambiarEstado = despachosHook.cambiarEstado;

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES
  // ──────────────────────────────────────────────────────────────────────────
  var _a = useState('info'), activeTab = _a[0], setActiveTab = _a[1];

  // Modals
  var _b = useState(false), editModal = _b[0], setEditModal = _b[1];
  var _c = useState(false), estadoModal = _c[0], setEstadoModal = _c[1];
  var _d = useState(false), cancelModal = _d[0], setCancelModal = _d[1];
  var _e = useState(false), formLoading = _e[0], setFormLoading = _e[1];

  // Permisos
  var canEdit = hasPermission('despachos', 'editar');

  // ──────────────────────────────────────────────────────────────────────────
  // CARGAR DATOS
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(function() {
    if (id) {
      fetchById(id);
      fetchDespachoProductos(id);
      fetchDespachoTimeline(id);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  var handleEditDespacho = async function(data) {
    setFormLoading(true);
    try {
      await updateDespacho(id, data);
      success('Despacho actualizado correctamente');
      setEditModal(false);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  var handleEstadoChange = async function(data) {
    setFormLoading(true);
    try {
      await cambiarEstado(id, data.estado, data.observacion);
      
      if (data.estado === 'completado') {
        despachoCerrado(currentDespacho.numero || id);
      } else {
        success('Estado actualizado a ' + data.estado.replace('_', ' '));
      }
      
      // Refrescar timeline
      fetchDespachoTimeline(id);
      setEstadoModal(false);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  var handleCancelDespacho = async function() {
    setFormLoading(true);
    try {
      await cancelarDespacho(id, { motivo: 'Cancelado por usuario' });
      success('Despacho cancelado correctamente');
      setCancelModal(false);
      // Refrescar datos
      fetchById(id);
      fetchDespachoTimeline(id);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
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
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map(function(i) {
                return <div key={i} className="h-48 bg-gray-200 rounded-2xl" />;
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ERROR STATE
  // ──────────────────────────────────────────────────────────────────────────
  
  if (error || !currentDespacho) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Despacho no encontrado</h2>
            <p className="text-slate-500 mb-4">{error || 'El despacho solicitado no existe'}</p>
            <Button variant="primary" onClick={function() { navigate('/despachos'); }}>
              Volver a Despachos
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VARIABLES CALCULADAS
  // ──────────────────────────────────────────────────────────────────────────
  
  var despacho = currentDespacho;
  var totalProductos = productos.length;
  var totalUnidades = productos.reduce(function(sum, p) { return sum + (p.cantidad || 0); }, 0);
  var isEditable = !['completado', 'cancelado'].includes(despacho.estado);

  var tabs = [
    { id: 'info', label: 'Información' },
    { id: 'productos', label: 'Productos (' + totalProductos + ')' },
    { id: 'timeline', label: 'Timeline' },
  ];

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
              onClick={function() { navigate('/despachos'); }}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Truck className="w-7 h-7 text-slate-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-800">{despacho.numero || despacho.id}</h1>
                  <StatusChip status={despacho.estado} />
                  {despacho.prioridad === 'urgente' && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      URGENTE
                    </span>
                  )}
                </div>
                <p className="text-slate-500">{despacho.cliente_nombre || despacho.cliente}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditable && canEdit && (
              <>
                <Button variant="outline" onClick={function() { setEstadoModal(true); }}>
                  Cambiar Estado
                </Button>
                <Button variant="outline" icon={Pencil} onClick={function() { setEditModal(true); }}>
                  Editar
                </Button>
              </>
            )}
            <Button variant="outline" icon={Printer}>
              Imprimir
            </Button>
            {isEditable && canEdit && (
              <Button variant="danger" icon={XCircle} onClick={function() { setCancelModal(true); }}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MAIN GRID */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-800">{totalProductos}</p>
                <p className="text-sm text-slate-500">Productos</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                <Package className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-800">{totalUnidades.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Unidades</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                <Clock className="w-8 h-8 text-violet-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-800">{despacho.hora_estimada || despacho.horaEstimada || '--:--'}</p>
                <p className="text-sm text-slate-500">ETA</p>
              </div>
            </div>

            {/* Tabs Content */}
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
                {/* Tab: Info */}
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Destino</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 text-sm">
                          <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-slate-800 font-medium">{despacho.cliente_nombre || despacho.cliente}</p>
                            <p className="text-slate-500">NIT: {despacho.cliente_nit || despacho.clienteNit || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-slate-800">{despacho.direccion_destino || despacho.direccion || '-'}</p>
                            <p className="text-slate-500">{despacho.ciudad_destino || despacho.destino || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <User className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-800">{despacho.contacto_nombre || despacho.contacto || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-800">{despacho.contacto_telefono || despacho.contactoTelefono || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Transporte</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Truck className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-800 font-medium">{despacho.vehiculo || 'Sin asignar'}</p>
                            <p className="text-slate-500">{despacho.vehiculo_tipo || despacho.vehiculoTipo || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <User className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-800">{despacho.conductor || 'Sin asignar'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-800">{despacho.conductor_telefono || despacho.conductorTelefono || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {despacho.instrucciones && (
                      <div className="md:col-span-2 space-y-2">
                        <h4 className="font-semibold text-slate-800">Instrucciones de Entrega</h4>
                        <p className="text-sm text-slate-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                          {despacho.instrucciones}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Productos */}
                {activeTab === 'productos' && (
                  <div>
                    {loadingProductos ? (
                      <div className="space-y-3">
                        {[0, 1, 2].map(function(i) {
                          return <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />;
                        })}
                      </div>
                    ) : productos.length === 0 ? (
                      <div className="py-12 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No hay productos en este despacho</p>
                      </div>
                    ) : (
                      <>
                        {productos.map(function(producto) {
                          return <ProductoRow key={producto.id} producto={producto} />;
                        })}
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                          <span className="text-sm text-slate-500">Total</span>
                          <span className="font-bold text-slate-800">{totalUnidades.toLocaleString()} unidades</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Tab: Timeline */}
                {activeTab === 'timeline' && (
                  <div>
                    {loadingTimeline ? (
                      <div className="space-y-4">
                        {[0, 1, 2].map(function(i) {
                          return <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />;
                        })}
                      </div>
                    ) : timeline.length === 0 ? (
                      <div className="py-12 text-center">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No hay eventos en el timeline</p>
                      </div>
                    ) : (
                      timeline.map(function(item, idx) {
                        return (
                          <TimelineItem 
                            key={item.id} 
                            item={item} 
                            isLast={idx === timeline.length - 1}
                          />
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Side Info */}
          <div className="space-y-6">
            {/* Fechas */}
            <InfoCard title="Programación" icon={Calendar}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Fecha Programada</p>
                  <p className="font-medium text-slate-800">{despacho.fecha_programada || despacho.fechaProgramada || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Hora Estimada</p>
                  <p className="font-medium text-slate-800">{despacho.hora_estimada || despacho.horaEstimada || '-'}</p>
                </div>
                {(despacho.fecha_salida || despacho.fechaSalida) && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Fecha de Salida</p>
                    <p className="font-medium text-emerald-600">{despacho.fecha_salida || despacho.fechaSalida}</p>
                  </div>
                )}
                {(despacho.fecha_entrega || despacho.fechaEntrega) && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Fecha de Entrega</p>
                    <p className="font-medium text-emerald-600">{despacho.fecha_entrega || despacho.fechaEntrega}</p>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Acciones Rápidas */}
            {despacho.estado === 'en_transito' && (
              <InfoCard title="Acciones Rápidas" icon={Navigation}>
                <div className="space-y-2">
                  <Button variant="outline" icon={MapPin} fullWidth>
                    Ver en Mapa
                  </Button>
                  <Button variant="outline" icon={Phone} fullWidth>
                    Llamar Conductor
                  </Button>
                  <Button variant="outline" icon={MessageSquare} fullWidth>
                    Enviar Mensaje
                  </Button>
                  <Button variant="outline" icon={Camera} fullWidth>
                    Solicitar Evidencia
                  </Button>
                </div>
              </InfoCard>
            )}

            {/* Info de Creación */}
            <InfoCard title="Información" icon={FileText}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Creado por</span>
                  <span className="text-slate-800">{despacho.creado_por || despacho.createdBy || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha creación</span>
                  <span className="text-slate-800">
                    {despacho.created_at ? new Date(despacho.created_at).toLocaleString('es-CO') : despacho.createdAt || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prioridad</span>
                  <span className="text-slate-800 capitalize">{despacho.prioridad || 'normal'}</span>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      
      <DespachoForm
        isOpen={editModal}
        onClose={function() { setEditModal(false); }}
        onSubmit={handleEditDespacho}
        despacho={despacho}
        loading={formLoading}
      />

      <EstadoChangeModal
        isOpen={estadoModal}
        onClose={function() { setEstadoModal(false); }}
        onSubmit={handleEstadoChange}
        currentEstado={despacho.estado}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={cancelModal}
        onClose={function() { setCancelModal(false); }}
        onConfirm={handleCancelDespacho}
        title="Cancelar Despacho"
        message="¿Estás seguro de cancelar este despacho? Esta acción notificará al cliente y liberará los productos reservados."
        confirmText="Cancelar Despacho"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default DespachoDetail;