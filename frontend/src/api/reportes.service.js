/**
 * ============================================================================
 * ISTHO CRM - Servicio de Reportes
 * ============================================================================
 * Gestiona la generación y descarga de reportes:
 * - Dashboard consolidado
 * - Exportación a Excel
 * - Exportación a PDF
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import apiClient from './client';
import { REPORTES_ENDPOINTS } from './endpoints';

// ============================================================================
// FUNCIÓN AUXILIAR PARA DESCARGA
// ============================================================================

/**
 * Descarga un archivo blob
 * @param {Blob} blob - Datos del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} [type] - Tipo MIME
 */
const descargarArchivo = (blob, filename, type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') => {
  const url = window.URL.createObjectURL(new Blob([blob], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ============================================================================
// SERVICIO DE REPORTES
// ============================================================================

const reportesService = {
  
  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Obtener datos consolidados para el dashboard
   * Incluye métricas de operaciones, inventario y clientes
   * 
   * @returns {Promise<Object>} Datos del dashboard
   * 
   * @example
   * const data = await reportesService.getDashboard();
   * // data = {
   * //   operaciones: { total, mes, semana, pendientes, porTipo, porEstado },
   * //   inventario: { totalItems, totalUnidades, valorTotal, alertas },
   * //   clientes: { total, activos, nuevosMes },
   * //   ultimasOperaciones: [...]
   * // }
   */
  getDashboard: async () => {
    try {
      const response = await apiClient.get(REPORTES_ENDPOINTS.DASHBOARD);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener datos del dashboard',
        code: error.code || 'GET_DASHBOARD_ERROR',
      };
    }
  },
  
  // ══════════════════════════════════════════════════════════════════════════
  // EXPORTACIÓN DE OPERACIONES (DESPACHOS)
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Descargar reporte de operaciones en Excel
   * 
   * @param {Object} [params] - Filtros opcionales
   * @param {string} [params.fecha_desde] - Fecha desde (YYYY-MM-DD)
   * @param {string} [params.fecha_hasta] - Fecha hasta (YYYY-MM-DD)
   * @param {string} [params.tipo] - Tipo ('ingreso'|'salida'|'todos')
   * @param {string} [params.estado] - Estado
   * @param {number} [params.cliente_id] - ID del cliente
   * @returns {Promise<Object>} Resultado de la descarga
   */
  descargarOperacionesExcel: async (params = {}) => {
    try {
      const response = await apiClient.get(REPORTES_ENDPOINTS.OPERACIONES_EXCEL, {
        params,
        responseType: 'blob',
      });
      
      const fecha = new Date().toISOString().split('T')[0];
      descargarArchivo(response.data, `operaciones_${fecha}.xlsx`);
      
      return { success: true, message: 'Reporte descargado exitosamente' };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al descargar reporte',
        code: error.code || 'DOWNLOAD_ERROR',
      };
    }
  },
  
  /**
   * Descargar reporte de operaciones en PDF
   * 
   * @param {Object} [params] - Filtros opcionales
   * @returns {Promise<Object>} Resultado de la descarga
   */
  descargarOperacionesPDF: async (params = {}) => {
    try {
      const response = await apiClient.get(REPORTES_ENDPOINTS.OPERACIONES_PDF, {
        params,
        responseType: 'blob',
      });
      
      const fecha = new Date().toISOString().split('T')[0];
      descargarArchivo(response.data, `operaciones_${fecha}.pdf`, 'application/pdf');
      
      return { success: true, message: 'Reporte descargado exitosamente' };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al descargar reporte',
        code: error.code || 'DOWNLOAD_ERROR',
      };
    }
  },
  
  /**
   * Descargar detalle de una operación en Excel
   * 
   * @param {number|string} id - ID de la operación
   * @param {string} [numeroOperacion] - Número para el nombre del archivo
   * @returns {Promise<Object>} Resultado de la descarga
   */
  descargarDetalleOperacionExcel: async (id, numeroOperacion = null) => {
    try {
      const response = await apiClient.get(REPORTES_ENDPOINTS.OPERACION_DETALLE_EXCEL(id), {
        responseType: 'blob',
      });
      
      const nombre = numeroOperacion || `operacion_${id}`;
      descargarArchivo(response.data, `${nombre}.xlsx`);
      
      return { success: true, message: 'Detalle descargado exitosamente' };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al descargar detalle',
        code: error.code || 'DOWNLOAD_ERROR',
      };
    }
  },
  
  /**
   * Descargar detalle de una operación en PDF
   * 
   * @param {number|string} id - ID de la operación
   * @param {string} [numeroOperacion] - Número para el nombre del archivo
   * @returns {Promise<Object>} Resultado de la descarga
   */
  descargarDetalleOperacionPDF: async (id, numeroOperacion = null) => {
    try {
      const response = await apiClient.get(REPORTES_ENDPOINTS.OPERACION_DETALLE_PDF(id), {
        responseType: 'blob',
      });
      
      const nombre = numeroOperacion || `operacion_${id}`;
      descargarArchivo(response.data, `${nombre}.pdf`, 'application/pdf');
      
      return { success: true, message: 'Detalle descargado exitosamente' };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al descargar detalle',
        code: error.code || 'DOWNLOAD_ERROR',
      };
    }
  },
  
  // ══════════════════════════════════════════════════════════════════════════
  // EXPORTACIÓN DE INVENTARIO
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Descargar reporte de inventario en Excel
   * 
   * @param {Object} [params] - Filtros opcionales
   * @param {number} [params.cliente_id] - ID del cliente
   * @param {string} [params.estado] - Estado
   * @param {string} [params.zona] - Zona
   * @returns {Promise<Object>} Resultado de la descarga
   */
  descargarInventarioExcel: async (params = {}) => {
    try {
      const response = await apiClient.get(REPORTES_ENDPOINTS.INVENTARIO_EXCEL, {
        params,
        responseType: 'blob',
      });
      
      const fecha = new Date().toISOString().split('T')[0];
      descargarArchivo(response.data, `inventario_${fecha}.xlsx`);
      
      return { success: true, message: 'Reporte descargado exitosamente' };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al descargar reporte',
        code: error.code || 'DOWNLOAD_ERROR',
      };
    }
  },
  
  /**
   * Descargar reporte de inventario en PDF
   * 
   * @param {Object} [params] - Filtros opcionales
   * @returns {Promise<Object>} Resultado de la descarga
   */
  descargarInventarioPDF: async (params = {}) => {
    try {
      const response = await apiClient.get(REPORTES_ENDPOINTS.INVENTARIO_PDF, {
        params,
        responseType: 'blob',
      });
      
      const fecha = new Date().toISOString().split('T')[0];
      descargarArchivo(response.data, `inventario_${fecha}.pdf`, 'application/pdf');
      
      return { success: true, message: 'Reporte descargado exitosamente' };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al descargar reporte',
        code: error.code || 'DOWNLOAD_ERROR',
      };
    }
  },
  
  // ══════════════════════════════════════════════════════════════════════════
  // EXPORTACIÓN DE CLIENTES
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Descargar directorio de clientes en Excel
   * 
   * @param {Object} [params] - Filtros opcionales
   * @param {string} [params.estado] - Estado ('activo'|'inactivo')
   * @param {string} [params.tipo_cliente] - Tipo de cliente
   * @returns {Promise<Object>} Resultado de la descarga
   */
  descargarClientesExcel: async (params = {}) => {
    try {
      const response = await apiClient.get(REPORTES_ENDPOINTS.CLIENTES_EXCEL, {
        params,
        responseType: 'blob',
      });
      
      const fecha = new Date().toISOString().split('T')[0];
      descargarArchivo(response.data, `clientes_${fecha}.xlsx`);
      
      return { success: true, message: 'Reporte descargado exitosamente' };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al descargar reporte',
        code: error.code || 'DOWNLOAD_ERROR',
      };
    }
  },
  
  // ══════════════════════════════════════════════════════════════════════════
  // ALIAS PARA COMPATIBILIDAD (Despachos = Operaciones)
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Alias: Descargar despachos en Excel
   */
  descargarDespachosExcel: async (params = {}) => {
    return reportesService.descargarOperacionesExcel(params);
  },
  
  /**
   * Alias: Descargar despachos en PDF
   */
  descargarDespachosPDF: async (params = {}) => {
    return reportesService.descargarOperacionesPDF(params);
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default reportesService;