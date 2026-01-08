/**
 * ISTHO CRM - AlertWidget Component
 * Widget de alertas del sistema
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import PropTypes from 'prop-types';
import { 
  AlertTriangle, 
  FileWarning, 
  Package, 
  Clock,
  ChevronRight,
  Bell,
} from 'lucide-react';

// Configuración de tipos de alerta
const ALERT_CONFIG = {
  documento: {
    icon: FileWarning,
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
  },
  inventario: {
    icon: Package,
    bgColor: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    borderColor: 'border-red-200',
  },
  vencimiento: {
    icon: Clock,
    bgColor: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200',
  },
  general: {
    icon: AlertTriangle,
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
};

const AlertItem = ({ alert, onClick }) => {
  const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.general;
  const Icon = config.icon;

  return (
    <div 
      onClick={() => onClick?.(alert)}
      className={`
        flex items-start gap-3 p-3 rounded-xl border cursor-pointer
        transition-all duration-200 hover:shadow-sm
        ${config.bgColor} ${config.borderColor}
      `}
    >
      <div className={`p-2 rounded-lg ${config.iconBg}`}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {alert.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {alert.description}
        </p>
        {alert.date && (
          <p className="text-xs text-slate-400 mt-1">
            {alert.date}
          </p>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
    </div>
  );
};

const AlertWidget = ({ 
  title = 'Alertas', 
  alerts = [], 
  onAlertClick,
  onViewAll,
  maxItems = 5,
  emptyMessage = 'No hay alertas pendientes',
}) => {
  const displayedAlerts = alerts.slice(0, maxItems);
  const hasMore = alerts.length > maxItems;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        
        {onViewAll && alerts.length > 0 && (
          <button 
            onClick={onViewAll}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Ver todas
          </button>
        )}
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map((alert, idx) => (
            <AlertItem 
              key={alert.id || idx} 
              alert={alert} 
              onClick={onAlertClick}
            />
          ))}
          
          {hasMore && (
            <button 
              onClick={onViewAll}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 
                         hover:bg-slate-50 rounded-lg transition-colors"
            >
              +{alerts.length - maxItems} alertas más
            </button>
          )}
        </div>
      )}
    </div>
  );
};

AlertWidget.propTypes = {
  /** Título del widget */
  title: PropTypes.string,
  /** Array de alertas */
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.oneOf(['documento', 'inventario', 'vencimiento', 'general']),
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      date: PropTypes.string,
    })
  ),
  /** Callback al hacer click en una alerta */
  onAlertClick: PropTypes.func,
  /** Callback para ver todas las alertas */
  onViewAll: PropTypes.func,
  /** Máximo de alertas a mostrar */
  maxItems: PropTypes.number,
  /** Mensaje cuando no hay alertas */
  emptyMessage: PropTypes.string,
};

export default AlertWidget;