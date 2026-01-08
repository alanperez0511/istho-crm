/**
 * ISTHO CRM - DespachoDetail Page
 * Vista de detalle completa del despacho
 * 
 * @author Coordinación TI ISTHO
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
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, StatusChip, ConfirmDialog, Modal } from '../../components/common';

// Local Components
import DespachoForm from './components/DespachoForm';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_DESPACHO = {
  id: 'DSP-001',
  clienteId: 'CLI-001',
  cliente: 'Lácteos Betania S.A.S',
  clienteNit: '900.123.456-1',
  contacto: 'María García',
  contactoTelefono: '+57 300 123 4567',
  destino: 'Medellín, Antioquia',
  direccion: 'Cra 45 #78-90, Zona Industrial Norte',
  vehiculo: 'ABC-123',
  vehiculoTipo: 'Furgón 5 Toneladas',
  conductor: 'Juan Pérez',
  conductorTelefono: '+57 310 987 6543',
  fechaProgramada: '2026-01-08',
  horaEstimada: '14:00',
  fechaSalida: '2026-01-08 08:30',
  fechaEntrega: null,
  estado: 'en_transito',
  prioridad: 'alta',
  instrucciones: 'Entregar en recepción de mercancías. Llamar 30 minutos antes de llegar.',
  observaciones: 'Cliente preferencial. Verificar temperatura de productos refrigerados.',
  documentos: ['Guía de Remisión', 'Factura', 'Certificado de Calidad'],
  createdAt: '2026-01-07 15:30',
  createdBy: 'Carlos Martínez',
};

const MOCK_PRODUCTOS = [
  { id: 1, productoId: 'PRD-001', codigo: 'SKU-LCH-001', nombre: 'Leche UHT x24', cantidad: 200, unidad: 'caja', lote: 'LOT-2026-001', vencimiento: '2026-06-15' },
  { id: 2, productoId: 'PRD-002', codigo: 'SKU-YGT-001', nombre: 'Yogurt Griego x12', cantidad: 150, unidad: 'caja', lote: 'LOT-2026-015', vencimiento: '2026-02-28' },
  { id: 3, productoId: 'PRD-006', codigo: 'SKU-QSO-001', nombre: 'Queso Doble Crema x5kg', cantidad: 100, unidad: 'unidad', lote: 'LOT-2026-008', vencimiento: '2026-02-15' },
];

const MOCK_TIMELINE = [
  { id: 1, tipo: 'creacion', titulo: 'Despacho creado', descripcion: 'Orden de despacho generada en el sistema', fecha: '2026-01-07 15:30', usuario: 'Carlos Martínez' },
  { id: 2, tipo: 'asignacion', titulo: 'Vehículo asignado', descripcion: 'Asignado camión ABC-123 con conductor Juan Pérez', fecha: '2026-01-07 16:00', usuario: 'Sistema' },
  { id: 3, tipo: 'preparacion', titulo: 'En preparación', descripcion: 'Inicio de alistamiento de productos en bodega', fecha: '2026-01-08 06:00', usuario: 'María López' },
  { id: 4, tipo: 'verificacion', titulo: 'Verificación completada', descripcion: 'Productos verificados y cargados. 450 unidades totales.', fecha: '2026-01-08 07:45', usuario: 'María López' },
  { id: 5, tipo: 'salida', titulo: 'Salida de bodega', descripcion: 'Vehículo sale de instalaciones hacia destino', fecha: '2026-01-08 08:30', usuario: 'Sistema' },
  { id: 6, tipo: 'transito', titulo: 'En tránsito', descripcion: 'Ubicación actual: Vía Medellín - Girardota', fecha: '2026-01-08 10:15', usuario: 'GPS' },
];

// ============================================
// TIMELINE ITEM
// ============================================
const TimelineItem = ({ item, isLast }) => {
  const iconConfig = {
    creacion: { icon: FileText, bg: 'bg-slate-100', color: 'text-slate-600' },
    asignacion: { icon: Truck, bg: 'bg-blue-100', color: 'text-blue-600' },
    preparacion: { icon: Package, bg: 'bg-amber-100', color: 'text-amber-600' },
    verificacion: { icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    salida: { icon: Navigation, bg: 'bg-violet-100', color: 'text-violet-600' },
    transito: { icon: MapPin, bg: 'bg-blue-100', color: 'text-blue-600' },
    entrega: { icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    incidente: { icon: AlertCircle, bg: 'bg-red-100', color: 'text-red-600' },
  };

  const config = iconConfig[item.tipo] || iconConfig.creacion;
  const Icon = config.icon;

  return (
    <div className="flex gap-4">
      {/* Icon & Line */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 ${config.bg} rounded-full flex items-center justify-center z-10`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-2" />}
      </div>

      {/* Content */}
      <div className={`flex-1 ${!isLast ? 'pb-6' : ''}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-slate-800">{item.titulo}</p>
            <p className="text-sm text-slate-500 mt-0.5">{item.descripcion}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.fecha}
          </span>
          <span>•</span>
          <span>{item.usuario}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PRODUCTO ROW
// ============================================
const ProductoRow = ({ producto }) => (
  <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
      <Package className="w-5 h-5 text-slate-500" />
    </div>
    <div className="flex-1">
      <p className="font-medium text-slate-800">{producto.nombre}</p>
      <p className="text-xs text-slate-500">{producto.codigo} • Lote: {producto.lote}</p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-slate-800">{producto.cantidad.toLocaleString()}</p>
      <p className="text-xs text-slate-500">{producto.unidad}</p>
    </div>
  </div>
);

// ============================================
// INFO CARD
// ============================================
const InfoCard = ({ title, icon: Icon, children, action }) => (
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

// ============================================
// ESTADO CHANGE MODAL
// ============================================
const EstadoChangeModal = ({ isOpen, onClose, onSubmit, currentEstado, loading }) => {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observacion, setObservacion] = useState('');

  const estados = [
    { value: 'programado', label: 'Programado', disabled: ['en_transito', 'completado'].includes(currentEstado) },
    { value: 'en_preparacion', label: 'En Preparación', disabled: ['en_transito', 'completado'].includes(currentEstado) },
    { value: 'en_transito', label: 'En Tránsito', disabled: ['completado'].includes(currentEstado) },
    { value: 'completado', label: 'Completado', disabled: false },
  ];

  const handleSubmit = () => {
    if (!nuevoEstado) return;
    onSubmit({ estado: nuevoEstado, observacion });
  };

  useEffect(() => {
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
            {estados.map((e) => (
              <label
                key={e.value}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                  ${e.disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'}
                  ${nuevoEstado === e.value ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}
                `}
              >
                <input
                  type="radio"
                  name="estado"
                  value={e.value}
                  checked={nuevoEstado === e.value}
                  onChange={() => !e.disabled && setNuevoEstado(e.value)}
                  disabled={e.disabled}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">{e.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Observación (opcional)
          </label>
          <textarea
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Agregar nota sobre el cambio de estado..."
            rows={2}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DespachoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados
  const [despacho, setDespacho] = useState(null);
  const [productos, setProductos] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Modals
  const [editModal, setEditModal] = useState(false);
  const [estadoModal, setEstadoModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setDespacho(MOCK_DESPACHO);
      setProductos(MOCK_PRODUCTOS);
      setTimeline(MOCK_TIMELINE);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Handlers
  const handleEditDespacho = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setDespacho((prev) => ({ ...prev, ...data }));
    setFormLoading(false);
    setEditModal(false);
  };

  const handleEstadoChange = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    
    // Agregar al timeline
    const nuevoEvento = {
      id: Date.now(),
      tipo: data.estado === 'completado' ? 'entrega' : data.estado.replace('_', ''),
      titulo: `Estado cambiado a ${data.estado.replace('_', ' ')}`,
      descripcion: data.observacion || 'Cambio de estado manual',
      fecha: new Date().toLocaleString('es-CO'),
      usuario: 'Usuario',
    };
    setTimeline((prev) => [...prev, nuevoEvento]);
    
    // Actualizar despacho
    setDespacho((prev) => ({
      ...prev,
      estado: data.estado,
      ...(data.estado === 'completado' ? { fechaEntrega: new Date().toISOString() } : {}),
    }));

    setFormLoading(false);
    setEstadoModal(false);
  };

  const handleCancelDespacho = async () => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setDespacho((prev) => ({ ...prev, estado: 'cancelado' }));
    setFormLoading(false);
    setCancelModal(false);
  };

  // Calcular totales
  const totalProductos = productos.length;
  const totalUnidades = productos.reduce((sum, p) => sum + p.cantidad, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información' },
    { id: 'productos', label: `Productos (${totalProductos})` },
    { id: 'timeline', label: 'Timeline' },
  ];

  const isEditable = !['completado', 'cancelado'].includes(despacho.estado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/despachos')}
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
                  <h1 className="text-2xl font-bold text-slate-800">{despacho.id}</h1>
                  <StatusChip status={despacho.estado} />
                  {despacho.prioridad === 'urgente' && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      URGENTE
                    </span>
                  )}
                </div>
                <p className="text-slate-500">{despacho.cliente}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditable && (
              <>
                <Button variant="outline" onClick={() => setEstadoModal(true)}>
                  Cambiar Estado
                </Button>
                <Button variant="outline" icon={Pencil} onClick={() => setEditModal(true)}>
                  Editar
                </Button>
              </>
            )}
            <Button variant="outline" icon={Printer}>
              Imprimir
            </Button>
            {isEditable && (
              <Button variant="danger" icon={XCircle} onClick={() => setCancelModal(true)}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Main Grid */}
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
                <p className="text-2xl font-bold text-slate-800">{despacho.horaEstimada}</p>
                <p className="text-sm text-slate-500">ETA</p>
              </div>
            </div>

            {/* Tabs Content */}
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
                {/* Tab: Info */}
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Destino</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 text-sm">
                          <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-slate-800 font-medium">{despacho.cliente}</p>
                            <p className="text-slate-500">NIT: {despacho.clienteNit}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-slate-800">{despacho.direccion}</p>
                            <p className="text-slate-500">{despacho.destino}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <User className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-800">{despacho.contacto}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-800">{despacho.contactoTelefono}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Transporte</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Truck className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-800 font-medium">{despacho.vehiculo}</p>
                            <p className="text-slate-500">{despacho.vehiculoTipo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <User className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-800">{despacho.conductor}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-800">{despacho.conductorTelefono}</span>
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

                    {despacho.documentos?.length > 0 && (
                      <div className="md:col-span-2 space-y-2">
                        <h4 className="font-semibold text-slate-800">Documentos</h4>
                        <div className="flex flex-wrap gap-2">
                          {despacho.documentos.map((doc, idx) => (
                            <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm">
                              <FileText className="w-4 h-4" />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Productos */}
                {activeTab === 'productos' && (
                  <div>
                    {productos.map((producto) => (
                      <ProductoRow key={producto.id} producto={producto} />
                    ))}
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                      <span className="text-sm text-slate-500">Total</span>
                      <span className="font-bold text-slate-800">{totalUnidades.toLocaleString()} unidades</span>
                    </div>
                  </div>
                )}

                {/* Tab: Timeline */}
                {activeTab === 'timeline' && (
                  <div>
                    {timeline.map((item, idx) => (
                      <TimelineItem 
                        key={item.id} 
                        item={item} 
                        isLast={idx === timeline.length - 1}
                      />
                    ))}
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
                  <p className="font-medium text-slate-800">{despacho.fechaProgramada}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Hora Estimada</p>
                  <p className="font-medium text-slate-800">{despacho.horaEstimada}</p>
                </div>
                {despacho.fechaSalida && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Fecha de Salida</p>
                    <p className="font-medium text-emerald-600">{despacho.fechaSalida}</p>
                  </div>
                )}
                {despacho.fechaEntrega && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Fecha de Entrega</p>
                    <p className="font-medium text-emerald-600">{despacho.fechaEntrega}</p>
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
                  <span className="text-slate-800">{despacho.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha creación</span>
                  <span className="text-slate-800">{despacho.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prioridad</span>
                  <span className="text-slate-800 capitalize">{despacho.prioridad}</span>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </main>

      {/* Modals */}
      <DespachoForm
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        onSubmit={handleEditDespacho}
        despacho={despacho}
        loading={formLoading}
      />

      <EstadoChangeModal
        isOpen={estadoModal}
        onClose={() => setEstadoModal(false)}
        onSubmit={handleEstadoChange}
        currentEstado={despacho.estado}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
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