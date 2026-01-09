/**
 * ISTHO CRM - MovimientoForm Component
 * Formulario para registrar entradas y salidas de inventario
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  PackagePlus,
  PackageMinus,
  FileText,
  Calendar,
  User,
} from 'lucide-react';
import { Button, Modal } from '../../../components/common';

const MovimientoForm = ({
  isOpen,
  onClose,
  onSubmit,
  tipo = 'entrada', // 'entrada' | 'salida'
  producto = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const isEntrada = tipo === 'entrada';

  useEffect(() => {
    setFormData({
      tipo,
      productoId: producto?.id || '',
      productoNombre: producto?.nombre || '',
      cantidad: '',
      fecha: new Date().toISOString().split('T')[0],
      motivo: '',
      documento: '',
      responsable: '',
      observaciones: '',
    });
    setErrors({});
  }, [tipo, producto, isOpen]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cantidad || Number(formData.cantidad) <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }
    
    if (!formData.motivo) {
      newErrors.motivo = 'Seleccione un motivo';
    }
    
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    // Validar que no exceda stock en salidas
    if (!isEntrada && producto) {
      if (Number(formData.cantidad) > producto.stockActual) {
        newErrors.cantidad = `Stock insuficiente. Disponible: ${producto.stockActual}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await onSubmit?.({
      ...formData,
      cantidad: Number(formData.cantidad),
    });
  };

  const motivosEntrada = [
    { value: 'compra', label: 'Compra / Recepción' },
    { value: 'devolucion', label: 'Devolución de cliente' },
    { value: 'transferencia', label: 'Transferencia entre bodegas' },
    { value: 'ajuste_positivo', label: 'Ajuste de inventario (+)' },
    { value: 'produccion', label: 'Producción' },
  ];

  const motivosSalida = [
    { value: 'despacho', label: 'Despacho a cliente' },
    { value: 'devolucion_proveedor', label: 'Devolución a proveedor' },
    { value: 'transferencia', label: 'Transferencia entre bodegas' },
    { value: 'ajuste_negativo', label: 'Ajuste de inventario (-)' },
    { value: 'merma', label: 'Merma / Daño' },
    { value: 'vencimiento', label: 'Producto vencido' },
  ];

  const motivos = isEntrada ? motivosEntrada : motivosSalida;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEntrada ? 'Registrar Entrada' : 'Registrar Salida'}
      subtitle={producto ? `Producto: ${producto.nombre}` : 'Complete la información del movimiento'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant={isEntrada ? 'success' : 'danger'} 
            onClick={handleSubmit} 
            loading={loading}
            icon={isEntrada ? PackagePlus : PackageMinus}
          >
            {isEntrada ? 'Registrar Entrada' : 'Registrar Salida'}
          </Button>
        </>
      }
    >
      {/* Indicador visual del tipo */}
      <div className={`
        flex items-center gap-3 p-4 rounded-xl mb-6
        ${isEntrada ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}
      `}>
        {isEntrada ? (
          <PackagePlus className="w-6 h-6 text-emerald-600" />
        ) : (
          <PackageMinus className="w-6 h-6 text-red-600" />
        )}
        <div>
          <p className={`font-medium ${isEntrada ? 'text-emerald-800' : 'text-red-800'}`}>
            {isEntrada ? 'Entrada de Inventario' : 'Salida de Inventario'}
          </p>
          {producto && (
            <p className="text-sm text-slate-600">
              Stock actual: <span className="font-semibold">{producto.stockActual}</span> {producto.unidadMedida}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Cantidad <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.cantidad}
            onChange={(e) => handleChange('cantidad', e.target.value)}
            placeholder="Ingrese la cantidad"
            className={`
              w-full px-4 py-2.5 border rounded-xl text-sm
              focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
              ${errors.cantidad ? 'border-red-300' : 'border-slate-200'}
            `}
          />
          {errors.cantidad && (
            <p className="text-xs text-red-500 mt-1">{errors.cantidad}</p>
          )}
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Motivo <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.motivo}
            onChange={(e) => handleChange('motivo', e.target.value)}
            className={`
              w-full px-4 py-2.5 border rounded-xl text-sm
              focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
              ${errors.motivo ? 'border-red-300' : 'border-slate-200'}
            `}
          >
            <option value="">Seleccionar motivo...</option>
            {motivos.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          {errors.motivo && (
            <p className="text-xs text-red-500 mt-1">{errors.motivo}</p>
          )}
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Fecha <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm
                focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                ${errors.fecha ? 'border-red-300' : 'border-slate-200'}
              `}
            />
          </div>
        </div>

        {/* Documento de referencia */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Documento de Referencia
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={formData.documento}
              onChange={(e) => handleChange('documento', e.target.value)}
              placeholder="Ej: FAC-001, OC-123, GR-456"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Responsable */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Responsable
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={formData.responsable}
              onChange={(e) => handleChange('responsable', e.target.value)}
              placeholder="Nombre del responsable"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            placeholder="Notas adicionales..."
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>
    </Modal>
  );
};

MovimientoForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  tipo: PropTypes.oneOf(['entrada', 'salida']),
  producto: PropTypes.object,
  loading: PropTypes.bool,
};

export default MovimientoForm;