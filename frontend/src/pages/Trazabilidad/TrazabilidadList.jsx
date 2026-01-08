/**
 * ISTHO CRM - TrazabilidadList Page
 * Vista principal de seguimiento de despachos en tiempo real
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Phone,
  MessageSquare,
  Eye,
  Filter,
  RefreshCw,
  Signal,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import {
  Button,
  SearchBar,
  FilterDropdown,
  StatusChip,
  KpiCard,
} from '../../components/common';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_DESPACHOS_ACTIVOS = [
  { 
    id: 'DSP-001', 
    cliente: 'Lácteos Betania S.A.S', 
    destino: 'Medellín, Antioquia',
    direccion: 'Cra 45 #78-90, Zona Industrial',
    vehiculo: 'ABC-123',
    conductor: 'Juan Pérez',
    conductorTel: '+57 310 987 6543',
    estado: 'en_transito',
    progreso: 65,
    ubicacionActual: 'Autopista Medellín - Bogotá, Km 25',
    ultimaActualizacion: '2026-01-08 10:45',
    horaEstimada: '14:00',
    tiempoRestante: '3h 15min',
    lat: 6.2518,
    lng: -75.5636,
    eventos: 12,
    alertas: 0,
  },
  { 
    id: 'DSP-004', 
    cliente: 'Prodenvases S.A.S', 
    destino: 'Barranquilla, Atlántico',
    direccion: 'Vía 40 #85-55, Zona Industrial',
    vehiculo: 'DEF-456',
    conductor: 'Carlos García',
    conductorTel: '+57 300 123 4567',
    estado: 'en_transito',
    progreso: 35,
    ubicacionActual: 'Peaje Ciénaga, Magdalena',
    ultimaActualizacion: '2026-01-08 10:30',
    horaEstimada: '18:00',
    tiempoRestante: '7h 30min',
    lat: 10.9685,
    lng: -74.7813,
    eventos: 8,
    alertas: 1,
  },
  { 
    id: 'DSP-007', 
    cliente: 'Almacenes Éxito S.A', 
    destino: 'Bucaramanga, Santander',
    direccion: 'Av Quebrada Seca #35-20',
    vehiculo: 'ABC-123',
    conductor: 'Juan Pérez',
    conductorTel: '+57 310 987 6543',
    estado: 'en_preparacion',
    progreso: 0,
    ubicacionActual: 'Centro Logístico ISTHO - Girardota',
    ultimaActualizacion: '2026-01-08 09:00',
    horaEstimada: '15:00',
    tiempoRestante: 'Pendiente salida',
    lat: 6.3816,
    lng: -75.4536,
    eventos: 3,
    alertas: 0,
  },
  { 
    id: 'DSP-009', 
    cliente: 'Klar Colombia S.A.S', 
    destino: 'Cali, Valle del Cauca',
    direccion: 'Zona Franca del Pacífico, Bod 22',
    vehiculo: 'GHI-789',
    conductor: 'María López',
    conductorTel: '+57 315 456 7890',
    estado: 'en_transito',
    progreso: 85,
    ubicacionActual: 'Entrada Cali - Yumbo',
    ultimaActualizacion: '2026-01-08 10:50',
    horaEstimada: '11:30',
    tiempoRestante: '40min',
    lat: 3.4516,
    lng: -76.5320,
    eventos: 18,
    alertas: 0,
  },
  { 
    id: 'DSP-010', 
    cliente: 'Eternit Colombia S.A', 
    destino: 'Pereira, Risaralda',
    direccion: 'Zona Industrial La Popa, Bod 8',
    vehiculo: 'JKL-012',
    conductor: 'Pedro Martínez',
    conductorTel: '+57 320 789 0123',
    estado: 'en_transito',
    progreso: 45,
    ubicacionActual: 'Manizales - Peaje Tarapacá',
    ultimaActualizacion: '2026-01-08 10:40',
    horaEstimada: '13:00',
    tiempoRestante: '2h 20min',
    lat: 4.8133,
    lng: -75.6961,
    eventos: 10,
    alertas: 2,
  },
];

const FILTER_OPTIONS = {
  estado: [
    { value: 'en_preparacion', label: 'En Preparación' },
    { value: 'en_transito', label: 'En Tránsito' },
  ],
};

// ============================================
// PROGRESS BAR
// ============================================
const ProgressBar = ({ progress, showLabel = true }) => {
  let colorClass = 'bg-blue-500';
  if (progress >= 80) colorClass = 'bg-emerald-500';
  else if (progress >= 50) colorClass = 'bg-blue-500';
  else if (progress > 0) colorClass = 'bg-amber-500';
  else colorClass = 'bg-slate-300';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 w-10 text-right">
          {progress}%
        </span>
      )}
    </div>
  );
};

// ============================================
// DESPACHO CARD
// ============================================
const DespachoCard = ({ despacho, onView, onCall, onMessage, isSelected, onSelect }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => onSelect(despacho.id)}
      className={`
        bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer
        ${isSelected 
          ? 'border-orange-500 ring-2 ring-orange-500/20' 
          : 'border-gray-100 hover:border-orange-200 hover:shadow-md'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${despacho.estado === 'en_transito' ? 'bg-blue-100' : 'bg-amber-100'}
          `}>
            <Truck className={`w-5 h-5 ${despacho.estado === 'en_transito' ? 'text-blue-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{despacho.id}</p>
            <p className="text-sm text-slate-500">{despacho.vehiculo}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {despacho.alertas > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              {despacho.alertas}
            </span>
          )}
          <StatusChip status={despacho.estado} size="sm" />
        </div>
      </div>

      {/* Cliente y Destino */}
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-800">{despacho.cliente}</p>
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" />
          {despacho.destino}
        </p>
      </div>

      {/* Ubicación Actual */}
      <div className="mb-3 p-3 bg-slate-50 rounded-xl">
        <p className="text-xs text-slate-400 mb-1">Ubicación actual</p>
        <p className="text-sm text-slate-700 font-medium">{despacho.ubicacionActual}</p>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <Signal className="w-3 h-3" />
          Actualizado: {despacho.ultimaActualizacion.split(' ')[1]}
        </p>
      </div>

      {/* Progreso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Progreso del viaje</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ETA: {despacho.horaEstimada}
          </span>
        </div>
        <ProgressBar progress={despacho.progreso} />
        <p className="text-xs text-slate-500 mt-1 text-right">
          {despacho.tiempoRestante}
        </p>
      </div>

      {/* Conductor y Acciones */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-slate-600">
              {despacho.conductor.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700">{despacho.conductor}</p>
            <p className="text-xs text-slate-400">{despacho.conductorTel}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onCall(despacho); }}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Llamar"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMessage(despacho); }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Mensaje"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/trazabilidad/timeline/${despacho.id}`); }}
            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Ver Timeline"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAPA PLACEHOLDER (Simulado)
// ============================================
const MapaSimulado = ({ despachos, selectedId, onSelectDespacho }) => {
  return (
    <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden">
      {/* Fondo del mapa simulado */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300">
        {/* Grid simulando mapa */}
        <svg className="w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Puntos de despachos */}
      {despachos.map((d, idx) => {
        const isSelected = d.id === selectedId;
        // Posiciones simuladas en el mapa
        const positions = [
          { top: '30%', left: '45%' },
          { top: '15%', left: '70%' },
          { top: '40%', left: '25%' },
          { top: '60%', left: '30%' },
          { top: '50%', left: '55%' },
        ];
        const pos = positions[idx % positions.length];

        return (
          <button
            key={d.id}
            onClick={() => onSelectDespacho(d.id)}
            style={{ top: pos.top, left: pos.left }}
            className={`
              absolute transform -translate-x-1/2 -translate-y-1/2 z-10
              transition-all duration-300
              ${isSelected ? 'scale-125' : 'hover:scale-110'}
            `}
          >
            <div className={`
              relative flex items-center justify-center
              ${isSelected ? 'animate-pulse' : ''}
            `}>
              {/* Círculo de pulso */}
              {d.estado === 'en_transito' && (
                <span className={`
                  absolute w-12 h-12 rounded-full animate-ping
                  ${isSelected ? 'bg-orange-400/30' : 'bg-blue-400/20'}
                `} />
              )}
              
              {/* Marcador */}
              <div className={`
                relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg
                ${isSelected 
                  ? 'bg-orange-500 text-white' 
                  : d.estado === 'en_transito' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-amber-500 text-white'
                }
              `}>
                <Truck className="w-5 h-5" />
              </div>
              
              {/* Label */}
              <div className={`
                absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                px-2 py-1 rounded text-xs font-medium shadow-sm
                ${isSelected ? 'bg-orange-500 text-white' : 'bg-white text-slate-700'}
              `}>
                {d.id}
              </div>
            </div>
          </button>
        );
      })}

      {/* Origen (ISTHO) */}
      <div 
        className="absolute z-5"
        style={{ top: '45%', left: '28%' }}
      >
        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center shadow-lg">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-slate-700 text-white rounded text-xs">
          ISTHO
        </div>
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm">
        <p className="text-xs font-medium text-slate-700 mb-2">Leyenda</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 bg-blue-500 rounded-full" />
            En Tránsito
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 bg-amber-500 rounded-full" />
            En Preparación
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 bg-slate-700 rounded-full" />
            Origen
          </div>
        </div>
      </div>

      {/* Info del seleccionado */}
      {selectedId && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg max-w-xs">
          {(() => {
            const d = despachos.find(x => x.id === selectedId);
            if (!d) return null;
            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-slate-800">{d.id}</span>
                </div>
                <p className="text-sm text-slate-600 mb-1">{d.cliente}</p>
                <p className="text-xs text-slate-500 mb-2">{d.ubicacionActual}</p>
                <ProgressBar progress={d.progreso} />
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const TrazabilidadList = () => {
  const navigate = useNavigate();

  // Estados
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedDespacho, setSelectedDespacho] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Cargar datos
  useEffect(() => {
    const fetchDespachos = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setDespachos(MOCK_DESPACHOS_ACTIVOS);
      setLoading(false);
    };
    fetchDespachos();
  }, []);

  // Auto-refresh simulado
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Aquí iría la actualización real de posiciones
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    const enTransito = despachos.filter(d => d.estado === 'en_transito').length;
    const enPreparacion = despachos.filter(d => d.estado === 'en_preparacion').length;
    const conAlertas = despachos.filter(d => d.alertas > 0).length;
    const progresoPromedio = despachos.length > 0 
      ? Math.round(despachos.reduce((sum, d) => sum + d.progreso, 0) / despachos.length)
      : 0;

    return { enTransito, enPreparacion, conAlertas, progresoPromedio };
  }, [despachos]);

  // Filtrar
  const filteredDespachos = useMemo(() => {
    return despachos.filter((d) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!d.id.toLowerCase().includes(search) && 
            !d.cliente.toLowerCase().includes(search) &&
            !d.conductor.toLowerCase().includes(search)) {
          return false;
        }
      }
      if (filters.estado && d.estado !== filters.estado) return false;
      return true;
    });
  }, [despachos, searchTerm, filters]);

  // Handlers
  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLastUpdate(new Date());
    setLoading(false);
  };

  const handleCall = (despacho) => {
    window.open(`tel:${despacho.conductorTel}`, '_self');
  };

  const handleMessage = (despacho) => {
    // Abrir WhatsApp o similar
    window.open(`https://wa.me/${despacho.conductorTel.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader notificationCount={kpis.conAlertas} />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Trazabilidad</h1>
            <p className="text-slate-500 mt-1">
              Seguimiento en tiempo real de despachos activos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Última actualización: {lastUpdate.toLocaleTimeString('es-CO')}
            </span>
            <Button 
              variant="outline" 
              icon={RefreshCw} 
              onClick={handleRefresh}
              loading={loading}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="En Tránsito"
            value={kpis.enTransito}
            icon={Truck}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="En Preparación"
            value={kpis.enPreparacion}
            icon={Clock}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <KpiCard
            title="Con Alertas"
            value={kpis.conAlertas}
            icon={AlertTriangle}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
          <KpiCard
            title="Progreso Promedio"
            value={`${kpis.progresoPromedio}%`}
            icon={Navigation}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[500px]">
              <MapaSimulado 
                despachos={filteredDespachos}
                selectedId={selectedDespacho}
                onSelectDespacho={setSelectedDespacho}
              />
            </div>
          </div>

          {/* Lista de Despachos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchBar
                    placeholder="Buscar despacho..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onClear={() => setSearchTerm('')}
                  />
                </div>
                <FilterDropdown
                  options={FILTER_OPTIONS.estado}
                  value={filters.estado}
                  onChange={(v) => setFilters({ estado: v })}
                  placeholder="Estado"
                  icon={Filter}
                />
              </div>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-16 bg-gray-100 rounded-xl mb-3" />
                    <div className="h-2 bg-gray-200 rounded-full" />
                  </div>
                ))
              ) : filteredDespachos.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No hay despachos activos</p>
                </div>
              ) : (
                filteredDespachos.map((despacho) => (
                  <DespachoCard
                    key={despacho.id}
                    despacho={despacho}
                    isSelected={selectedDespacho === despacho.id}
                    onSelect={setSelectedDespacho}
                    onView={() => navigate(`/trazabilidad/timeline/${despacho.id}`)}
                    onCall={handleCall}
                    onMessage={handleMessage}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>
    </div>
  );
};

export default TrazabilidadList;