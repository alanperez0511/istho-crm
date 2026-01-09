/**
 * ============================================================================
 * ISTHO CRM - ProductoForm
 * ============================================================================
 * Formulario para crear/editar productos de inventario.
 * Usa snake_case para campos del backend.
 * 
 * @author Coordinación TI ISTHO
 * @version 2.0.0
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { X, Package, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/common';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const CATEGORIAS = [
  { value: 'lacteos', label: 'Lácteos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'construccion', label: 'Construcción' },
  { value: 'envases', label: 'Envases' },
  { value: 'quimicos', label: 'Químicos' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'farmaceutico', label: 'Farmacéutico' },
  { value: 'textil', label: 'Textil' },
  { value: 'tecnologia', label: 'Tecnología' },
];

const ZONAS = [
  { value: 'BOD-01', label: 'Área 01 - Refrigerados' },
  { value: 'BOD-02', label: 'Área 02 - Secos' },
  { value: 'BOD-03', label: 'Área 03 - Químicos' },
  { value: 'BOD-04', label: 'Área 04 - Construcción' },
];

const UNIDADES = [
  { value: 'UND', label: 'Unidades' },
  { value: 'KG', label: 'Kilogramos' },
  { value: 'LT', label: 'Litros' },
  { value: 'CAJ', label: 'Cajas' },
  { value: 'PAQ', label: 'Paquetes' },
  { value: 'BTO', label: 'Bultos' },
  { value: 'GAL', label: 'Galones' },
];

const ESTADOS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'cuarentena', label: 'En Cuarentena' },
];

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const ProductoForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  producto = null,
  loading = false 
}) => {
  const isEditing = !!producto;

  const [formData, setFormData] = useState({
    cliente_id: '',
    sku: '',
    codigo_barras: '',
    producto: '',
    descripcion: '',
    categoria: '',
    unidad_medida: 'UND',
    cantidad: '',
    stock_minimo: '',
    stock_maximo: '',
    ubicacion: '',
    zona: '',
    lote: '',
    fecha_vencimiento: '',
    costo_unitario: '',
    estado: 'disponible',
    notas: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Cargar datos del producto si estamos editando
  useEffect(() => {
    if (isOpen && producto) {
      setFormData({
        cliente_id: producto.cliente_id || '',
        sku: producto.sku || producto.codigo || '',
        codigo_barras: producto.codigo_barras || '',
        producto: producto.producto || producto.nombre || '',
        descripcion: producto.descripcion || '',
        categoria: producto.categoria || '',
        unidad_medida: producto.unidad_medida || 'UND',
        cantidad: producto.cantidad ?? producto.stock_actual ?? '',
        stock_minimo: producto.stock_minimo || '',
        stock_maximo: producto.stock_maximo || '',
        ubicacion: producto.ubicacion || '',
        zona: producto.zona || producto.bodega || '',
        lote: producto.lote || '',
        fecha_vencimiento: producto.fecha_vencimiento ? producto.fecha_vencimiento.split('T')[0] : '',
        costo_unitario: producto.costo_unitario || '',
        estado: producto.estado || 'disponible',
        notas: producto.notas || '',
      });
      setErrors({});
      setTouched({});
    } else if (isOpen) {
      // Reset form para nuevo producto
      setFormData({
        cliente_id: '',
        sku: '',
        codigo_barras: '',
        producto: '',
        descripcion: '',
        categoria: '',
        unidad_medida: 'UND',
        cantidad: '',
        stock_minimo: '',
        stock_maximo: '',
        ubicacion: '',
        zona: '',
        lote: '',
        fecha_vencimiento: '',
        costo_unitario: '',
        estado: 'disponible',
        notas: '',
      });
      setErrors({});
      setTouched({});
    }
  }, [isOpen, producto]);

  const validate = () => {
    const newErrors = {};

    if (!formData.producto.trim()) {
      newErrors.producto = 'El nombre del producto es requerido';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'El código SKU es requerido';
    }

    if (!isEditing && !formData.cliente_id) {
      newErrors.cliente_id = 'El cliente es requerido';
    }

    if (formData.cantidad && isNaN(parseFloat(formData.cantidad))) {
      newErrors.cantidad = 'La cantidad debe ser un número';
    }

    if (formData.stock_minimo && isNaN(parseFloat(formData.stock_minimo))) {
      newErrors.stock_minimo = 'El stock mínimo debe ser un número';
    }

    if (formData.costo_unitario && isNaN(parseFloat(formData.costo_unitario))) {
      newErrors.costo_unitario = 'El costo debe ser un número';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      producto: true,
      sku: true,
      cliente_id: true,
    });

    if (validate()) {
      // Preparar datos con campos numéricos convertidos
      const submitData = {
        ...formData,
        cantidad: formData.cantidad ? parseFloat(formData.cantidad) : 0,
        stock_minimo: formData.stock_minimo ? parseFloat(formData.stock_minimo) : 0,
        stock_maximo: formData.stock_maximo ? parseFloat(formData.stock_maximo) : null,
        costo_unitario: formData.costo_unitario ? parseFloat(formData.costo_unitario) : null,
      };
      onSubmit(submitData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre del producto */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.producto}
                  onChange={(e) => handleChange('producto', e.target.value)}
                  onBlur={() => handleBlur('producto')}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
                    errors.producto && touched.producto ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="Nombre del producto"
                />
                {errors.producto && touched.producto && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />{errors.producto}
                  </p>
                )}
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Código SKU *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('sku')}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono ${
                    errors.sku && touched.sku ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="SKU-001"
                />
                {errors.sku && touched.sku && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />{errors.sku}
                  </p>
                )}
              </div>

              {/* Código de barras */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={formData.codigo_barras}
                  onChange={(e) => handleChange('codigo_barras', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                  placeholder="7701234567890"
                />
              </div>

              {/* Cliente ID - Solo para nuevo */}
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    ID Cliente *
                  </label>
                  <input
                    type="number"
                    value={formData.cliente_id}
                    onChange={(e) => handleChange('cliente_id', e.target.value)}
                    onBlur={() => handleBlur('cliente_id')}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
                      errors.cliente_id && touched.cliente_id ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="ID del cliente"
                  />
                  {errors.cliente_id && touched.cliente_id && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{errors.cliente_id}
                    </p>
                  )}
                </div>
              )}

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Categoría
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => handleChange('categoria', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIAS.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>

              {/* Unidad de medida */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Unidad de Medida
                </label>
                <select
                  value={formData.unidad_medida}
                  onChange={(e) => handleChange('unidad_medida', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {UNIDADES.map((und) => <option key={und.value} value={und.value}>{und.label}</option>)}
                </select>
              </div>

              {/* Zona/Bodega */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Zona/Bodega
                </label>
                <select
                  value={formData.zona}
                  onChange={(e) => handleChange('zona', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Seleccionar zona</option>
                  {ZONAS.map((zona) => <option key={zona.value} value={zona.value}>{zona.label}</option>)}
                </select>
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => handleChange('ubicacion', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                  placeholder="A1-B2-C3"
                />
              </div>

              {/* Cantidad inicial (solo nuevo) */}
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Cantidad Inicial
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => handleChange('cantidad', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
                      errors.cantidad ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="0"
                    min="0"
                    step="0.001"
                  />
                </div>
              )}

              {/* Stock mínimo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  value={formData.stock_minimo}
                  onChange={(e) => handleChange('stock_minimo', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
                    errors.stock_minimo ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Stock máximo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Stock Máximo
                </label>
                <input
                  type="number"
                  value={formData.stock_maximo}
                  onChange={(e) => handleChange('stock_maximo', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Costo unitario */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Costo Unitario
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.costo_unitario}
                    onChange={(e) => handleChange('costo_unitario', e.target.value)}
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
                      errors.costo_unitario ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Lote */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Lote
                </label>
                <input
                  type="text"
                  value={formData.lote}
                  onChange={(e) => handleChange('lote', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                  placeholder="LOTE-2026-001"
                />
              </div>

              {/* Fecha de vencimiento */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => handleChange('fecha_vencimiento', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {ESTADOS.map((est) => <option key={est.value} value={est.value}>{est.label}</option>)}
                </select>
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  placeholder="Descripción del producto..."
                />
              </div>

              {/* Notas */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notas Internas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => handleChange('notas', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  placeholder="Notas internas..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" icon={Package} className="flex-1" loading={loading}>
                {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductoForm;
