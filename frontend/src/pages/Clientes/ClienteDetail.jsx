/**
 * ============================================================================
 * ISTHO CRM - ClienteDetail (Fase 5 - Integración Completa)
 * ============================================================================
 * Vista de detalle del cliente conectada al backend real.
 * 
 * CAMBIOS vs versión anterior:
 * - Eliminados MOCK_CLIENTE, MOCK_CONTACTOS, MOCK_HISTORIAL
 * - Conectado con useClientes hook (fetchById, contactos, historial)
 * - CRUD real de contactos
 * - Integrado con sistema de notificaciones
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Calendar,
  Pencil,
  Trash2,
  Plus,
  User,
  Truck,
  Clock,
  MessageSquare,
  FileCheck,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, StatusChip, KpiCard, ConfirmDialog, Modal } from '../../components/common';

// Local Components
import ClienteForm from './components/ClienteForm';

// ════════════════════════════════════════════════════════════════════════════
// HOOKS INTEGRADOS
// ════════════════════════════════════════════════════════════════════════════
import useClientes from '../../hooks/useClientes';
import useNotification from '../../hooks/useNotification';
import { useAuth } from '../../context/AuthContext';
import { ProtectedAction } from '../../components/auth/PrivateRoute';

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tarjeta de contacto
 */
const ContactCard = ({ contacto, onEdit, onDelete, canEdit }) => (
  <div className={
    'p-4 rounded-xl border transition-colors ' +
    (contacto.es_principal ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-white hover:bg-slate-50')
  }>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className={
          'w-10 h-10 rounded-full flex items-center justify-center ' +
          (contacto.es_principal ? 'bg-orange-200' : 'bg-slate-200')
        }>
          <User className={'w-5 h-5 ' + (contacto.es_principal ? 'text-orange-700' : 'text-slate-600')} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-800">{contacto.nombre}</p>
            {contacto.es_principal && (
              <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">
                Principal
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{contacto.cargo}</p>
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-1">
          <button
            onClick={() => onEdit && onEdit(contacto)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete && onDelete(contacto)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
    <div className="mt-3 space-y-1.5 text-sm">
      <div className="flex items-center gap-2 text-slate-600">
        <Phone className="w-4 h-4 text-slate-400" />
        {contacto.telefono}
      </div>
      <div className="flex items-center gap-2 text-slate-600">
        <Mail className="w-4 h-4 text-slate-400" />
        {contacto.email}
      </div>
    </div>
  </div>
);

/**
 * Item de actividad/historial
 */
const ActivityItem = ({ actividad }) => {
  const iconConfig = {
    operacion: { icon: Truck, bg: 'bg-blue-100', color: 'text-blue-600' },
    despacho: { icon: Truck, bg: 'bg-blue-100', color: 'text-blue-600' },
    llamada: { icon: Phone, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    documento: { icon: FileCheck, bg: 'bg-violet-100', color: 'text-violet-600' },
    nota: { icon: MessageSquare, bg: 'bg-amber-100', color: 'text-amber-600' },
    creacion: { icon: Building2, bg: 'bg-slate-100', color: 'text-slate-600' },
    actualizacion: { icon: Pencil, bg: 'bg-orange-100', color: 'text-orange-600' },
  };

  const config = iconConfig[actividad.tipo] || iconConfig.nota;
  const Icon = config.icon;

  return (
    <div className="flex gap-4">
      <div className={'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ' + config.bg}>
        <Icon className={'w-5 h-5 ' + config.color} />
      </div>
      <div className="flex-1 pb-6 border-b border-gray-100 last:border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-slate-800">{actividad.titulo || actividad.accion}</p>
            <p className="text-sm text-slate-500 mt-0.5">{actividad.descripcion || actividad.detalle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(actividad.fecha || actividad.created_at).toLocaleString('es-CO')}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {actividad.usuario || actividad.usuario_nombre || 'Sistema'}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal de formulario de contacto
 */
const ContactoFormModal = ({ isOpen, onClose, onSubmit, contacto, loading }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData(contacto || { es_principal: false });
  }, [contacto, isOpen]);

  const handleChange = (field, value) => {
    setFormData(function(prev) { return Object.assign({}, prev, { [field]: value }); });
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contacto ? 'Editar Contacto' : 'Nuevo Contacto'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {contacto ? 'Guardar' : 'Agregar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nombre || ''}
            onChange={function(e) { handleChange('nombre', e.target.value); }}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            placeholder="Nombre del contacto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Cargo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.cargo || ''}
            onChange={function(e) { handleChange('cargo', e.target.value); }}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            placeholder="Cargo en la empresa"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.telefono || ''}
            onChange={function(e) { handleChange('telefono', e.target.value); }}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            placeholder="+57 300 123 4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={function(e) { handleChange('email', e.target.value); }}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            placeholder="email@empresa.com"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.es_principal || false}
            onChange={function(e) { handleChange('es_principal', e.target.checked); }}
            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-slate-700">Contacto principal</span>
        </label>
      </div>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const ClienteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { success, apiError, contactoAgregado, deleted } = useNotification();

  // ──────────────────────────────────────────────────────────────────────────
  // HOOK DE CLIENTES
  // ──────────────────────────────────────────────────────────────────────────
  const {
    // Cliente actual
    currentCliente: cliente,
    loading,
    error,
    // Contactos
    contactos,
    loadingContactos,
    // Historial
    historial,
    loadingHistorial,
    // Acciones
    fetchById,
    fetchContactos,
    fetchHistorial,
    updateCliente,
    deleteCliente,
    // Contactos CRUD
    createContacto,
    updateContacto,
    deleteContacto,
  } = useClientes({ autoFetch: false });

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADOS LOCALES
  // ──────────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('info');
  
  // Modals
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [contactoModal, setContactoModal] = useState({ isOpen: false, contacto: null });
  const [deleteContactoModal, setDeleteContactoModal] = useState({ isOpen: false, contacto: null });
  const [formLoading, setFormLoading] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // CARGAR DATOS
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      fetchById(id);
      fetchContactos(id);
      fetchHistorial(id);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  const handleEditCliente = async (data) => {
    setFormLoading(true);
    try {
      await updateCliente(id, data);
      success('Cliente actualizado correctamente');
      setEditModal(false);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCliente = async () => {
    setFormLoading(true);
    try {
      await deleteCliente(id);
      deleted('Cliente');
      navigate('/clientes');
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveContacto = async (data) => {
    setFormLoading(true);
    try {
      if (contactoModal.contacto) {
        await updateContacto(id, contactoModal.contacto.id, data);
        success('Contacto actualizado');
      } else {
        await createContacto(id, data);
        contactoAgregado();
      }
      setContactoModal({ isOpen: false, contacto: null });
      // Refrescar contactos
      fetchContactos(id);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteContacto = async () => {
    setFormLoading(true);
    try {
      await deleteContacto(id, deleteContactoModal.contacto.id);
      deleted('Contacto');
      setDeleteContactoModal({ isOpen: false, contacto: null });
      fetchContactos(id);
    } catch (err) {
      apiError(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // FORMATTERS
  // ──────────────────────────────────────────────────────────────────────────
  
  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
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
            <div className="grid grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(function(i) {
                return <div key={i} className="h-32 bg-gray-200 rounded-2xl" />;
              })}
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ERROR STATE
  // ──────────────────────────────────────────────────────────────────────────
  
  if (error || !cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Cliente no encontrado</h2>
            <p className="text-slate-500 mb-4">{error || 'El cliente solicitado no existe'}</p>
            <Button variant="primary" onClick={function() { navigate('/clientes'); }}>
              Volver a Clientes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  
  const tabs = [
    { id: 'info', label: 'Información' },
    { id: 'contactos', label: 'Contactos (' + contactos.length + ')' },
    { id: 'historial', label: 'Historial' },
  ];

  const canEdit = hasPermission('clientes', 'editar');
  const canDelete = hasPermission('clientes', 'eliminar');

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
              onClick={function() { navigate('/clientes'); }}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-800">{cliente.razon_social}</h1>
                  <StatusChip status={cliente.estado} />
                </div>
                <p className="text-slate-500">NIT: {cliente.nit}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canEdit && (
              <Button variant="outline" icon={Pencil} onClick={function() { setEditModal(true); }}>
                Editar
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" icon={Trash2} onClick={function() { setDeleteModal(true); }}>
                Eliminar
              </Button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* KPIs */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Operaciones del Mes"
            value={cliente.operaciones_mes || 0}
            icon={Truck}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Facturación del Mes"
            value={formatCurrency(cliente.facturacion_mes)}
            icon={DollarSign}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Productos en Bodega"
            value={cliente.productos_en_bodega || 0}
            icon={FileText}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
          <KpiCard
            title="Contactos"
            value={contactos.length}
            icon={User}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TABS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información General */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800">Información General</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Tipo:</span>
                      <span className="text-slate-800 capitalize">{cliente.tipo_cliente || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Sector:</span>
                      <span className="text-slate-800 capitalize">{cliente.sector || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Cliente desde:</span>
                      <span className="text-slate-800">
                        {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('es-CO') : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800">Contacto</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-800">{cliente.direccion || '-'}</p>
                        <p className="text-slate-500">{cliente.ciudad}, {cliente.departamento}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800">{cliente.telefono || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800">{cliente.email || '-'}</span>
                    </div>
                    {cliente.sitio_web && (
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="w-5 h-5 text-slate-400" />
                        <a href={cliente.sitio_web} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                          {cliente.sitio_web}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información Comercial */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800">Información Comercial</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Límite crédito:</span>
                      <span className="text-slate-800">{formatCurrency(cliente.limite_credito)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Plazo pago:</span>
                      <span className="text-slate-800">{cliente.plazo_pago || 30} días</span>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                {cliente.observaciones && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800">Observaciones</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">
                      {cliente.observaciones}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Contactos */}
            {activeTab === 'contactos' && (
              <div>
                {canEdit && (
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="primary"
                      icon={Plus}
                      size="sm"
                      onClick={function() { setContactoModal({ isOpen: true, contacto: null }); }}
                    >
                      Agregar Contacto
                    </Button>
                  </div>
                )}
                
                {loadingContactos ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[0, 1, 2].map(function(i) {
                      return (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                      );
                    })}
                  </div>
                ) : contactos.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No hay contactos registrados</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contactos.map(function(contacto) {
                      return (
                        <ContactCard
                          key={contacto.id}
                          contacto={contacto}
                          canEdit={canEdit}
                          onEdit={function() { setContactoModal({ isOpen: true, contacto: contacto }); }}
                          onDelete={function() { setDeleteContactoModal({ isOpen: true, contacto: contacto }); }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Historial */}
            {activeTab === 'historial' && (
              <div>
                {loadingHistorial ? (
                  <div className="space-y-4">
                    {[0, 1, 2, 3].map(function(i) {
                      return (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                      );
                    })}
                  </div>
                ) : historial.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No hay actividad registrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historial.map(function(actividad) {
                      return <ActivityItem key={actividad.id} actividad={actividad} />;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 mt-8 text-slate-500 text-sm border-t border-gray-200">
          © 2026 ISTHO S.A.S. - Sistema CRM Interno
        </footer>
      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      
      <ClienteForm
        isOpen={editModal}
        onClose={function() { setEditModal(false); }}
        onSubmit={handleEditCliente}
        cliente={cliente}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteModal}
        onClose={function() { setDeleteModal(false); }}
        onConfirm={handleDeleteCliente}
        title="Eliminar Cliente"
        message={'¿Estás seguro de eliminar "' + cliente.razon_social + '"? Esta acción eliminará todos los datos asociados.'}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />

      <ContactoFormModal
        isOpen={contactoModal.isOpen}
        onClose={function() { setContactoModal({ isOpen: false, contacto: null }); }}
        onSubmit={handleSaveContacto}
        contacto={contactoModal.contacto}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteContactoModal.isOpen}
        onClose={function() { setDeleteContactoModal({ isOpen: false, contacto: null }); }}
        onConfirm={handleDeleteContacto}
        title="Eliminar Contacto"
        message={'¿Eliminar a "' + (deleteContactoModal.contacto ? deleteContactoModal.contacto.nombre : '') + '" de los contactos?'}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default ClienteDetail;