/**
 * ISTHO CRM - ClienteForm Component
 * Formulario para crear y editar clientes
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Building2, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  User,
} from 'lucide-react';
import { Button, Modal } from '../../../components/common/index';

// Campos del formulario
const FORM_FIELDS = {
  info: [
    { name: 'razonSocial', label: 'Razón Social', type: 'text', required: true, icon: Building2, placeholder: 'Nombre de la empresa' },
    { name: 'nit', label: 'NIT', type: 'text', required: true, icon: FileText, placeholder: '900.123.456-7' },
    { name: 'tipoCliente', label: 'Tipo de Cliente', type: 'select', required: true, options: [
      { value: 'corporativo', label: 'Corporativo' },
      { value: 'pyme', label: 'PyME' },
      { value: 'distribuidor', label: 'Distribuidor' },
      { value: 'minorista', label: 'Minorista' },
    ]},
    { name: 'sector', label: 'Sector', type: 'select', required: false, options: [
      { value: 'alimentos', label: 'Alimentos y Bebidas' },
      { value: 'construccion', label: 'Construcción' },
      { value: 'manufactura', label: 'Manufactura' },
      { value: 'retail', label: 'Retail' },
      { value: 'farmaceutico', label: 'Farmacéutico' },
      { value: 'otro', label: 'Otro' },
    ]},
  ],
  contacto: [
    { name: 'direccion', label: 'Dirección', type: 'text', required: true, icon: MapPin, placeholder: 'Calle, número, ciudad' },
    { name: 'ciudad', label: 'Ciudad', type: 'text', required: true, placeholder: 'Ciudad' },
    { name: 'departamento', label: 'Departamento', type: 'text', required: true, placeholder: 'Departamento' },
    { name: 'telefono', label: 'Teléfono', type: 'tel', required: true, icon: Phone, placeholder: '+57 300 123 4567' },
    { name: 'email', label: 'Email', type: 'email', required: true, icon: Mail, placeholder: 'contacto@empresa.com' },
    { name: 'sitioWeb', label: 'Sitio Web', type: 'url', required: false, icon: Globe, placeholder: 'https://www.empresa.com' },
  ],
  comercial: [
    { name: 'limiteCredito', label: 'Límite de Crédito', type: 'number', required: false, placeholder: '50000000' },
    { name: 'plazoFacturacion', label: 'Plazo Facturación (días)', type: 'number', required: false, placeholder: '30' },
    { name: 'vendedorAsignado', label: 'Vendedor Asignado', type: 'text', required: false, icon: User, placeholder: 'Nombre del vendedor' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', required: false, placeholder: 'Notas adicionales sobre el cliente...' },
  ],
};

const InputField = ({ field, value, onChange, error }) => {
  const Icon = field.icon;
  
  const baseInputClasses = `
    w-full px-4 py-2.5 
    bg-white border rounded-xl
    text-sm text-slate-800 placeholder-slate-400
    focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
    transition-all duration-200
    ${error ? 'border-red-300' : 'border-slate-200'}
    ${Icon ? 'pl-10' : ''}
  `;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
        
        {field.type === 'select' ? (
          <select
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={baseInputClasses}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={baseInputClasses}
          />
        ) : (
          <input
            type={field.type}
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

const ClienteForm = ({
  isOpen,
  onClose,
  onSubmit,
  cliente = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('info');

  const isEditing = !!cliente;

  // Inicializar formulario
  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
    } else {
      setFormData({
        estado: 'activo',
      });
    }
    setErrors({});
    setActiveTab('info');
  }, [cliente, isOpen]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos requeridos
    Object.values(FORM_FIELDS).flat().forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} es requerido`;
      }
    });

    // Validar email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar NIT
    if (formData.nit && !/^\d{3}\.\d{3}\.\d{3}-\d$/.test(formData.nit)) {
      newErrors.nit = 'Formato de NIT inválido (ej: 900.123.456-7)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Ir a la primera pestaña con errores
      const tabs = ['info', 'contacto', 'comercial'];
      for (const tab of tabs) {
        const hasError = FORM_FIELDS[tab].some((field) => errors[field.name]);
        if (hasError) {
          setActiveTab(tab);
          break;
        }
      }
      return;
    }

    await onSubmit?.(formData);
  };

  const tabs = [
    { id: 'info', label: 'Información' },
    { id: 'contacto', label: 'Contacto' },
    { id: 'comercial', label: 'Comercial' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
      subtitle={isEditing ? `Editando: ${cliente?.razonSocial}` : 'Complete la información del cliente'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </>
      }
    >
      {/* Tabs */}
      <div className="border-b border-gray-100 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                pb-3 px-1 text-sm font-medium transition-colors relative
                ${activeTab === tab.id
                  ? 'text-orange-600'
                  : 'text-slate-500 hover:text-slate-700'
                }
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

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FORM_FIELDS[activeTab]?.map((field) => (
          <div 
            key={field.name} 
            className={field.type === 'textarea' ? 'md:col-span-2' : ''}
          >
            <InputField
              field={field}
              value={formData[field.name]}
              onChange={handleChange}
              error={errors[field.name]}
            />
          </div>
        ))}
      </div>

      {/* Estado (solo en edición) */}
      {isEditing && activeTab === 'info' && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estado del Cliente
          </label>
          <div className="flex gap-4">
            {['activo', 'inactivo', 'suspendido'].map((estado) => (
              <label key={estado} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="estado"
                  value={estado}
                  checked={formData.estado === estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700 capitalize">{estado}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

ClienteForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  cliente: PropTypes.object,
  loading: PropTypes.bool,
};

export default ClienteForm;