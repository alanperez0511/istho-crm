/**
 * ISTHO CRM - KpiCard Component
 * Tarjeta de KPI reutilizable para métricas
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import PropTypes from 'prop-types';

const KpiCard = ({ 
  title, 
  value, 
  change, 
  positive = true, 
  icon: Icon, 
  iconBg = 'bg-blue-100', 
  iconColor = 'text-blue-600',
  onClick,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-28" />
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl p-5 shadow-sm border border-gray-100 
        hover:shadow-md transition-shadow duration-300
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-800">
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-2 font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
};

KpiCard.propTypes = {
  /** Título de la métrica */
  title: PropTypes.string.isRequired,
  /** Valor principal a mostrar */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Texto de cambio/comparación */
  change: PropTypes.string,
  /** Si el cambio es positivo o negativo */
  positive: PropTypes.bool,
  /** Componente de icono de Lucide */
  icon: PropTypes.elementType,
  /** Clase de fondo del icono */
  iconBg: PropTypes.string,
  /** Clase de color del icono */
  iconColor: PropTypes.string,
  /** Handler de click */
  onClick: PropTypes.func,
  /** Estado de carga */
  loading: PropTypes.bool,
};

export default KpiCard;