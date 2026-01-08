/**
 * ISTHO CRM - ClienteDetail Page
 * Vista de detalle completa del cliente
 * 
 * @author Coordinación TI ISTHO
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
} from 'lucide-react';

// Layout
import FloatingHeader from '../../components/layout/FloatingHeader';

// Components
import { Button, StatusChip, KpiCard, ConfirmDialog, Modal } from '../../components/common';

// Local Components
import ClienteForm from './components/ClienteForm';

// ============================================
// DATOS MOCK
// ============================================
const MOCK_CLIENTE = {
  id: 'CLI-001',
  razonSocial: 'Lácteos Betania S.A.S',
  nit: '900.123.456-1',
  tipoCliente: 'corporativo',
  sector: 'alimentos',
  direccion: 'Calle 45 # 78-90, Zona Industrial',
  ciudad: 'Medellín',
  departamento: 'Antioquia',
  telefono: '+57 300 123 4567',
  email: 'contacto@lacteosb.com',
  sitioWeb: 'https://www.lacteosb.com',
  limiteCredito: 500000000,
  plazoFacturacion: 30,
  vendedorAsignado: 'Carlos Martínez',
  observaciones: 'Cliente preferencial con alto volumen de operaciones.',
  estado: 'activo',
  fechaCreacion: '2024-03-15',
  despachosMes: 45,
  facturacionMes: 125400000,
  facturacionAnual: 1504800000,
};

const MOCK_CONTACTOS = [
  { id: 1, nombre: 'María García', cargo: 'Gerente de Logística', telefono: '+57 300 111 2222', email: 'mgarcia@lacteosb.com', principal: true },
  { id: 2, nombre: 'Juan Rodríguez', cargo: 'Jefe de Compras', telefono: '+57 300 333 4444', email: 'jrodriguez@lacteosb.com', principal: false },
  { id: 3, nombre: 'Ana Martínez', cargo: 'Coordinadora de Calidad', telefono: '+57 300 555 6666', email: 'amartinez@lacteosb.com', principal: false },
];

const MOCK_HISTORIAL = [
  { id: 1, tipo: 'despacho', titulo: 'Despacho DSP-001 completado', descripcion: 'Entrega de 450 unidades de Leche UHT x24', fecha: '2026-01-08 14:30', usuario: 'Sistema' },
  { id: 2, tipo: 'llamada', titulo: 'Llamada de seguimiento', descripcion: 'Confirmación de programación semanal de despachos', fecha: '2026-01-07 10:15', usuario: 'Carlos Martínez' },
  { id: 3, tipo: 'documento', titulo: 'Factura #F-2026-0145 generada', descripcion: 'Factura por $2,400,000 - Despacho DSP-001', fecha: '2026-01-08 15:00', usuario: 'Sistema' },
  { id: 4, tipo: 'despacho', titulo: 'Despacho DSP-002 programado', descripcion: 'Programación para 280 unidades de Yogurt Griego x12', fecha: '2026-01-06 09:00', usuario: 'María López' },
  { id: 5, tipo: 'nota', titulo: 'Nota agregada', descripcion: 'Cliente solicita ajuste en horario de entregas para próximo mes', fecha: '2026-01-05 16:45', usuario: 'Carlos Martínez' },
  { id: 6, tipo: 'despacho', titulo: 'Despacho DSP-003 completado', descripcion: 'Entrega exitosa de 320 unidades', fecha: '2026-01-04 11:20', usuario: 'Sistema' },
];

// ============================================
// INFO CARD COMPONENT
// ============================================
const InfoCard = ({ title, children, action }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ============================================
// CONTACT CARD COMPONENT
// ============================================
const ContactCard = ({ contacto, onEdit, onDelete }) => (
  <div className={`
    p-4 rounded-xl border transition-colors
    ${contacto.principal ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-white hover:bg-slate-50'}
  `}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${contacto.principal ? 'bg-orange-200' : 'bg-slate-200'}
        `}>
          <User className={`w-5 h-5 ${contacto.principal ? 'text-orange-700' : 'text-slate-600'}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-800">{contacto.nombre}</p>
            {contacto.principal && (
              <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">
                Principal
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{contacto.cargo}</p>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit?.(contacto)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete?.(contacto)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
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

// ============================================
// ACTIVITY ITEM COMPONENT
// ============================================
const ActivityItem = ({ actividad }) => {
  const iconConfig = {
    despacho: { icon: Truck, bg: 'bg-blue-100', color: 'text-blue-600' },
    llamada: { icon: Phone, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    documento: { icon: FileCheck, bg: 'bg-violet-100', color: 'text-violet-600' },
    nota: { icon: MessageSquare, bg: 'bg-amber-100', color: 'text-amber-600' },
  };

  const config = iconConfig[actividad.tipo] || iconConfig.nota;
  const Icon = config.icon;

  return (
    <div className="flex gap-4">
      <div className={`w-10 h-10 ${config.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 pb-6 border-b border-gray-100 last:border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-slate-800">{actividad.titulo}</p>
            <p className="text-sm text-slate-500 mt-0.5">{actividad.descripcion}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {actividad.fecha}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {actividad.usuario}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CONTACT FORM MODAL
// ============================================
const ContactoFormModal = ({ isOpen, onClose, onSubmit, contacto, loading }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData(contacto || { principal: false });
  }, [contacto, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
          <Button variant="primary" onClick={() => onSubmit(formData)} loading={loading}>
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
            onChange={(e) => handleChange('nombre', e.target.value)}
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
            onChange={(e) => handleChange('cargo', e.target.value)}
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
            onChange={(e) => handleChange('telefono', e.target.value)}
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
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            placeholder="email@empresa.com"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.principal || false}
            onChange={(e) => handleChange('principal', e.target.checked)}
            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-slate-700">Contacto principal</span>
        </label>
      </div>
    </Modal>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ClienteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados
  const [cliente, setCliente] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Modals
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [contactoModal, setContactoModal] = useState({ isOpen: false, contacto: null });
  const [deleteContactoModal, setDeleteContactoModal] = useState({ isOpen: false, contacto: null });
  const [formLoading, setFormLoading] = useState(false);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setCliente(MOCK_CLIENTE);
      setContactos(MOCK_CONTACTOS);
      setHistorial(MOCK_HISTORIAL);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Handlers
  const handleEditCliente = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setCliente((prev) => ({ ...prev, ...data }));
    setFormLoading(false);
    setEditModal(false);
  };

  const handleDeleteCliente = async () => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setFormLoading(false);
    setDeleteModal(false);
    navigate('/clientes');
  };

  const handleSaveContacto = async (data) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    if (contactoModal.contacto) {
      setContactos((prev) =>
        prev.map((c) => (c.id === contactoModal.contacto.id ? { ...c, ...data } : c))
      );
    } else {
      setContactos((prev) => [...prev, { ...data, id: Date.now() }]);
    }
    setFormLoading(false);
    setContactoModal({ isOpen: false, contacto: null });
  };

  const handleDeleteContacto = async () => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setContactos((prev) => prev.filter((c) => c.id !== deleteContactoModal.contacto.id));
    setFormLoading(false);
    setDeleteContactoModal({ isOpen: false, contacto: null });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <FloatingHeader />
        <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información' },
    { id: 'contactos', label: `Contactos (${contactos.length})` },
    { id: 'historial', label: 'Historial' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingHeader />

      <main className="pt-28 px-4 pb-8 max-w-7xl mx-auto">
        {/* Back & Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/clientes')}
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
                  <h1 className="text-2xl font-bold text-slate-800">{cliente.razonSocial}</h1>
                  <StatusChip status={cliente.estado} />
                </div>
                <p className="text-slate-500">NIT: {cliente.nit}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" icon={Pencil} onClick={() => setEditModal(true)}>
              Editar
            </Button>
            <Button variant="danger" icon={Trash2} onClick={() => setDeleteModal(true)}>
              Eliminar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Despachos del Mes"
            value={cliente.despachosMes}
            icon={Truck}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Facturación del Mes"
            value={formatCurrency(cliente.facturacionMes)}
            icon={DollarSign}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Facturación Anual"
            value={formatCurrency(cliente.facturacionAnual)}
            icon={DollarSign}
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

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información General */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800">Información General</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Tipo:</span>
                      <span className="text-slate-800 capitalize">{cliente.tipoCliente}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Sector:</span>
                      <span className="text-slate-800 capitalize">{cliente.sector}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Cliente desde:</span>
                      <span className="text-slate-800">{cliente.fechaCreacion}</span>
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
                        <p className="text-slate-800">{cliente.direccion}</p>
                        <p className="text-slate-500">{cliente.ciudad}, {cliente.departamento}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800">{cliente.telefono}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800">{cliente.email}</span>
                    </div>
                    {cliente.sitioWeb && (
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="w-5 h-5 text-slate-400" />
                        <a href={cliente.sitioWeb} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                          {cliente.sitioWeb}
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
                      <span className="text-slate-800">{formatCurrency(cliente.limiteCredito)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Plazo pago:</span>
                      <span className="text-slate-800">{cliente.plazoFacturacion} días</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500 w-32">Vendedor:</span>
                      <span className="text-slate-800">{cliente.vendedorAsignado}</span>
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
                <div className="flex justify-end mb-4">
                  <Button
                    variant="primary"
                    icon={Plus}
                    size="sm"
                    onClick={() => setContactoModal({ isOpen: true, contacto: null })}
                  >
                    Agregar Contacto
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contactos.map((contacto) => (
                    <ContactCard
                      key={contacto.id}
                      contacto={contacto}
                      onEdit={() => setContactoModal({ isOpen: true, contacto })}
                      onDelete={() => setDeleteContactoModal({ isOpen: true, contacto })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Historial */}
            {activeTab === 'historial' && (
              <div className="space-y-4">
                {historial.map((actividad) => (
                  <ActivityItem key={actividad.id} actividad={actividad} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ClienteForm
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        onSubmit={handleEditCliente}
        cliente={cliente}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDeleteCliente}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar "${cliente?.razonSocial}"? Esta acción eliminará todos los datos asociados.`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />

      <ContactoFormModal
        isOpen={contactoModal.isOpen}
        onClose={() => setContactoModal({ isOpen: false, contacto: null })}
        onSubmit={handleSaveContacto}
        contacto={contactoModal.contacto}
        loading={formLoading}
      />

      <ConfirmDialog
        isOpen={deleteContactoModal.isOpen}
        onClose={() => setDeleteContactoModal({ isOpen: false, contacto: null })}
        onConfirm={handleDeleteContacto}
        title="Eliminar Contacto"
        message={`¿Eliminar a "${deleteContactoModal.contacto?.nombre}" de los contactos?`}
        confirmText="Eliminar"
        type="danger"
        loading={formLoading}
      />
    </div>
  );
};

export default ClienteDetail;