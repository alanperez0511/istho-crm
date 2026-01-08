/**
 * ISTHO CRM - DespachoForm Component
 * Formulario para crear y editar despachos
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Truck, 
  Building2, 
  MapPin, 
  Calendar,
  User,
  Package,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button, Modal } from '../../../components/common';

// Opciones de selección
const CLIENTES_OPTIONS = [
  { value: 'CLI-001', label: 'Lácteos Betania S.A.S' },
  { value: 'CLI-002', label: 'Almacenes Éxito S.A' },
  { value: 'CLI-003', label: 'Eternit Colombia S.A' },
  { value: 'CLI-004', label: 'Prodenvases S.A.S' },
  { value: 'CLI-005', label: 'Klar Colombia S.A.S' },
];

const VEHICULOS_OPTIONS = [
  { value: 'VH-001', label: 'Camión ABC-123 - Furgón 5 Ton', conductor: 'Juan Pérez' },
  { value: 'VH-002', label: 'Camión DEF-456 - Furgón 10 Ton', conductor: 'Carlos García' },
  { value: 'VH-003', label: 'Camioneta GHI-789 - Turbo 2 Ton', conductor: 'María López' },
  { value: 'VH-004', label: 'Tractomula JKL-012 - 30 Ton', conductor: 'Pedro Martínez' },
];

const PRODUCTOS_DISPONIBLES = [
  { id: 'PRD-001', codigo: 'SKU-LCH-001', nombre: 'Leche UHT x24', stockDisponible: 12500, unidad: 'caja' },
  { id: 'PRD-002', codigo: 'SKU-YGT-001', nombre: 'Yogurt Griego x12', stockDisponible: 8200, unidad: 'caja' },
  { id: 'PRD-003', codigo: 'SKU-TEJ-001', nombre: 'Tejas Onduladas', stockDisponible: 450, unidad: 'unidad' },
  { id: 'PRD-004', codigo: 'SKU-ENV-001', nombre: 'Envases PET 500ml', stockDisponible: 45000, unidad: 'unidad' },
  { id: 'PRD-006', codigo: 'SKU-QSO-001', nombre: 'Queso Doble Crema x5kg', stockDisponible: 890, unidad: 'unidad' },
];

// ============================================
// PRODUCTO LINE ITEM
// ============================================
const ProductoLineItem = ({ item, index, onUpdate, onRemove, productos }) => {
  const productoSeleccionado = productos.find(p => p.id === item.productoId);
  
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="flex-1 grid grid-cols-12 gap-3 items-center">
        {/* Producto Select */}
        <div className="col-span-5">
          <select
            value={item.productoId || ''}
            onChange={(e) => onUpdate(index, 'productoId', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="">Seleccionar producto...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} - {p.nombre}
              </option>
            ))}
          </select>
        </div>
        
        {/* Cantidad */}
        <div className="col-span-2">
          <input
            type="number"
            min="1"
            max={productoSeleccionado?.stockDisponible || 99999}
            value={item.cantidad || ''}
            onChange={(e) => onUpdate(index, 'cantidad', parseInt(e.target.value) || 0)}
            placeholder="Cant."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
        
        {/* Unidad */}
        <div className="col-span-2 text-sm text-slate-500">
          {productoSeleccionado?.unidad || '-'}
        </div>
        
        {/* Stock disponible */}
        <div className="col-span-2 text-sm text-slate-500">
          Disp: {productoSeleccionado?.stockDisponible?.toLocaleString() || '-'}
        </div>
        
        {/* Remove */}
        <div className="col-span-1">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN FORM COMPONENT
// ============================================
const DespachoForm = ({
  isOpen,
  onClose,
  onSubmit,
  despacho = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  const isEditing = !!despacho;

  useEffect(() => {
    if (despacho) {
      setFormData({
        ...despacho,
        productos: despacho.productos || [],
      });
    } else {
      setFormData({
        estado: 'programado',
        fechaProgramada: new Date().toISOString().split('T')[0],
        productos: [{ productoId: '', cantidad: 0 }],
      });
    }
    setErrors({});
    setActiveTab('general');
  }, [despacho, isOpen]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleProductoUpdate = (index, field, value) => {
    const newProductos = [...(formData.productos || [])];
    newProductos[index] = { ...newProductos[index], [field]: value };
    handleChange('productos', newProductos);
  };

  const handleProductoRemove = (index) => {
    const newProductos = formData.productos.filter((_, i) => i !== index);
    handleChange('productos', newProductos.length ? newProductos : [{ productoId: '', cantidad: 0 }]);
  };

  const handleProductoAdd = () => {
    handleChange('productos', [...(formData.productos || []), { productoId: '', cantidad: 0 }]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clienteId) newErrors.clienteId = 'Seleccione un cliente';
    if (!formData.direccionEntrega) newErrors.direccionEntrega = 'Dirección es requerida';
    if (!formData.fechaProgramada) newErrors.fechaProgramada = 'Fecha es requerida';
    if (!formData.vehiculoId) newErrors.vehiculoId = 'Seleccione un vehículo';
    
    // Validar productos
    const productosValidos = formData.productos?.filter(p => p.productoId && p.cantidad > 0);
    if (!productosValidos?.length) {
      newErrors.productos = 'Agregue al menos un producto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (errors.productos) setActiveTab('productos');
      return;
    }
    
    // Filtrar productos vacíos
    const dataToSubmit = {
      ...formData,
      productos: formData.productos.filter(p => p.productoId && p.cantidad > 0),
    };
    
    await onSubmit?.(dataToSubmit);
  };

  // Obtener conductor del vehículo seleccionado
  const vehiculoSeleccionado = VEHICULOS_OPTIONS.find(v => v.value === formData.vehiculoId);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'productos', label: `Productos (${formData.productos?.filter(p => p.productoId).length || 0})` },
    { id: 'observaciones', label: 'Observaciones' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Despacho' : 'Nuevo Despacho'}
      subtitle={isEditing ? `Editando: ${despacho?.id}` : 'Complete la información del despacho'}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Guardar Cambios' : 'Crear Despacho'}
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

      {/* Tab: General */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={formData.clienteId || ''}
                  onChange={(e) => handleChange('clienteId', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${errors.clienteId ? 'border-red-300' : 'border-slate-200'}`}
                >
                  <option value="">Seleccionar cliente...</option>
                  {CLIENTES_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              {errors.clienteId && <p className="text-xs text-red-500 mt-1">{errors.clienteId}</p>}
            </div>

            {/* Fecha Programada */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha Programada <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={formData.fechaProgramada || ''}
                  onChange={(e) => handleChange('fechaProgramada', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${errors.fechaProgramada ? 'border-red-300' : 'border-slate-200'}`}
                />
              </div>
              {errors.fechaProgramada && <p className="text-xs text-red-500 mt-1">{errors.fechaProgramada}</p>}
            </div>

            {/* Dirección de Entrega */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dirección de Entrega <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.direccionEntrega || ''}
                  onChange={(e) => handleChange('direccionEntrega', e.target.value)}
                  placeholder="Calle, número, ciudad"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${errors.direccionEntrega ? 'border-red-300' : 'border-slate-200'}`}
                />
              </div>
              {errors.direccionEntrega && <p className="text-xs text-red-500 mt-1">{errors.direccionEntrega}</p>}
            </div>

            {/* Vehículo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vehículo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={formData.vehiculoId || ''}
                  onChange={(e) => handleChange('vehiculoId', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${errors.vehiculoId ? 'border-red-300' : 'border-slate-200'}`}
                >
                  <option value="">Seleccionar vehículo...</option>
                  {VEHICULOS_OPTIONS.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              {errors.vehiculoId && <p className="text-xs text-red-500 mt-1">{errors.vehiculoId}</p>}
            </div>

            {/* Conductor (auto) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Conductor
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={vehiculoSeleccionado?.conductor || ''}
                  readOnly
                  placeholder="Se asigna con el vehículo"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600"
                />
              </div>
            </div>

            {/* Hora estimada */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hora Estimada de Entrega
              </label>
              <input
                type="time"
                value={formData.horaEstimada || ''}
                onChange={(e) => handleChange('horaEstimada', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Prioridad
              </label>
              <select
                value={formData.prioridad || 'normal'}
                onChange={(e) => handleChange('prioridad', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Productos */}
      {activeTab === 'productos' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Productos a despachar</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleProductoAdd}
            >
              Agregar Producto
            </Button>
          </div>

          {errors.productos && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{errors.productos}</p>
          )}

          {/* Productos List */}
          <div className="space-y-2">
            {formData.productos?.map((item, index) => (
              <ProductoLineItem
                key={index}
                item={item}
                index={index}
                onUpdate={handleProductoUpdate}
                onRemove={handleProductoRemove}
                productos={PRODUCTOS_DISPONIBLES}
              />
            ))}
          </div>

          {/* Total productos */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <div className="text-sm">
              <span className="text-slate-500">Total productos: </span>
              <span className="font-semibold text-slate-800">
                {formData.productos?.reduce((sum, p) => sum + (p.cantidad || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Observaciones */}
      {activeTab === 'observaciones' && (
        <div className="space-y-4">
          {/* Instrucciones de entrega */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instrucciones de Entrega
            </label>
            <textarea
              value={formData.instrucciones || ''}
              onChange={(e) => handleChange('instrucciones', e.target.value)}
              placeholder="Instrucciones especiales para la entrega..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Observaciones internas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Observaciones Internas
            </label>
            <textarea
              value={formData.observaciones || ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              placeholder="Notas internas sobre el despacho..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Documentos requeridos */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Documentos Requeridos
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Guía de Remisión', 'Factura', 'Certificado de Calidad', 'Orden de Compra'].map((doc) => (
                <label key={doc} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.documentos?.includes(doc) || false}
                    onChange={(e) => {
                      const docs = formData.documentos || [];
                      if (e.target.checked) {
                        handleChange('documentos', [...docs, doc]);
                      } else {
                        handleChange('documentos', docs.filter(d => d !== doc));
                      }
                    }}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-slate-700">{doc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

DespachoForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  despacho: PropTypes.object,
  loading: PropTypes.bool,
};

export default DespachoForm;