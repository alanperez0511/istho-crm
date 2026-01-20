/**
 * ISTHO CRM - EvidenciasView Page
 * Galería de evidencias fotográficas de un despacho
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Download,
  ZoomIn,
  X,
  Clock,
  MapPin,
  User,
  Filter,
  Grid,
  List,
  Truck,
  Package,
  FileCheck,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

// Layout


// Components
import { Button, Modal } from '../../components/common';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_DESPACHO = {
  id: 'DSP-001',
  cliente: 'Lácteos Betania S.A.S',
  destino: 'Medellín, Antioquia',
};

const MOCK_EVIDENCIAS = [
  {
    id: 1,
    tipo: 'carga',
    titulo: 'Carga de productos',
    descripcion: 'Productos cargados en el furgón refrigerado',
    ubicacion: 'Muelle de Carga 02 - ISTHO',
    fecha: '2026-01-08 07:45',
    usuario: 'María López',
    verificado: true,
    color: 'bg-emerald-500',
  },
  {
    id: 2,
    tipo: 'sellado',
    titulo: 'Sellado del furgón',
    descripcion: 'Furgón sellado con precinto #78456',
    ubicacion: 'Muelle de Carga 02 - ISTHO',
    fecha: '2026-01-08 07:50',
    usuario: 'Juan Pérez',
    verificado: true,
    color: 'bg-blue-500',
  },
  {
    id: 3,
    tipo: 'temperatura',
    titulo: 'Verificación de temperatura',
    descripcion: 'Display del termómetro mostrando 4°C',
    ubicacion: 'Muelle de Carga 02 - ISTHO',
    fecha: '2026-01-08 07:52',
    usuario: 'María López',
    verificado: true,
    color: 'bg-cyan-500',
  },
  {
    id: 4,
    tipo: 'salida',
    titulo: 'Salida de instalaciones',
    descripcion: 'Vehículo en portería de salida',
    ubicacion: 'Portería Principal - ISTHO',
    fecha: '2026-01-08 08:30',
    usuario: 'Portería',
    verificado: true,
    color: 'bg-violet-500',
  },
  {
    id: 5,
    tipo: 'checkpoint',
    titulo: 'Checkpoint Peaje Copacabana',
    descripcion: 'Paso por peaje verificado',
    ubicacion: 'Peaje Copacabana, Antioquia',
    fecha: '2026-01-08 08:55',
    usuario: 'Juan Pérez',
    verificado: true,
    color: 'bg-blue-500',
  },
  {
    id: 6,
    tipo: 'combustible',
    titulo: 'Carga de combustible',
    descripcion: 'Ticket de carga de 45 galones',
    ubicacion: 'Estación Terpel - Bello',
    fecha: '2026-01-08 09:15',
    usuario: 'Juan Pérez',
    verificado: false,
    color: 'bg-amber-500',
  },
  {
    id: 7,
    tipo: 'incidente',
    titulo: 'Reporte de tráfico',
    descripcion: 'Congestión en autopista Medellín',
    ubicacion: 'Autopista Medellín - San Cristóbal',
    fecha: '2026-01-08 10:10',
    usuario: 'Juan Pérez',
    verificado: false,
    color: 'bg-red-500',
  },
  {
    id: 8,
    tipo: 'ruta',
    titulo: 'Vista de ruta',
    descripcion: 'Captura del GPS mostrando ruta actual',
    ubicacion: 'Autopista Medellín - Bogotá, Km 25',
    fecha: '2026-01-08 10:45',
    usuario: 'Sistema GPS',
    verificado: true,
    color: 'bg-slate-500',
  },
];

const FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos', icon: Grid },
  { value: 'carga', label: 'Carga', icon: Package },
  { value: 'sellado', label: 'Sellado', icon: FileCheck },
  { value: 'temperatura', label: 'Temperatura', icon: Camera },
  { value: 'checkpoint', label: 'Checkpoint', icon: MapPin },
  { value: 'incidente', label: 'Incidentes', icon: AlertTriangle },
];

// ============================================
// EVIDENCIA CARD
// ============================================
const EvidenciaCard = ({ evidencia, onView, viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onView(evidencia)}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer"
      >
        {/* Thumbnail */}
        <div className={`w-20 h-20 ${evidencia.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Camera className="w-8 h-8 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-slate-800 truncate">{evidencia.titulo}</h4>
            {evidencia.verificado && (
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{evidencia.descripcion}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {evidencia.fecha.split(' ')[1]}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {evidencia.ubicacion.split(' - ')[0]}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Grid mode
  return (
    <div
      onClick={() => onView(evidencia)}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
    >
      {/* Imagen */}
      <div className={`aspect-video ${evidencia.color} flex items-center justify-center relative`}>
        <Camera className="w-12 h-12 text-white/80" />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Verificado badge */}
        {evidencia.verificado && (
          <div className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="font-medium text-slate-800 mb-1 truncate">{evidencia.titulo}</h4>
        <p className="text-sm text-slate-500 truncate mb-3">{evidencia.descripcion}</p>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {evidencia.fecha.split(' ')[1]}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {evidencia.usuario}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EVIDENCIA MODAL (Lightbox)
// ============================================
const EvidenciaModal = ({ evidencia, isOpen, onClose }) => {
  if (!evidencia) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title=""
    >
      <div className="space-y-4">
        {/* Imagen grande */}
        <div className={`aspect-video ${evidencia.color} rounded-xl flex items-center justify-center`}>
          <Camera className="w-24 h-24 text-white/80" />
        </div>

        {/* Detalles */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-slate-800">{evidencia.titulo}</h3>
            {evidencia.verificado && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                <CheckCircle className="w-3 h-3" />
                Verificado
              </span>
            )}
          </div>
          <p className="text-slate-600">{evidencia.descripcion}</p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="text-xs text-slate-400 mb-1">Fecha y Hora</p>
            <p className="text-sm font-medium text-slate-700">{evidencia.fecha}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Capturado por</p>
            <p className="text-sm font-medium text-slate-700">{evidencia.usuario}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-400 mb-1">Ubicación</p>
            <p className="text-sm font-medium text-slate-700">{evidencia.ubicacion}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" icon={Download} fullWidth>
            Descargar Imagen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const EvidenciasView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [despacho, setDespacho] = useState(null);
  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('todos');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedEvidencia, setSelectedEvidencia] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setDespacho(MOCK_DESPACHO);
      setEvidencias(MOCK_EVIDENCIAS);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Filtrar evidencias
  const filteredEvidencias = filterTipo === 'todos'
    ? evidencias
    : evidencias.filter(e => e.tipo === filterTipo);

  // Estadísticas
  const stats = {
    total: evidencias.length,
    verificadas: evidencias.filter(e => e.verificado).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-video bg-gray-200 rounded-2xl" />
              ))}
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
              onClick={() => navigate(`/trazabilidad/timeline/${id}`)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">Evidencias</h1>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                  {stats.total} fotos
                </span>
              </div>
              <p className="text-slate-500">
                {despacho.id} • {despacho.cliente}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" icon={Download}>
              Descargar Todo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-sm text-slate-500">Total evidencias</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.verificadas}</p>
                <p className="text-sm text-slate-500">Verificadas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total - stats.verificadas}</p>
                <p className="text-sm text-slate-500">Pendientes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = filterTipo === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilterTipo(opt.value)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* View Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-500 mb-4">
          {filteredEvidencias.length} evidencia{filteredEvidencias.length !== 1 && 's'} encontrada{filteredEvidencias.length !== 1 && 's'}
        </p>

        {/* Gallery */}
        {filteredEvidencias.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-1">No hay evidencias</h3>
            <p className="text-slate-500">No se encontraron evidencias con el filtro seleccionado</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEvidencias.map((evidencia) => (
              <EvidenciaCard
                key={evidencia.id}
                evidencia={evidencia}
                viewMode={viewMode}
                onView={setSelectedEvidencia}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvidencias.map((evidencia) => (
              <EvidenciaCard
                key={evidencia.id}
                evidencia={evidencia}
                viewMode={viewMode}
                onView={setSelectedEvidencia}
              />
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      <EvidenciaModal
        evidencia={selectedEvidencia}
        isOpen={!!selectedEvidencia}
        onClose={() => setSelectedEvidencia(null)}
      />
    </div>
  );
};

export default EvidenciasView;