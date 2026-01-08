/**
 * ISTHO CRM - ProductoForm Component
 * Formulario para crear y editar productos
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Package, 
  Barcode, 
  Layers,
  Ruler,
  DollarSign,
  Building2,
  MapPin,
} from 'lucide-react';
import { Button, Modal } from '../../../components/common';

// Campos del formulario
const FORM_FIELDS = {
  general: [
    { name: 'codigo', label: 'Código SKU', type: 'text', required: true, icon: Barcode, placeholder: 'PRD-001' },
    { name: 'nombre', label: 'Nombre del Producto', type: 'text', required: true, icon: Package, placeholder: 'Nombre del producto' },
    { name: 'categoria', label: 'Categoría', type: 'select', required: true, options: [
      { value: 'lacteos', label: 'Lácteos' },
      { value: 'bebidas', label: 'Bebidas' },
      { value: 'construccion', label: 'Construcción' },
      { value: 'envases', label: 'Envases' },
      { value: 'quimicos', label: 'Químicos' },
      { value: 'alimentos', label: 'Alimentos' },
      { value: 'otros', label: 'Otros' },
    ]},
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: false, placeholder: 'Descripción del producto...' },
  ],
  inventario: [
    { name: 'stockActual', label: 'Stock Actual', type: 'number', required: true, placeholder: '0' },
    { name: 'stockMinimo', label: 'Stock Mínimo', type: 'number', required: true, placeholder: '100' },
    { name: 'stockMaximo', label: 'Stock Máximo', type: 'number', required: false, placeholder: '10000' },
    { name: 'unidadMedida', label: 'Unidad de Medida', type: 'select', required: true, icon: Ruler, options: [
      { value: 'unidad', label: 'Unidad' },
      { value: 'caja', label: 'Caja' },
      { value: 'paquete', label: 'Paquete' },
      { value: 'kg', label: 'Kilogramo' },
      { value: 'litro', label: 'Litro' },
      { value: 'metro', label: 'Metro' },
      { value: 'pallet', label: 'Pallet' },
    ]},
  ],
  ubicacion: [
    { name: 'clientePropietario', label: 'Cliente Propietario', type: 'select', required: true, icon: Building2, options: [
      { value: 'CLI-001', label: 'Lácteos Betania S.A.S' },
      { value: 'CLI-002', label: 'Almacenes Éxito S.A' },
      { value: 'CLI-003', label: 'Eternit Colombia S.A' },
      { value: 'CLI-004', label: 'Prodenvases S.A.S' },
      { value: 'CLI-005', label: 'Klar Colombia S.A.S' },
    ]},
    { name: 'bodega', label: 'Bodega', type: 'select', required: true, options: [
      { value: 'BOD-01', label: 'Área 01 - Refrigerados' },
      { value: 'BOD-02', label: 'Área 02 - Secos' },
      { value: 'BOD-03', label: 'Área 03 - Químicos' },
      { value: 'BOD-04', label: 'Área 04 - Construcción' },
    ]},
    { name: 'ubicacion', label: 'Ubicación (Rack)', type: 'text', required: true, icon: MapPin, placeholder: 'A-01-03' },
    { name: 'lote', label: 'Lote', type: 'text', required: false, placeholder: 'LOT-2026-001' },
    { name: 'fechaVencimiento', label: 'Fecha de Vencimiento', type: 'date', required: false },
  ],
  costos: [
    { name: 'costoUnitario', label: 'Costo Unitario', type: 'number', required: false, icon: DollarSign, placeholder: '0' },
    { name: 'precioVenta', label: 'Precio de Venta', type: 'number', required: false, icon: DollarSign, placeholder: '0' },
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

const ProductoForm = ({
  isOpen,
  onClose,
  onSubmit,
  producto = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  const isEditing = !!producto;

  useEffect(() => {
    if (producto) {
      setFormData(producto);
    } else {
      setFormData({
        estado: 'disponible',
        stockActual: 0,
        stockMinimo: 100,
      });
    }
    setErrors({});
    setActiveTab('general');
  }, [producto, isOpen]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    Object.values(FORM_FIELDS).flat().forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} es requerido`;
      }
    });

    // Validar stock mínimo < stock máximo
    if (formData.stockMinimo && formData.stockMaximo) {
      if (Number(formData.stockMinimo) >= Number(formData.stockMaximo)) {
        newErrors.stockMinimo = 'Stock mínimo debe ser menor que el máximo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await onSubmit?.(formData);
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'ubicacion', label: 'Ubicación' },
    { id: 'costos', label: 'Costos' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      subtitle={isEditing ? `Editando: ${producto?.nombre}` : 'Complete la información del producto'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
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
      {isEditing && activeTab === 'inventario' && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estado del Producto
          </label>
          <div className="flex gap-4">
            {['disponible', 'reservado', 'agotado'].map((estado) => (
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

ProductoForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  producto: PropTypes.object,
  loading: PropTypes.bool,
};

export default ProductoForm;