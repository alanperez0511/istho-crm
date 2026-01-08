/**
 * ISTHO CRM - StatusChip Component
 * Chip de estado reutilizable con colores dinámicos
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import PropTypes from 'prop-types';

// Configuración de estados
const STATUS_CONFIG = {
  // Despachos
  completado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'completado' },
  en_transito: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'en tránsito' },
  en_preparacion: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'en preparación' },
  programado: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'programado' },
  cancelado: { bg: 'bg-red-100', text: 'text-red-700', label: 'cancelado' },
  pendiente: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'pendiente' },
  
  // Productos/Inventario
  disponible: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'disponible' },
  bajo_stock: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'bajo stock' },
  agotado: { bg: 'bg-red-100', text: 'text-red-700', label: 'agotado' },
  reservado: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'reservado' },
  
  // Clientes
  activo: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'activo' },
  inactivo: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'inactivo' },
  suspendido: { bg: 'bg-red-100', text: 'text-red-700', label: 'suspendido' },
  
  // Bodegas
  operativa: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'operativa' },
  mantenimiento: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'mantenimiento' },
  cerrada: { bg: 'bg-red-100', text: 'text-red-700', label: 'cerrada' },
};

const StatusChip = ({ status, customLabel, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || { 
    bg: 'bg-gray-100', 
    text: 'text-gray-700', 
    label: status 
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.bg} ${config.text} ${sizeClasses[size]}
      `}
    >
      {customLabel || config.label}
    </span>
  );
};

StatusChip.propTypes = {
  /** Identificador del estado (debe coincidir con STATUS_CONFIG) */
  status: PropTypes.string.isRequired,
  /** Label personalizado (opcional, sobrescribe el default) */
  customLabel: PropTypes.string,
  /** Tamaño del chip */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default StatusChip;