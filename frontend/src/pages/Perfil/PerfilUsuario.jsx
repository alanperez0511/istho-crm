/**
 * ISTHO CRM - PerfilUsuario Page
 * Página de perfil de usuario con información personal y configuración
 * 
 * @author Coordinación TI ISTHO
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
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, Modal, StatusChip } from '../../components/common';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_USUARIO = {
  id: 'USR-001',
  nombre: 'Carlos',
  apellido: 'Martínez',
  email: 'carlos.martinez@istho.com.co',
  telefono: '+57 300 123 4567',
  cargo: 'Coordinador de Tecnología',
  departamento: 'Tecnología e Innovación',
  sede: 'Centro Logístico Industrial del Norte',
  ciudad: 'Girardota, Antioquia',
  fechaIngreso: '2023-03-15',
  rol: 'Administrador',
  estado: 'activo',
  ultimoAcceso: '2026-01-08 10:45',
  avatar: null,
};

const MOCK_PERMISOS = [
  { modulo: 'Dashboard', ver: true, crear: true, editar: true, eliminar: true },
  { modulo: 'Clientes', ver: true, crear: true, editar: true, eliminar: true },
  { modulo: 'Inventario', ver: true, crear: true, editar: true, eliminar: true },
  { modulo: 'Despachos', ver: true, crear: true, editar: true, eliminar: true },
  { modulo: 'Trazabilidad', ver: true, crear: true, editar: true, eliminar: false },
  { modulo: 'Reportes', ver: true, crear: true, editar: false, eliminar: false },
  { modulo: 'Configuración', ver: true, crear: true, editar: true, eliminar: true },
];

const MOCK_ACTIVIDAD = [
  { id: 1, accion: 'Inicio de sesión', fecha: '2026-01-08 10:45', ip: '192.168.1.100' },
  { id: 2, accion: 'Creó despacho DSP-156', fecha: '2026-01-08 09:30', modulo: 'Despachos' },
  { id: 3, accion: 'Editó cliente CLI-001', fecha: '2026-01-07 16:20', modulo: 'Clientes' },
  { id: 4, accion: 'Generó reporte de inventario', fecha: '2026-01-07 14:15', modulo: 'Reportes' },
  { id: 5, accion: 'Actualizó producto PRD-005', fecha: '2026-01-07 11:00', modulo: 'Inventario' },
];

const MOCK_ESTADISTICAS = {
  despachosCreados: 45,
  clientesGestionados: 12,
  reportesGenerados: 28,
  diasActivo: 324,
};

// ============================================
// EDIT PROFILE MODAL
// ============================================
const EditProfileModal = ({ isOpen, onClose, usuario, onSave }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setFormData({ ...usuario });
    }
  }, [usuario]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    onSave(formData);
    setLoading(false);
    onClose();
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
            {formData.nombre?.[0]}{formData.apellido?.[0]}
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

// ============================================
// CHANGE PASSWORD MODAL
// ============================================
const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (formData.newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    onClose();
  };

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
// STAT CARD MINI
// ============================================
const StatCardMini = ({ icon: Icon, label, value, color }) => (
  <div className="text-center p-4 bg-slate-50 rounded-xl">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-xl font-bold text-slate-800">{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const PerfilUsuario = () => {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  
  // Modals
  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setUsuario(MOCK_USUARIO);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveProfile = (data) => {
    setUsuario(data);
  };

  const calcularAntiguedad = (fechaIngreso) => {
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

  if (loading) {
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

  const tabs = [
    { id: 'info', label: 'Información' },
    { id: 'permisos', label: 'Permisos' },
    { id: 'actividad', label: 'Actividad' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {usuario.nombre[0]}{usuario.apellido[0]}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md hover:bg-slate-50 transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-800">
                  {usuario.nombre} {usuario.apellido}
                </h1>
                <StatusChip status={usuario.estado} />
              </div>
              <p className="text-slate-500 mb-2">{usuario.cargo}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {usuario.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {usuario.telefono}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  {usuario.rol}
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCardMini 
            icon={Activity} 
            label="Despachos Creados" 
            value={MOCK_ESTADISTICAS.despachosCreados} 
            color="bg-blue-500"
          />
          <StatCardMini 
            icon={User} 
            label="Clientes Gestionados" 
            value={MOCK_ESTADISTICAS.clientesGestionados} 
            color="bg-emerald-500"
          />
          <StatCardMini 
            icon={FileText} 
            label="Reportes Generados" 
            value={MOCK_ESTADISTICAS.reportesGenerados} 
            color="bg-violet-500"
          />
          <StatCardMini 
            icon={Award} 
            label="Días Activo" 
            value={MOCK_ESTADISTICAS.diasActivo} 
            color="bg-amber-500"
          />
        </div>

        {/* Main Grid */}
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
                            <p className="font-medium text-slate-800">{usuario.nombre} {usuario.apellido}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Correo Electrónico</p>
                            <p className="font-medium text-slate-800">{usuario.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Teléfono</p>
                            <p className="font-medium text-slate-800">{usuario.telefono}</p>
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
                            <p className="font-medium text-slate-800">{usuario.departamento}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Sede</p>
                            <p className="font-medium text-slate-800">{usuario.sede}</p>
                            <p className="text-xs text-slate-400">{usuario.ciudad}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-slate-500">Fecha de Ingreso</p>
                            <p className="font-medium text-slate-800">{usuario.fechaIngreso}</p>
                            <p className="text-xs text-emerald-600">Antigüedad: {calcularAntiguedad(usuario.fechaIngreso)}</p>
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
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          {usuario.rol}
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
                          {MOCK_PERMISOS.map((permiso, idx) => (
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

                {/* Tab: Actividad */}
                {activeTab === 'actividad' && (
                  <div className="space-y-4">
                    {MOCK_ACTIVIDAD.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Activity className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{item.accion}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.fecha}
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
                    ))}
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
                  <span className="text-slate-800">{usuario.ultimoAcceso}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">ID Usuario</span>
                  <span className="text-slate-800 font-mono">{usuario.id}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Button variant="outline" icon={LogOut} fullWidth>
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
                <Button variant="ghost" icon={Key} fullWidth className="justify-start" onClick={() => setPasswordModal(true)}>
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
      </main>

      {/* Modals */}
      <EditProfileModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        usuario={usuario}
        onSave={handleSaveProfile}
      />

      <ChangePasswordModal
        isOpen={passwordModal}
        onClose={() => setPasswordModal(false)}
      />
    </div>
  );
};

export default PerfilUsuario;