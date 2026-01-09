/**
 * ============================================================================
 * ISTHO CRM - Notificaciones (Fase 5 - Integración Completa)
 * ============================================================================
 * Centro de notificaciones del sistema conectado al backend real.
 * 
 * CAMBIOS vs versión anterior:
 * - Eliminado MOCK_NOTIFICACIONES
 * - Conectado con notificacionesService
 * - Acciones reales (marcar leída, eliminar)
 * - WebSocket ready para tiempo real
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
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
  RefreshCw,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, SearchBar } from '../../components/common';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS E INTEGRACIÓN
// ════════════════════════════════════════════════════════════════════════════
import { useAuth } from '../../context/AuthContext';
import useNotification from '../../hooks/useNotification';
import { notificacionesService } from '../../services/api/notificacionesService';

// ════════════════════════════════════════════════════════════════════════════
// OPCIONES DE FILTRO
// ════════════════════════════════════════════════════════════════════════════
var FILTER_OPTIONS = [
  { value: 'todas', label: 'Todas', icon: Bell },
  { value: 'no_leidas', label: 'No leídas', icon: Clock },
  { value: 'despacho', label: 'Despachos', icon: Truck },
  { value: 'alerta', label: 'Alertas', icon: AlertTriangle },
  { value: 'cliente', label: 'Clientes', icon: Users },
  { value: 'reporte', label: 'Reportes', icon: FileText },
];

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICACIÓN CARD
// ════════════════════════════════════════════════════════════════════════════
var NotificacionCard = function(props) {
  var notificacion = props.notificacion;
  var onMarcarLeida = props.onMarcarLeida;
  var onEliminar = props.onEliminar;
  
  var _a = useState(false), menuOpen = _a[0], setMenuOpen = _a[1];
  var navigate = useNavigate();

  var tipoConfig = {
    despacho: { icon: Truck, bg: 'bg-blue-100', color: 'text-blue-600' },
    alerta: { icon: AlertTriangle, bg: 'bg-amber-100', color: 'text-amber-600' },
    cliente: { icon: Users, bg: 'bg-violet-100', color: 'text-violet-600' },
    reporte: { icon: FileText, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    sistema: { icon: Info, bg: 'bg-slate-100', color: 'text-slate-600' },
    inventario: { icon: Package, bg: 'bg-orange-100', color: 'text-orange-600' },
  };

  var prioridadConfig = {
    urgente: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgente' },
    alta: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Alta' },
    normal: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Normal' },
    baja: { bg: 'bg-slate-50', text: 'text-slate-500', label: 'Baja' },
  };

  var config = tipoConfig[notificacion.tipo] || tipoConfig.sistema;
  var prioridad = prioridadConfig[notificacion.prioridad] || prioridadConfig.normal;
  var Icon = config.icon;

  var handleAccion = function() {
    var url = notificacion.accion_url || notificacion.url;
    if (url) {
      navigate(url);
    }
  };

  return (
    <div className={
      'relative p-4 rounded-2xl border transition-all ' +
      (notificacion.leida 
        ? 'bg-white border-gray-100' 
        : 'bg-orange-50/50 border-orange-200')
    }>
      {/* Indicador no leída */}
      {!notificacion.leida && (
        <span className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full" />
      )}

      <div className="flex gap-4">
        {/* Icon */}
        <div className={'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ' + config.bg}>
          <Icon className={'w-6 h-6 ' + config.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={'font-medium ' + (notificacion.leida ? 'text-slate-700' : 'text-slate-900')}>
                {notificacion.titulo}
              </h4>
              {notificacion.prioridad !== 'normal' && (
                <span className={'px-2 py-0.5 text-xs font-medium rounded-full ' + prioridad.bg + ' ' + prioridad.text}>
                  {prioridad.label}
                </span>
              )}
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={function() { setMenuOpen(!menuOpen); }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={function() { setMenuOpen(false); }} />
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    {!notificacion.leida && (
                      <button
                        onClick={function() { onMarcarLeida(notificacion.id); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Check className="w-4 h-4" />
                        Marcar leída
                      </button>
                    )}
                    {(notificacion.accion_url || notificacion.url) && (
                      <button
                        onClick={function() { handleAccion(); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalle
                      </button>
                    )}
                    <button
                      onClick={function() { onEliminar(notificacion.id); setMenuOpen(false); }}
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

          <p className={'text-sm mb-2 ' + (notificacion.leida ? 'text-slate-500' : 'text-slate-600')}>
            {notificacion.mensaje || notificacion.descripcion}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(notificacion.fecha || notificacion.created_at).toLocaleString('es-CO')}
            </span>

            {(notificacion.accion_url || notificacion.url || notificacion.accion_label) && (
              <button
                onClick={handleAccion}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                {notificacion.accion_label || 'Ver detalle'} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
var Notificaciones = function() {
  var navigate = useNavigate();
  var authHook = useAuth();
  var user = authHook.user;
  var notif = useNotification();
  var success = notif.success;
  var apiError = notif.apiError;

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────
  var _a = useState([]), notificaciones = _a[0], setNotificaciones = _a[1];
  var _b = useState(true), loading = _b[0], setLoading = _b[1];
  var _c = useState(false), isRefreshing = _c[0], setIsRefreshing = _c[1];
  var _d = useState('todas'), filter = _d[0], setFilter = _d[1];
  var _e = useState(''), searchTerm = _e[0], setSearchTerm = _e[1];

  // ──────────────────────────────────────────────────────────────────────────
  // CARGAR NOTIFICACIONES
  // ──────────────────────────────────────────────────────────────────────────
  var fetchNotificaciones = async function() {
    try {
      if (notificacionesService && notificacionesService.getAll) {
        var data = await notificacionesService.getAll();
        setNotificaciones(data || []);
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      // Si no hay servicio, usar array vacío
      setNotificaciones([]);
    }
  };

  useEffect(function() {
    var loadData = async function() {
      setLoading(true);
      await fetchNotificaciones();
      setLoading(false);
    };
    loadData();
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // STATS
  // ──────────────────────────────────────────────────────────────────────────
  var stats = useMemo(function() {
    var noLeidas = notificaciones.filter(function(n) { return !n.leida; }).length;
    var urgentes = notificaciones.filter(function(n) { return n.prioridad === 'urgente' && !n.leida; }).length;
    return { noLeidas: noLeidas, urgentes: urgentes };
  }, [notificaciones]);

  // ──────────────────────────────────────────────────────────────────────────
  // FILTRAR
  // ──────────────────────────────────────────────────────────────────────────
  var filteredNotificaciones = useMemo(function() {
    return notificaciones.filter(function(n) {
      if (filter === 'no_leidas' && n.leida) return false;
      if (filter !== 'todas' && filter !== 'no_leidas' && n.tipo !== filter) return false;
      if (searchTerm) {
        var titulo = (n.titulo || '').toLowerCase();
        var mensaje = (n.mensaje || n.descripcion || '').toLowerCase();
        var search = searchTerm.toLowerCase();
        if (!titulo.includes(search) && !mensaje.includes(search)) {
          return false;
        }
      }
      return true;
    });
  }, [notificaciones, filter, searchTerm]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  var handleRefresh = async function() {
    setIsRefreshing(true);
    await fetchNotificaciones();
    setIsRefreshing(false);
  };

  var handleMarcarLeida = async function(id) {
    try {
      if (notificacionesService && notificacionesService.marcarLeida) {
        await notificacionesService.marcarLeida(id);
      }
      setNotificaciones(function(prev) {
        return prev.map(function(n) { 
          return n.id === id ? Object.assign({}, n, { leida: true }) : n; 
        });
      });
    } catch (err) {
      apiError(err);
    }
  };

  var handleMarcarTodasLeidas = async function() {
    try {
      if (notificacionesService && notificacionesService.marcarTodasLeidas) {
        await notificacionesService.marcarTodasLeidas();
      }
      setNotificaciones(function(prev) {
        return prev.map(function(n) { 
          return Object.assign({}, n, { leida: true }); 
        });
      });
      success('Todas las notificaciones marcadas como leídas');
    } catch (err) {
      apiError(err);
    }
  };

  var handleEliminar = async function(id) {
    try {
      if (notificacionesService && notificacionesService.eliminar) {
        await notificacionesService.eliminar(id);
      }
      setNotificaciones(function(prev) { 
        return prev.filter(function(n) { return n.id !== id; }); 
      });
      success('Notificación eliminada');
    } catch (err) {
      apiError(err);
    }
  };

  var handleEliminarLeidas = async function() {
    try {
      if (notificacionesService && notificacionesService.eliminarLeidas) {
        await notificacionesService.eliminarLeidas();
      }
      setNotificaciones(function(prev) { 
        return prev.filter(function(n) { return !n.leida; }); 
      });
      success('Notificaciones leídas eliminadas');
    } catch (err) {
      apiError(err);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader notificationCount={stats.noLeidas} />

      <main className="pt-28 px-4 pb-8 max-w-4xl mx-auto">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Notificaciones</h1>
            <p className="text-slate-500 mt-1">
              {stats.noLeidas > 0 
                ? 'Tienes ' + stats.noLeidas + ' notificación' + (stats.noLeidas > 1 ? 'es' : '') + ' sin leer'
                : 'Todas las notificaciones leídas'
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              icon={RefreshCw} 
              onClick={handleRefresh}
              loading={isRefreshing}
              title="Actualizar"
            />
            {stats.noLeidas > 0 && (
              <Button variant="outline" icon={CheckCheck} onClick={handleMarcarTodasLeidas}>
                Marcar todas leídas
              </Button>
            )}
            <Button variant="outline" icon={Settings} onClick={function() { navigate('/configuracion'); }}>
              Configurar
            </Button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ALERTA URGENTES */}
        {/* ════════════════════════════════════════════════════════════════ */}
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
            <Button 
              variant="danger" 
              size="sm"
              onClick={function() { setFilter('alerta'); }}
            >
              Ver Urgentes
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FILTROS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={function() { setSearchTerm(''); }}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {FILTER_OPTIONS.map(function(opt) {
                var Icon = opt.icon;
                var isActive = filter === opt.value;
                var count = opt.value === 'no_leidas' 
                  ? stats.noLeidas 
                  : opt.value === 'todas'
                    ? notificaciones.length
                    : notificaciones.filter(function(n) { return n.tipo === opt.value; }).length;

                return (
                  <button
                    key={opt.value}
                    onClick={function() { setFilter(opt.value); }}
                    className={
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ' +
                      (isActive 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                    {count > 0 && (
                      <span className={
                        'px-1.5 py-0.5 text-xs rounded-full ' +
                        (isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600')
                      }>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* LISTA DE NOTIFICACIONES */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map(function(i) {
              return (
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
              );
            })}
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
              {filteredNotificaciones.map(function(notificacion) {
                return (
                  <NotificacionCard
                    key={notificacion.id}
                    notificacion={notificacion}
                    onMarcarLeida={handleMarcarLeida}
                    onEliminar={handleEliminar}
                  />
                );
              })}
            </div>

            {/* Acciones masivas */}
            {notificaciones.some(function(n) { return n.leida; }) && (
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

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>
    </div>
  );
};

export default Notificaciones;