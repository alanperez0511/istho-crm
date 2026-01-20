/**
 * ISTHO CRM - TrazabilidadTimeline Page
 * Timeline detallado de eventos de un despacho
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  FileText,
  Camera,
  Navigation,
  Phone,
  MessageSquare,
  User,
  Thermometer,
  Fuel,
  PauseCircle,
  PlayCircle,
  Flag,
  Building2,
} from 'lucide-react';

// Layout


// Components
import { Button, StatusChip } from '../../components/common';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_DESPACHO = {
  id: 'DSP-001',
  cliente: 'Lácteos Betania S.A.S',
  destino: 'Medellín, Antioquia',
  direccion: 'Cra 45 #78-90, Zona Industrial Norte',
  vehiculo: 'ABC-123',
  vehiculoTipo: 'Furgón Refrigerado 5 Ton',
  conductor: 'Juan Pérez',
  conductorTel: '+57 310 987 6543',
  estado: 'en_transito',
  progreso: 65,
  fechaProgramada: '2026-01-08',
  horaEstimada: '14:00',
  fechaSalida: '2026-01-08 08:30',
  distanciaTotal: 380,
  distanciaRecorrida: 247,
  temperaturaActual: 4.2,
  temperaturaObjetivo: 4,
  combustible: 72,
};

const MOCK_EVENTOS = [
  {
    id: 1,
    tipo: 'creacion',
    titulo: 'Despacho creado',
    descripcion: 'Orden de despacho generada en el sistema',
    ubicacion: 'Centro Logístico ISTHO',
    fecha: '2026-01-07 15:30',
    usuario: 'Carlos Martínez',
    icon: FileText,
    color: 'slate',
  },
  {
    id: 2,
    tipo: 'asignacion',
    titulo: 'Vehículo asignado',
    descripcion: 'Asignado camión ABC-123 (Furgón Refrigerado) con conductor Juan Pérez',
    ubicacion: 'Centro Logístico ISTHO',
    fecha: '2026-01-07 16:00',
    usuario: 'Sistema',
    icon: Truck,
    color: 'blue',
  },
  {
    id: 3,
    tipo: 'preparacion',
    titulo: 'Inicio de preparación',
    descripcion: 'Inicio de alistamiento de productos en bodega refrigerada',
    ubicacion: 'Bodega 01 - Refrigerados',
    fecha: '2026-01-08 06:00',
    usuario: 'María López',
    icon: Package,
    color: 'amber',
  },
  {
    id: 4,
    tipo: 'verificacion',
    titulo: 'Verificación de temperatura',
    descripcion: 'Temperatura del furgón verificada: 4°C ✓',
    ubicacion: 'Bodega 01 - Refrigerados',
    fecha: '2026-01-08 07:15',
    usuario: 'María López',
    icon: Thermometer,
    color: 'cyan',
    datos: { temperatura: 4 },
  },
  {
    id: 5,
    tipo: 'carga',
    titulo: 'Carga completada',
    descripcion: 'Productos verificados y cargados. 450 unidades totales en 3 productos.',
    ubicacion: 'Muelle de Carga 02',
    fecha: '2026-01-08 07:45',
    usuario: 'María López',
    icon: Package,
    color: 'emerald',
    datos: { unidades: 450, productos: 3 },
  },
  {
    id: 6,
    tipo: 'evidencia',
    titulo: 'Evidencia fotográfica',
    descripcion: 'Foto de carga tomada antes de sellar el furgón',
    ubicacion: 'Muelle de Carga 02',
    fecha: '2026-01-08 07:50',
    usuario: 'Juan Pérez',
    icon: Camera,
    color: 'violet',
    imagen: true,
  },
  {
    id: 7,
    tipo: 'salida',
    titulo: 'Salida de bodega',
    descripcion: 'Vehículo sale de instalaciones hacia destino final',
    ubicacion: 'Centro Logístico ISTHO - Girardota',
    fecha: '2026-01-08 08:30',
    usuario: 'Portería',
    icon: PlayCircle,
    color: 'emerald',
    coordenadas: { lat: 6.3816, lng: -75.4536 },
  },
  {
    id: 8,
    tipo: 'checkpoint',
    titulo: 'Checkpoint - Peaje Copacabana',
    descripcion: 'Paso por peaje registrado. Temperatura: 4.1°C',
    ubicacion: 'Peaje Copacabana, Antioquia',
    fecha: '2026-01-08 08:55',
    usuario: 'GPS',
    icon: Flag,
    color: 'blue',
    coordenadas: { lat: 6.3456, lng: -75.5012 },
    datos: { temperatura: 4.1 },
  },
  {
    id: 9,
    tipo: 'combustible',
    titulo: 'Carga de combustible',
    descripcion: 'Parada para tanqueo. 45 galones cargados.',
    ubicacion: 'Estación Terpel - Bello',
    fecha: '2026-01-08 09:15',
    usuario: 'Juan Pérez',
    icon: Fuel,
    color: 'amber',
    datos: { galones: 45 },
  },
  {
    id: 10,
    tipo: 'checkpoint',
    titulo: 'Checkpoint - Túnel de Occidente',
    descripcion: 'Ingreso al Túnel de Occidente. Todo en orden.',
    ubicacion: 'Túnel de Occidente, Antioquia',
    fecha: '2026-01-08 09:45',
    usuario: 'GPS',
    icon: Navigation,
    color: 'blue',
    coordenadas: { lat: 6.2850, lng: -75.6230 },
  },
  {
    id: 11,
    tipo: 'alerta',
    titulo: 'Alerta de tráfico',
    descripcion: 'Congestión vehicular detectada. Tiempo estimado aumentado en 15 min.',
    ubicacion: 'Autopista Medellín - San Cristóbal',
    fecha: '2026-01-08 10:10',
    usuario: 'Sistema',
    icon: AlertTriangle,
    color: 'red',
  },
  {
    id: 12,
    tipo: 'transito',
    titulo: 'En tránsito',
    descripcion: 'Circulando normalmente por autopista. Temperatura estable: 4.2°C',
    ubicacion: 'Autopista Medellín - Bogotá, Km 25',
    fecha: '2026-01-08 10:45',
    usuario: 'GPS',
    icon: Truck,
    color: 'blue',
    coordenadas: { lat: 6.2518, lng: -75.5636 },
    datos: { velocidad: 60, temperatura: 4.2 },
    esActual: true,
  },
];

// ============================================
// TIMELINE EVENT COMPONENT
// ============================================
const TimelineEvent = ({ evento, isLast, isFirst }) => {
  const Icon = evento.icon;

  const colorConfig = {
    slate: { bg: 'bg-slate-100', icon: 'text-slate-600', border: 'border-slate-200' },
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600', border: 'border-blue-200' },
    amber: { bg: 'bg-amber-100', icon: 'text-amber-600', border: 'border-amber-200' },
    emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600', border: 'border-emerald-200' },
    red: { bg: 'bg-red-100', icon: 'text-red-600', border: 'border-red-200' },
    violet: { bg: 'bg-violet-100', icon: 'text-violet-600', border: 'border-violet-200' },
    cyan: { bg: 'bg-cyan-100', icon: 'text-cyan-600', border: 'border-cyan-200' },
  };

  const colors = colorConfig[evento.color] || colorConfig.slate;

  return (
    <div className={`flex gap-4 ${!isLast ? 'pb-6' : ''}`}>
      {/* Timeline Line & Icon */}
      <div className="flex flex-col items-center">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center z-10 
          ${colors.bg} ${evento.esActual ? 'ring-4 ring-blue-500/30 animate-pulse' : ''}
        `}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-slate-200 my-2" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${evento.esActual ? 'bg-blue-50 -mx-3 px-3 py-3 rounded-xl border border-blue-200' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-800">{evento.titulo}</h4>
              {evento.esActual && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                  Actual
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">{evento.descripcion}</p>
          </div>
        </div>

        {/* Ubicación */}
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
          <MapPin className="w-3 h-3" />
          {evento.ubicacion}
        </div>

        {/* Datos adicionales */}
        {evento.datos && (
          <div className="flex flex-wrap gap-3 mt-3">
            {evento.datos.temperatura !== undefined && (
              <span className="flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-xs">
                <Thermometer className="w-3 h-3" />
                {evento.datos.temperatura}°C
              </span>
            )}
            {evento.datos.velocidad !== undefined && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                <Navigation className="w-3 h-3" />
                {evento.datos.velocidad} km/h
              </span>
            )}
            {evento.datos.unidades !== undefined && (
              <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                <Package className="w-3 h-3" />
                {evento.datos.unidades} unidades
              </span>
            )}
            {evento.datos.galones !== undefined && (
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs">
                <Fuel className="w-3 h-3" />
                {evento.datos.galones} gal
              </span>
            )}
          </div>
        )}

        {/* Imagen placeholder */}
        {evento.imagen && (
          <div className="mt-3">
            <div className="w-32 h-24 bg-slate-200 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-slate-400" />
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {evento.fecha}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {evento.usuario}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// INFO PANEL
// ============================================
const InfoPanel = ({ despacho }) => {
  const distanciaRestante = despacho.distanciaTotal - despacho.distanciaRecorrida;

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-slate-800 mb-4">Estado Actual</h3>

        <div className="space-y-4">
          {/* Progreso */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Progreso del viaje</span>
              <span className="font-medium text-slate-800">{despacho.progreso}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${despacho.progreso}%` }}
              />
            </div>
          </div>

          {/* Distancia */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">Recorrido</p>
              <p className="text-lg font-bold text-slate-800">{despacho.distanciaRecorrida} km</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">Restante</p>
              <p className="text-lg font-bold text-slate-800">{distanciaRestante} km</p>
            </div>
          </div>

          {/* Temperatura */}
          <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-800">Temperatura</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-700">{despacho.temperaturaActual}°C</p>
                <p className="text-xs text-cyan-600">Objetivo: {despacho.temperaturaObjetivo}°C</p>
              </div>
            </div>
          </div>

          {/* Combustible */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500 flex items-center gap-1">
                <Fuel className="w-4 h-4" />
                Combustible
              </span>
              <span className="font-medium text-slate-800">{despacho.combustible}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${despacho.combustible > 30 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${despacho.combustible}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conductor */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-slate-800 mb-4">Conductor</h3>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{despacho.conductor}</p>
            <p className="text-sm text-slate-500">{despacho.conductorTel}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            icon={Phone}
            size="sm"
            onClick={() => window.open(`tel:${despacho.conductorTel}`, '_self')}
          >
            Llamar
          </Button>
          <Button
            variant="outline"
            icon={MessageSquare}
            size="sm"
            onClick={() => window.open(`https://wa.me/${despacho.conductorTel.replace(/\D/g, '')}`, '_blank')}
          >
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Vehículo */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-slate-800 mb-4">Vehículo</h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-slate-400" />
            <div>
              <p className="font-medium text-slate-800">{despacho.vehiculo}</p>
              <p className="text-sm text-slate-500">{despacho.vehiculoTipo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Destino */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-slate-800 mb-4">Destino</h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800">{despacho.cliente}</p>
              <p className="text-sm text-slate-500">{despacho.direccion}</p>
              <p className="text-sm text-slate-500">{despacho.destino}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Hora estimada de llegada</p>
              <p className="font-medium text-slate-800">{despacho.horaEstimada}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const TrazabilidadTimeline = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [despacho, setDespacho] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('todos');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setDespacho(MOCK_DESPACHO);
      setEventos(MOCK_EVENTOS);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Filtrar eventos
  const filteredEventos = filterTipo === 'todos'
    ? eventos
    : eventos.filter(e => e.tipo === filterTipo);

  // Tipos únicos para filtro
  const tiposUnicos = [...new Set(eventos.map(e => e.tipo))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 h-96 bg-gray-200 rounded-2xl" />
              <div className="h-96 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">


      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/trazabilidad')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Truck className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-800">{despacho.id}</h1>
                  <StatusChip status={despacho.estado} />
                </div>
                <p className="text-slate-500">{despacho.cliente} → {despacho.destino}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Camera} onClick={() => navigate(`/trazabilidad/evidencias/${id}`)}>
              Evidencias
            </Button>
            <Button variant="outline" icon={MapPin} onClick={() => navigate('/trazabilidad')}>
              Ver en Mapa
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* Timeline Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">
                  Timeline de Eventos ({eventos.length})
                </h2>

                {/* Filtro */}
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="todos">Todos los eventos</option>
                  {tiposUnicos.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeline Events */}
              <div>
                {filteredEventos.map((evento, idx) => (
                  <TimelineEvent
                    key={evento.id}
                    evento={evento}
                    isFirst={idx === 0}
                    isLast={idx === filteredEventos.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1">
            <InfoPanel despacho={despacho} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrazabilidadTimeline;