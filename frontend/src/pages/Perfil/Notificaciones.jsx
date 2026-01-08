/**
 * ISTHO CRM - Notificaciones Page
 * Centro de notificaciones del sistema
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Truck,
  Package,
  Users,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  MoreVertical,
  Eye,
  Archive,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, SearchBar } from '../../components/common';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_NOTIFICACIONES = [
  {
    id: 1,
    tipo: 'despacho',
    titulo: 'Despacho DSP-156 en tránsito',
    mensaje: 'El despacho DSP-156 para Lácteos Betania ha salido de bodega y está en camino.',
    fecha: '2026-01-08 10:45',
    leida: false,
    prioridad: 'normal',
    accion: { label: 'Ver Despacho', url: '/despachos/DSP-156' },
  },
  {
    id: 2,
    tipo: 'alerta',
    titulo: 'Stock bajo: Yogurt Natural x6',
    mensaje: 'El producto "Yogurt Natural x6" tiene stock de 45 unidades, por debajo del mínimo (100).',
    fecha: '2026-01-08 09:30',
    leida: false,
    prioridad: 'alta',
    accion: { label: 'Ver Inventario', url: '/inventario' },
  },
  {
    id: 3,
    tipo: 'cliente',
    titulo: 'Nuevo cliente registrado',
    mensaje: 'Se ha registrado el cliente "Distribuidora ABC" en el sector Retail.',
    fecha: '2026-01-08 08:15',
    leida: false,
    prioridad: 'normal',
    accion: { label: 'Ver Cliente', url: '/clientes/CLI-046' },
  },
  {
    id: 4,
    tipo: 'despacho',
    titulo: 'Despacho DSP-155 completado',
    mensaje: 'El despacho DSP-155 para Almacenes Éxito ha sido entregado exitosamente.',
    fecha: '2026-01-08 07:45',
    leida: true,
    prioridad: 'normal',
    accion: { label: 'Ver Detalle', url: '/despachos/DSP-155' },
  },
  {
    id: 5,
    tipo: 'alerta',
    titulo: 'Producto agotado: Cemento Gris x50kg',
    mensaje: 'El producto "Cemento Gris x50kg" está agotado. Se requiere reabastecimiento urgente.',
    fecha: '2026-01-07 16:30',
    leida: true,
    prioridad: 'urgente',
    accion: { label: 'Ver Producto', url: '/inventario/productos/PRD-025' },
  },
  {
    id: 6,
    tipo: 'reporte',
    titulo: 'Reporte semanal generado',
    mensaje: 'El reporte de inventario semanal ha sido generado y está listo para descargar.',
    fecha: '2026-01-07 09:00',
    leida: true,
    prioridad: 'baja',
    accion: { label: 'Descargar', url: '/reportes/inventario' },
  },
  {
    id: 7,
    tipo: 'sistema',
    titulo: 'Mantenimiento programado',
    mensaje: 'Se realizará mantenimiento del sistema el domingo 12 de enero de 2:00 AM a 4:00 AM.',
    fecha: '2026-01-06 15:00',
    leida: true,
    prioridad: 'normal',
  },
  {
    id: 8,
    tipo: 'despacho',
    titulo: 'Despacho DSP-152 cancelado',
    mensaje: 'El despacho DSP-152 para Klar Colombia ha sido cancelado por solicitud del cliente.',
    fecha: '2026-01-06 11:20',
    leida: true,
    prioridad: 'normal',
    accion: { label: 'Ver Detalle', url: '/despachos/DSP-152' },
  },
];

const FILTER_OPTIONS = [
  { value: 'todas', label: 'Todas', icon: Bell },
  { value: 'no_leidas', label: 'No leídas', icon: Clock },
  { value: 'despacho', label: 'Despachos', icon: Truck },
  { value: 'alerta', label: 'Alertas', icon: AlertTriangle },
  { value: 'cliente', label: 'Clientes', icon: Users },
  { value: 'reporte', label: 'Reportes', icon: FileText },
];

// ============================================
// NOTIFICACION CARD
// ============================================
const NotificacionCard = ({ notificacion, onMarcarLeida, onEliminar, onVerDetalle }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const tipoConfig = {
    despacho: { icon: Truck, bg: 'bg-blue-100', color: 'text-blue-600' },
    alerta: { icon: AlertTriangle, bg: 'bg-amber-100', color: 'text-amber-600' },
    cliente: { icon: Users, bg: 'bg-violet-100', color: 'text-violet-600' },
    reporte: { icon: FileText, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    sistema: { icon: Info, bg: 'bg-slate-100', color: 'text-slate-600' },
  };

  const prioridadConfig = {
    urgente: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgente' },
    alta: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Alta' },
    normal: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Normal' },
    baja: { bg: 'bg-slate-50', text: 'text-slate-500', label: 'Baja' },
  };

  const config = tipoConfig[notificacion.tipo] || tipoConfig.sistema;
  const prioridad = prioridadConfig[notificacion.prioridad] || prioridadConfig.normal;
  const Icon = config.icon;

  const handleAccion = () => {
    if (notificacion.accion?.url) {
      navigate(notificacion.accion.url);
    }
  };

  return (
    <div className={`
      relative p-4 rounded-2xl border transition-all
      ${notificacion.leida 
        ? 'bg-white border-gray-100' 
        : 'bg-orange-50/50 border-orange-200'
      }
    `}>
      {/* Indicador no leída */}
      {!notificacion.leida && (
        <span className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full" />
      )}

      <div className="flex gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <h4 className={`font-medium ${notificacion.leida ? 'text-slate-700' : 'text-slate-900'}`}>
                {notificacion.titulo}
              </h4>
              {notificacion.prioridad !== 'normal' && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${prioridad.bg} ${prioridad.text}`}>
                  {prioridad.label}
                </span>
              )}
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    {!notificacion.leida && (
                      <button
                        onClick={() => { onMarcarLeida(notificacion.id); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Check className="w-4 h-4" />
                        Marcar leída
                      </button>
                    )}
                    {notificacion.accion && (
                      <button
                        onClick={() => { handleAccion(); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalle
                      </button>
                    )}
                    <button
                      onClick={() => { onEliminar(notificacion.id); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className={`text-sm mb-2 ${notificacion.leida ? 'text-slate-500' : 'text-slate-600'}`}>
            {notificacion.mensaje}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {notificacion.fecha}
            </span>

            {notificacion.accion && (
              <button
                onClick={handleAccion}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                {notificacion.accion.label} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const Notificaciones = () => {
  const navigate = useNavigate();

  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setNotificaciones(MOCK_NOTIFICACIONES);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    const urgentes = notificaciones.filter(n => n.prioridad === 'urgente' && !n.leida).length;
    return { noLeidas, urgentes };
  }, [notificaciones]);

  // Filtrar
  const filteredNotificaciones = useMemo(() => {
    return notificaciones.filter((n) => {
      if (filter === 'no_leidas' && n.leida) return false;
      if (filter !== 'todas' && filter !== 'no_leidas' && n.tipo !== filter) return false;
      if (searchTerm && !n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !n.mensaje.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [notificaciones, filter, searchTerm]);

  // Handlers
  const handleMarcarLeida = (id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const handleMarcarTodasLeidas = () => {
    setNotificaciones((prev) =>
      prev.map((n) => ({ ...n, leida: true }))
    );
  };

  const handleEliminar = (id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  };

  const handleEliminarLeidas = () => {
    setNotificaciones((prev) => prev.filter((n) => !n.leida));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader notificationCount={stats.noLeidas} />

      <main className="pt-28 px-4 pb-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Notificaciones</h1>
            <p className="text-slate-500 mt-1">
              {stats.noLeidas > 0 
                ? `Tienes ${stats.noLeidas} notificación${stats.noLeidas > 1 ? 'es' : ''} sin leer`
                : 'Todas las notificaciones leídas'
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            {stats.noLeidas > 0 && (
              <Button variant="outline" icon={CheckCheck} onClick={handleMarcarTodasLeidas}>
                Marcar todas leídas
              </Button>
            )}
            <Button variant="outline" icon={Settings} onClick={() => navigate('/configuracion')}>
              Configurar
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats.urgentes > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800">
                Tienes {stats.urgentes} alerta{stats.urgentes > 1 ? 's' : ''} urgente{stats.urgentes > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-600">Requieren atención inmediata</p>
            </div>
            <Button variant="danger" size="sm">
              Ver Urgentes
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => setSearchTerm('')}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {FILTER_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = filter === opt.value;
                const count = opt.value === 'no_leidas' 
                  ? stats.noLeidas 
                  : opt.value === 'todas'
                    ? notificaciones.length
                    : notificaciones.filter(n => n.tipo === opt.value).length;

                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
                      ${isActive 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                    {count > 0 && (
                      <span className={`
                        px-1.5 py-0.5 text-xs rounded-full
                        ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}
                      `}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notificaciones List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotificaciones.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">Sin notificaciones</h3>
            <p className="text-slate-500">
              {filter !== 'todas' 
                ? 'No hay notificaciones con el filtro seleccionado' 
                : 'No tienes notificaciones pendientes'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredNotificaciones.map((notificacion) => (
                <NotificacionCard
                  key={notificacion.id}
                  notificacion={notificacion}
                  onMarcarLeida={handleMarcarLeida}
                  onEliminar={handleEliminar}
                />
              ))}
            </div>

            {/* Acciones masivas */}
            {notificaciones.some(n => n.leida) && (
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="ghost" 
                  icon={Trash2} 
                  onClick={handleEliminarLeidas}
                  className="text-slate-500"
                >
                  Eliminar notificaciones leídas
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Notificaciones;