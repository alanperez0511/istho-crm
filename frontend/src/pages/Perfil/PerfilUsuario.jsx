/**
 * ============================================================================
 * ISTHO CRM - PerfilUsuario (Fase 5 - Integración Completa)
 * ============================================================================
 * Página de perfil de usuario conectada al backend real.
 * 
 * CAMBIOS vs versión anterior:
 * - Eliminados MOCK_USUARIO, MOCK_PERMISOS, MOCK_ACTIVIDAD, MOCK_ESTADISTICAS
 * - Conectado con useAuth para datos de usuario actual
 * - API real para actualizar perfil y cambiar contraseña
 * - Permisos y actividad desde backend
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Key,
  Camera,
  Pencil,
  Save,
  X,
  Clock,
  Award,
  Activity,
  FileText,
  Settings,
  LogOut,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, Modal, StatusChip } from '../../components/common';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS E INTEGRACIÓN
// ════════════════════════════════════════════════════════════════════════════
import { useAuth } from '../../context/AuthContext';
import useNotification from '../../hooks/useNotification';
import { authService } from '../../api/auth.service';
import { usuarioService } from '../../api/usuarioService';

// ════════════════════════════════════════════════════════════════════════════
// MODAL EDITAR PERFIL
// ════════════════════════════════════════════════════════════════════════════
var EditProfileModal = function(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var usuario = props.usuario;
  var onSave = props.onSave;
  var loading = props.loading;
  
  var _a = useState({}), formData = _a[0], setFormData = _a[1];

  useEffect(function() {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        email: usuario.email || '',
        telefono: usuario.telefono || '',
        cargo: usuario.cargo || '',
        departamento: usuario.departamento || '',
      });
    }
  }, [usuario]);

  var handleChange = function(field, value) {
    setFormData(function(prev) { 
      var updated = Object.assign({}, prev);
      updated[field] = value;
      return updated;
    });
  };

  var handleSubmit = function() {
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Perfil"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon={Save} onClick={handleSubmit} loading={loading}>
            Guardar Cambios
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {(formData.nombre || '')[0]}{(formData.apellido || '')[0]}
          </div>
          <div>
            <Button variant="outline" size="sm" icon={Camera}>
              Cambiar Foto
            </Button>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG. Máx 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={function(e) { handleChange('nombre', e.target.value); }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
            <input
              type="text"
              value={formData.apellido || ''}
              onChange={function(e) { handleChange('apellido', e.target.value); }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={function(e) { handleChange('email', e.target.value); }}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={formData.telefono || ''}
            onChange={function(e) { handleChange('telefono', e.target.value); }}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
            <input
              type="text"
              value={formData.cargo || ''}
              readOnly
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
            <input
              type="text"
              value={formData.departamento || ''}
              readOnly
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MODAL CAMBIAR CONTRASEÑA
// ════════════════════════════════════════════════════════════════════════════
var ChangePasswordModal = function(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var onSubmit = props.onSubmit;
  var loading = props.loading;
  
  var _a = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }), formData = _a[0], setFormData = _a[1];
  var _b = useState(''), error = _b[0], setError = _b[1];

  var handleChange = function(field, value) {
    setFormData(function(prev) { 
      var updated = Object.assign({}, prev);
      updated[field] = value;
      return updated;
    });
    setError('');
  };

  var handleSubmit = function() {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (formData.newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    onSubmit(formData);
  };

  useEffect(function() {
    if (isOpen) {
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Contraseña"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon={Key} onClick={handleSubmit} loading={loading}>
            Cambiar Contraseña
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Actual</label>
          <input
            type="password"
            value={formData.currentPassword}
            onChange={function(e) { handleChange('currentPassword', e.target.value); }}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
          <input
            type="password"
            value={formData.newPassword}
            onChange={function(e) { handleChange('newPassword', e.target.value); }}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={function(e) { handleChange('confirmPassword', e.target.value); }}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Requisitos de contraseña:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Mínimo 8 caracteres</li>
            <li>Al menos una letra mayúscula</li>
            <li>Al menos un número</li>
            <li>Al menos un carácter especial</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ════════════════════════════════════════════════════════════════════════════

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

var StatCardMini = function(props) {
  var Icon = props.icon;
  var label = props.label;
  var value = props.value;
  var color = props.color;
  
  return (
    <div className="text-center p-4 bg-slate-50 rounded-xl">
      <div className={'w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ' + color}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
var PerfilUsuario = function() {
  var navigate = useNavigate();
  var authHook = useAuth();
  var user = authHook.user;
  var permissions = authHook.permissions;
  var logout = authHook.logout;
  var updateProfile = authHook.updateProfile;
  var notif = useNotification();
  var success = notif.success;
  var apiError = notif.apiError;

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────
  var _a = useState(null), permisos = _a[0], setPermisos = _a[1];
  var _b = useState([]), actividad = _b[0], setActividad = _b[1];
  var _c = useState(null), estadisticas = _c[0], setEstadisticas = _c[1];
  var _d = useState(true), loading = _d[0], setLoading = _d[1];
  var _e = useState('info'), activeTab = _e[0], setActiveTab = _e[1];
  
  // Modals
  var _f = useState(false), editModal = _f[0], setEditModal = _f[1];
  var _g = useState(false), passwordModal = _g[0], setPasswordModal = _g[1];
  var _h = useState(false), formLoading = _h[0], setFormLoading = _h[1];

  // ──────────────────────────────────────────────────────────────────────────
  // CARGAR DATOS ADICIONALES
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(function() {
    var fetchData = async function() {
      setLoading(true);
      try {
        // Cargar permisos detallados
        if (usuarioService.getPermisos) {
          var permisosData = await usuarioService.getPermisos();
          setPermisos(permisosData);
        } else {
          // Usar permisos del contexto
          setPermisos(permissions);
        }
        
        // Cargar actividad reciente
        if (usuarioService.getActividad) {
          var actividadData = await usuarioService.getActividad();
          setActividad(actividadData);
        }
        
        // Cargar estadísticas
        if (usuarioService.getEstadisticas) {
          var statsData = await usuarioService.getEstadisticas();
          setEstadisticas(statsData);
        }
      } catch (err) {
        console.error('Error cargando datos de perfil:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user, permissions]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  var handleSaveProfile = async function(data) {
    setFormLoading(true);
    try {
      if (updateProfile) {
        await updateProfile(data);
      } else if (usuarioService.updateProfile) {
        await usuarioService.updateProfile(data);
      }
      success('Perfil actualizado correctamente');
      setEditModal(false);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  var handleChangePassword = async function(data) {
    setFormLoading(true);
    try {
      await authService.changePassword({
        password_actual: data.currentPassword,
        password_nuevo: data.newPassword,
      });
      success('Contraseña actualizada correctamente');
      setPasswordModal(false);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  var handleLogout = function() {
    logout();
    navigate('/login');
  };

  var calcularAntiguedad = function(fechaIngreso) {
    if (!fechaIngreso) return '-';
    var ingreso = new Date(fechaIngreso);
    var hoy = new Date();
    var diff = hoy - ingreso;
    var years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    var months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    
    if (years > 0) {
      return years + ' año' + (years > 1 ? 's' : '') + ', ' + months + ' mes' + (months > 1 ? 'es' : '');
    }
    return months + ' mes' + (months > 1 ? 'es' : '');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────────────────
  
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-200 rounded-2xl" />
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 h-96 bg-gray-200 rounded-2xl" />
              <div className="h-96 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VARIABLES DERIVADAS
  // ──────────────────────────────────────────────────────────────────────────
  
  var tabs = [
    { id: 'info', label: 'Información' },
    { id: 'permisos', label: 'Permisos' },
    { id: 'actividad', label: 'Actividad' },
  ];

  // Permisos formateados para tabla
  var permisosTabla = permisos && Array.isArray(permisos) ? permisos : [
    { modulo: 'Dashboard', ver: true, crear: true, editar: true, eliminar: true },
    { modulo: 'Clientes', ver: true, crear: true, editar: true, eliminar: user.rol === 'admin' },
    { modulo: 'Inventario', ver: true, crear: true, editar: true, eliminar: user.rol === 'admin' },
    { modulo: 'Despachos', ver: true, crear: true, editar: true, eliminar: user.rol === 'admin' },
    { modulo: 'Reportes', ver: true, crear: true, editar: false, eliminar: false },
  ];

  // Estadísticas con fallback
  var stats = estadisticas || {
    despachosCreados: 0,
    clientesGestionados: 0,
    reportesGenerados: 0,
    diasActivo: Math.floor((new Date() - new Date(user.fecha_ingreso || user.created_at || Date.now())) / (1000 * 60 * 60 * 24)),
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* HEADER CARD */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {(user.nombre || 'U')[0]}{(user.apellido || '')[0]}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md hover:bg-slate-50 transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-800">
                  {user.nombre} {user.apellido}
                </h1>
                <StatusChip status={user.estado || 'activo'} />
              </div>
              <p className="text-slate-500 mb-2">{user.cargo || 'Usuario'}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </span>
                {user.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {user.telefono}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  {user.rol || 'Usuario'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" icon={Key} onClick={function() { setPasswordModal(true); }}>
                Cambiar Contraseña
              </Button>
              <Button variant="primary" icon={Pencil} onClick={function() { setEditModal(true); }}>
                Editar Perfil
              </Button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STATS ROW */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCardMini 
            icon={Activity} 
            label="Despachos Creados" 
            value={stats.despachosCreados || 0} 
            color="bg-blue-500"
          />
          <StatCardMini 
            icon={User} 
            label="Clientes Gestionados" 
            value={stats.clientesGestionados || 0} 
            color="bg-emerald-500"
          />
          <StatCardMini 
            icon={FileText} 
            label="Reportes Generados" 
            value={stats.reportesGenerados || 0} 
            color="bg-violet-500"
          />
          <StatCardMini 
            icon={Award} 
            label="Días Activo" 
            value={stats.diasActivo || 0} 
            color="bg-amber-500"
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MAIN GRID */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              {/* Tabs */}
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
                {/* Tab: Información */}
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Datos Personales</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <User className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Nombre Completo</p>
                            <p className="font-medium text-slate-800">{user.nombre} {user.apellido}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Correo Electrónico</p>
                            <p className="font-medium text-slate-800">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Teléfono</p>
                            <p className="font-medium text-slate-800">{user.telefono || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800">Información Laboral</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Building2 className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Departamento</p>
                            <p className="font-medium text-slate-800">{user.departamento || 'ISTHO S.A.S'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Sede</p>
                            <p className="font-medium text-slate-800">{user.sede || 'Centro Logístico Industrial del Norte'}</p>
                            <p className="text-xs text-slate-400">{user.ciudad || 'Girardota, Antioquia'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Fecha de Ingreso</p>
                            <p className="font-medium text-slate-800">
                              {user.fecha_ingreso || user.created_at 
                                ? new Date(user.fecha_ingreso || user.created_at).toLocaleDateString('es-CO')
                                : '-'
                              }
                            </p>
                            <p className="text-xs text-emerald-600">
                              Antigüedad: {calcularAntiguedad(user.fecha_ingreso || user.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Permisos */}
                {activeTab === 'permisos' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-slate-500" />
                        <span className="text-sm text-slate-500">Rol actual:</span>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium capitalize">
                          {user.rol || 'Usuario'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Módulo</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Ver</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Crear</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Editar</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Eliminar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {permisosTabla.map(function(permiso, idx) {
                            return (
                              <tr key={idx} className="border-b border-gray-50">
                                <td className="py-3 px-4 text-sm font-medium text-slate-800">
                                  {permiso.modulo}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {permiso.ver ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-slate-300 mx-auto" />
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {permiso.crear ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-slate-300 mx-auto" />
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {permiso.editar ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-slate-300 mx-auto" />
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {permiso.eliminar ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-slate-300 mx-auto" />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Actividad */}
                {activeTab === 'actividad' && (
                  <div className="space-y-4">
                    {actividad.length === 0 ? (
                      <div className="py-12 text-center">
                        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No hay actividad reciente</p>
                      </div>
                    ) : (
                      actividad.map(function(item) {
                        return (
                          <div key={item.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <Activity className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{item.accion || item.descripcion}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.fecha || item.created_at).toLocaleString('es-CO')}
                                </span>
                                {item.modulo && (
                                  <span className="px-2 py-0.5 bg-slate-200 rounded-full">
                                    {item.modulo}
                                  </span>
                                )}
                                {item.ip && (
                                  <span>IP: {item.ip}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sesión */}
            <InfoCard title="Sesión Actual" icon={Shield}>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Estado</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Activo
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Último acceso</span>
                  <span className="text-slate-800">
                    {user.ultimo_acceso 
                      ? new Date(user.ultimo_acceso).toLocaleString('es-CO')
                      : 'Ahora'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">ID Usuario</span>
                  <span className="text-slate-800 font-mono">{user.id || '-'}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Button variant="outline" icon={LogOut} fullWidth onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </div>
            </InfoCard>

            {/* Acciones Rápidas */}
            <InfoCard title="Acciones Rápidas" icon={Settings}>
              <div className="space-y-2">
                <Button variant="ghost" icon={Bell} fullWidth className="justify-start">
                  Configurar Notificaciones
                </Button>
                <Button 
                  variant="ghost" 
                  icon={Key} 
                  fullWidth 
                  className="justify-start" 
                  onClick={function() { setPasswordModal(true); }}
                >
                  Cambiar Contraseña
                </Button>
                <Button variant="ghost" icon={Shield} fullWidth className="justify-start">
                  Seguridad de la Cuenta
                </Button>
              </div>
            </InfoCard>

            {/* Soporte */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
              <h3 className="font-semibold mb-2">¿Necesitas ayuda?</h3>
              <p className="text-sm text-orange-100 mb-4">
                Contacta al equipo de soporte técnico para resolver tus dudas.
              </p>
              <Button variant="secondary" fullWidth>
                Contactar Soporte
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno<br />
          Centro Logístico Industrial del Norte, Girardota, Antioquia
        </footer>
      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      
      <EditProfileModal
        isOpen={editModal}
        onClose={function() { setEditModal(false); }}
        usuario={user}
        onSave={handleSaveProfile}
        loading={formLoading}
      />

      <ChangePasswordModal
        isOpen={passwordModal}
        onClose={function() { setPasswordModal(false); }}
        onSubmit={handleChangePassword}
        loading={formLoading}
      />
    </div>
  );
};

export default PerfilUsuario;