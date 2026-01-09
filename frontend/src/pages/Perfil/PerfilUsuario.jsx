/**
 * ============================================================================
 * ISTHO CRM - PerfilUsuario (CORREGIDO)
 * ============================================================================
 * Página de perfil de usuario conectada al backend real.
 * 
 * CORRECCIONES:
 * - useAuth desestructurado correctamente
 * - usuarioService.getPermisos() usa estructura correcta
 * - Eliminadas llamadas a métodos inexistentes
 * - Permisos mostrados desde rol del usuario
 * 
 * @author Coordinación TI ISTHO
 * @version 2.1.0
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
import authService from '../../api/auth.service';
import usuarioService from '../../api/usuarioService';

// ════════════════════════════════════════════════════════════════════════════
// MODAL EDITAR PERFIL
// ════════════════════════════════════════════════════════════════════════════
const EditProfileModal = ({ isOpen, onClose, usuario, onSave, loading }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
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
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
            <input
              type="text"
              value={formData.apellido || ''}
              onChange={(e) => handleChange('apellido', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={formData.telefono || ''}
            onChange={(e) => handleChange('telefono', e.target.value)}
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
const ChangePasswordModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = () => {
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

  useEffect(() => {
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
            onChange={(e) => handleChange('currentPassword', e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
          <input
            type="password"
            value={formData.newPassword}
            onChange={(e) => handleChange('newPassword', e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
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

const StatCardMini = ({ icon: Icon, label, value, color }) => (
  <div className="text-center p-4 bg-slate-50 rounded-xl">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-xl font-bold text-slate-800">{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const PerfilUsuario = () => {
  const navigate = useNavigate();
  
  // ✅ CORREGIDO: Desestructurar solo las propiedades que existen en useAuth
  const { user, logout, updateUser } = useAuth();
  const { success, error: apiError } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ──────────────────────────────────────────────────────────────────────────
  const [permisos, setPermisos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  
  // Modals
  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // CARGAR PERMISOS
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ✅ CORREGIDO: Usar getPermisos que genera permisos localmente
        const permisosResponse = await usuarioService.getPermisos();
        if (permisosResponse.success && permisosResponse.data) {
          setPermisos(permisosResponse.data);
        }
      } catch (err) {
        console.error('Error cargando permisos:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  const handleSaveProfile = async (data) => {
    setFormLoading(true);
    try {
      // ✅ CORREGIDO: Llamar al backend para persistir los cambios
      const response = await usuarioService.actualizarPerfil(data);
      
      if (response.success) {
        // Actualizar también el estado local/contexto
        if (updateUser) {
          updateUser(response.data || data);
        }
        success('Perfil actualizado correctamente');
        setEditModal(false);
      } else {
        throw new Error(response.message || 'Error al actualizar perfil');
      }
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePassword = async (data) => {
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const calcularAntiguedad = (fechaIngreso) => {
    if (!fechaIngreso) return '-';
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diff = hoy - ingreso;
    const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''}, ${months} mes${months > 1 ? 'es' : ''}`;
    }
    return `${months} mes${months > 1 ? 'es' : ''}`;
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
  
  const tabs = [
    { id: 'info', label: 'Información' },
    { id: 'permisos', label: 'Permisos' },
  ];

  // ✅ CORREGIDO: Convertir permisos a formato tabla
  const permisosTabla = permisos?.permisos 
    ? Object.entries(permisos.permisos).map(([modulo, acciones]) => ({
        modulo: modulo.charAt(0).toUpperCase() + modulo.slice(1),
        ver: acciones.includes('ver'),
        crear: acciones.includes('crear'),
        editar: acciones.includes('editar'),
        eliminar: acciones.includes('eliminar'),
        exportar: acciones.includes('exportar'),
      }))
    : [
        { modulo: 'Dashboard', ver: true, crear: false, editar: false, eliminar: false },
        { modulo: 'Clientes', ver: true, crear: false, editar: false, eliminar: false },
        { modulo: 'Inventario', ver: true, crear: false, editar: false, eliminar: false },
        { modulo: 'Operaciones', ver: true, crear: false, editar: false, eliminar: false },
        { modulo: 'Reportes', ver: true, crear: false, editar: false, eliminar: false },
      ];

  // Estadísticas calculadas localmente
  const stats = {
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
                  <span className="capitalize">{user.rol || 'Usuario'}</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" icon={Key} onClick={() => setPasswordModal(true)}>
                Cambiar Contraseña
              </Button>
              <Button variant="primary" icon={Pencil} onClick={() => setEditModal(true)}>
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
            label="Operaciones" 
            value={stats.despachosCreados} 
            color="bg-blue-500"
          />
          <StatCardMini 
            icon={User} 
            label="Clientes" 
            value={stats.clientesGestionados} 
            color="bg-emerald-500"
          />
          <StatCardMini 
            icon={FileText} 
            label="Reportes" 
            value={stats.reportesGenerados} 
            color="bg-violet-500"
          />
          <StatCardMini 
            icon={Award} 
            label="Días Activo" 
            value={stats.diasActivo} 
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
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-4 text-sm font-medium transition-colors relative ${
                        activeTab === tab.id ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'
                      }`}
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
                            <p className="text-slate-500">Empresa</p>
                            <p className="font-medium text-slate-800">ISTHO S.A.S</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Sede</p>
                            <p className="font-medium text-slate-800">Centro Logístico Industrial del Norte</p>
                            <p className="text-xs text-slate-400">Girardota, Antioquia</p>
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
                          {permisos?.rol || user.rol || 'Usuario'}
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
                          {permisosTabla.map((permiso, idx) => (
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
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                <Button 
                  variant="ghost" 
                  icon={Bell} 
                  fullWidth 
                  className="justify-start"
                  onClick={() => navigate('/notificaciones')}
                >
                  Configurar Notificaciones
                </Button>
                <Button 
                  variant="ghost" 
                  icon={Key} 
                  fullWidth 
                  className="justify-start" 
                  onClick={() => setPasswordModal(true)}
                >
                  Cambiar Contraseña
                </Button>
                <Button 
                  variant="ghost" 
                  icon={Shield} 
                  fullWidth 
                  className="justify-start"
                  onClick={() => setActiveTab('permisos')}
                >
                  Ver Permisos
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
        onClose={() => setEditModal(false)}
        usuario={user}
        onSave={handleSaveProfile}
        loading={formLoading}
      />

      <ChangePasswordModal
        isOpen={passwordModal}
        onClose={() => setPasswordModal(false)}
        onSubmit={handleChangePassword}
        loading={formLoading}
      />
    </div>
  );
};

export default PerfilUsuario;