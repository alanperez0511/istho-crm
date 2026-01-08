/**
 * ISTHO CRM - DataTable Component
 * Tabla de datos con tabs reutilizable
 * 
 * @author Coordinación TI ISTHO
 * @date Enero 2026
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import StatusChip from '../StatusChip/StatusChip';

// ============================================
// TABLA SIN TABS (Componente interno)
// ============================================
const SimpleTable = ({ columns, data, onRowClick, loading, emptyMessage }) => {
  // Loading skeleton
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((col, idx) => (
                <th key={idx} className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-50">
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className="py-4 px-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p>{emptyMessage || 'No hay datos para mostrar'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`
                  py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider
                  ${col.align === 'center' ? 'text-center' : ''}
                  ${col.align === 'right' ? 'text-right' : 'text-left'}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`
                border-b border-gray-50 hover:bg-slate-50 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`
                    py-4 px-4 text-sm
                    ${col.align === 'center' ? 'text-center' : ''}
                    ${col.align === 'right' ? 'text-right' : ''}
                  `}
                >
                  {renderCell(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Función para renderizar celdas
const renderCell = (row, col) => {
  const value = row[col.key];

  // Renderizado personalizado
  if (col.render) {
    return col.render(value, row);
  }

  // Tipos especiales
  if (col.type === 'status') {
    return <StatusChip status={value} />;
  }

  if (col.type === 'id') {
    return <span className="font-medium text-orange-600">{value}</span>;
  }

  if (col.type === 'currency') {
    return <span className="text-slate-600 font-medium">{value}</span>;
  }

  // Default
  return <span className="text-slate-600">{value}</span>;
};

// ============================================
// TABLA CON TABS (Componente principal)
// ============================================
const DataTable = ({
  tabs,
  columns,
  data,
  defaultTab,
  onTabChange,
  onRowClick,
  loading = false,
  emptyMessage,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || (tabs?.[0]?.id));

  // Si no hay tabs, renderizar tabla simple
  if (!tabs || tabs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <SimpleTable
          columns={columns}
          data={data}
          onRowClick={onRowClick}
          loading={loading}
          emptyMessage={emptyMessage}
        />
      </div>
    );
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  // Obtener columnas y datos del tab activo
  const currentColumns = columns[activeTab] || columns;
  const currentData = data[activeTab] || data;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-100">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                px-6 py-4 text-sm font-medium transition-colors relative
                ${activeTab === tab.id
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <SimpleTable
        columns={currentColumns}
        data={currentData}
        onRowClick={onRowClick}
        loading={loading}
        emptyMessage={emptyMessage}
      />
    </div>
  );
};

DataTable.propTypes = {
  /** Array de tabs { id, label, count? } */
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
    })
  ),
  /** Columnas de la tabla (objeto por tab o array simple) */
  columns: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        align: PropTypes.oneOf(['left', 'center', 'right']),
        type: PropTypes.oneOf(['status', 'id', 'currency', 'default']),
        render: PropTypes.func,
      })
    ),
    PropTypes.object,
  ]).isRequired,
  /** Datos de la tabla (objeto por tab o array simple) */
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  /** Tab activo por defecto */
  defaultTab: PropTypes.string,
  /** Callback cuando cambia el tab */
  onTabChange: PropTypes.func,
  /** Callback al hacer click en una fila */
  onRowClick: PropTypes.func,
  /** Estado de carga */
  loading: PropTypes.bool,
  /** Mensaje cuando no hay datos */
  emptyMessage: PropTypes.string,
};

export default DataTable;