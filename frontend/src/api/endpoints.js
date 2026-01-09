/**
 * ============================================================================
 * ISTHO CRM - Constantes de Endpoints API
 * ============================================================================
 * Definición centralizada de todas las rutas del backend.
 * Facilita el mantenimiento y evita errores de tipeo en rutas.
 * 
 * NOTA IMPORTANTE:
 * - El frontend usa "Despachos" en la UI
 * - El backend usa "Operaciones" en los endpoints
 * - El servicio despachos.service.js hace el mapeo transparente
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

// ============================================================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================================================

export const AUTH_ENDPOINTS = {
  /** POST - Iniciar sesión */
  LOGIN: '/auth/login',
  
  /** POST - Cerrar sesión */
  LOGOUT: '/auth/logout',
  
  /** GET - Obtener usuario actual */
  ME: '/auth/me',
  
  /** POST - Registrar nuevo usuario (solo admin) */
  REGISTRO: '/auth/registro',
  
  /** PUT - Cambiar contraseña propia */
  CAMBIAR_PASSWORD: '/auth/cambiar-password',
  
  /** POST - Refrescar token JWT */
  REFRESH: '/auth/refresh',
};

// ============================================================================
// ENDPOINTS DE CLIENTES
// ============================================================================

export const CLIENTES_ENDPOINTS = {
  /** GET - Listar clientes / POST - Crear cliente */
  BASE: '/clientes',
  
  /** GET - Estadísticas de clientes */
  STATS: '/clientes/stats',
  
  /** 
   * GET/PUT/DELETE - Operaciones sobre un cliente específico
   * @param {number|string} id - ID del cliente
   */
  BY_ID: (id) => `/clientes/${id}`,
  
  /** 
   * GET - Listar contactos / POST - Crear contacto
   * @param {number|string} clienteId - ID del cliente
   */
  CONTACTOS: (clienteId) => `/clientes/${clienteId}/contactos`,
  
  /** 
   * PUT/DELETE - Operaciones sobre un contacto específico
   * @param {number|string} clienteId - ID del cliente
   * @param {number|string} contactoId - ID del contacto
   */
  CONTACTO_BY_ID: (clienteId, contactoId) => `/clientes/${clienteId}/contactos/${contactoId}`,
};

// ============================================================================
// ENDPOINTS DE INVENTARIO
// ============================================================================

export const INVENTARIO_ENDPOINTS = {
  /** GET - Listar inventario / POST - Crear registro */
  BASE: '/inventario',
  
  /** GET - Estadísticas de inventario */
  STATS: '/inventario/stats',
  
  /** GET - Alertas de stock bajo y vencimiento */
  ALERTAS: '/inventario/alertas',
  
  /** 
   * GET/PUT/DELETE - Operaciones sobre un item específico
   * @param {number|string} id - ID del registro de inventario
   */
  BY_ID: (id) => `/inventario/${id}`,
  
  /** 
   * GET - Inventario filtrado por cliente
   * @param {number|string} clienteId - ID del cliente
   */
  BY_CLIENTE: (clienteId) => `/inventario/cliente/${clienteId}`,
  
  /** 
   * POST - Ajustar cantidad de inventario
   * @param {number|string} id - ID del registro de inventario
   */
  AJUSTAR: (id) => `/inventario/${id}/ajustar`,
};

// ============================================================================
// ENDPOINTS DE OPERACIONES (Backend usa "operaciones", frontend usa "despachos")
// ============================================================================

export const OPERACIONES_ENDPOINTS = {
  // ─────────────────────────────────────────────────────────────────────────
  // CRUD Principal
  // ─────────────────────────────────────────────────────────────────────────
  
  /** GET - Listar operaciones / POST - Crear operación */
  BASE: '/operaciones',
  
  /** GET - Estadísticas de operaciones */
  STATS: '/operaciones/stats',
  
  /** 
   * GET/DELETE - Operaciones sobre una operación específica
   * @param {number|string} id - ID de la operación
   */
  BY_ID: (id) => `/operaciones/${id}`,
  
  // ─────────────────────────────────────────────────────────────────────────
  // Integración WMS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** 
   * GET - Listar documentos disponibles en WMS
   * Query params: tipo ('ingreso'|'salida'), cliente_codigo
   */
  WMS_DOCUMENTOS: '/operaciones/wms/documentos',
  
  /** 
   * GET - Obtener detalle de documento WMS con productos
   * @param {string} numeroDocumento - Número del documento WMS
   */
  WMS_DOCUMENTO: (numeroDocumento) => `/operaciones/wms/documento/${numeroDocumento}`,
  
  // ─────────────────────────────────────────────────────────────────────────
  // Transporte
  // ─────────────────────────────────────────────────────────────────────────
  
  /** 
   * PUT - Actualizar información de transporte
   * @param {number|string} id - ID de la operación
   */
  TRANSPORTE: (id) => `/operaciones/${id}/transporte`,
  
  // ─────────────────────────────────────────────────────────────────────────
  // Averías
  // ─────────────────────────────────────────────────────────────────────────
  
  /** 
   * POST - Registrar avería con foto (multipart/form-data)
   * @param {number|string} id - ID de la operación
   */
  AVERIAS: (id) => `/operaciones/${id}/averias`,
  
  // ─────────────────────────────────────────────────────────────────────────
  // Documentos de Cumplido
  // ─────────────────────────────────────────────────────────────────────────
  
  /** 
   * POST - Subir documento de cumplido (multipart/form-data)
   * @param {number|string} id - ID de la operación
   */
  DOCUMENTOS: (id) => `/operaciones/${id}/documentos`,
  
  // ─────────────────────────────────────────────────────────────────────────
  // Cierre
  // ─────────────────────────────────────────────────────────────────────────
  
  /** 
   * POST - Cerrar operación (envía email opcional)
   * @param {number|string} id - ID de la operación
   */
  CERRAR: (id) => `/operaciones/${id}/cerrar`,
};

// ============================================================================
// ENDPOINTS DE REPORTES Y DASHBOARD
// ============================================================================

export const REPORTES_ENDPOINTS = {
  /** GET - Datos consolidados para dashboard */
  DASHBOARD: '/reportes/dashboard',
  
  // ─────────────────────────────────────────────────────────────────────────
  // Exportación de Operaciones (Despachos)
  // ─────────────────────────────────────────────────────────────────────────
  
  /** 
   * GET - Exportar listado de operaciones a Excel
   * Query params: fecha_desde, fecha_hasta, tipo, estado, cliente_id
   */
  OPERACIONES_EXCEL: '/reportes/operaciones/excel',
  
  /** 
   * GET - Exportar listado de operaciones a PDF
   * Query params: fecha_desde, fecha_hasta, tipo, estado, cliente_id
   */
  OPERACIONES_PDF: '/reportes/operaciones/pdf',
  
  /** 
   * GET - Exportar detalle de una operación a Excel
   * @param {number|string} id - ID de la operación
   */
  OPERACION_DETALLE_EXCEL: (id) => `/reportes/operaciones/${id}/excel`,
  
  /** 
   * GET - Exportar detalle de una operación a PDF
   * @param {number|string} id - ID de la operación
   */
  OPERACION_DETALLE_PDF: (id) => `/reportes/operaciones/${id}/pdf`,
  
  // ─────────────────────────────────────────────────────────────────────────
  // Exportación de Inventario
  // ─────────────────────────────────────────────────────────────────────────
  
  /** 
   * GET - Exportar inventario a Excel
   * Query params: cliente_id, estado, zona
   */
  INVENTARIO_EXCEL: '/reportes/inventario/excel',
  
  /** 
   * GET - Exportar inventario a PDF
   * Query params: cliente_id, estado, zona
   */
  INVENTARIO_PDF: '/reportes/inventario/pdf',
  
  // ─────────────────────────────────────────────────────────────────────────
  // Exportación de Clientes
  // ─────────────────────────────────────────────────────────────────────────
  
  /** 
   * GET - Exportar directorio de clientes a Excel
   * Query params: estado, tipo_cliente
   */
  CLIENTES_EXCEL: '/reportes/clientes/excel',
};


// ============================================================================
// ENDPOINTS DE NOTIFICACIONES
// ============================================================================

export const NOTIFICACIONES_ENDPOINTS = {
  /** GET - Listar notificaciones del usuario */
  BASE: '/notificaciones',
  
  /** GET - Obtener solo no leídas */
  NO_LEIDAS: '/notificaciones/no-leidas',
  
  /** 
   * PUT - Marcar notificación como leída
   * @param {number|string} id - ID de la notificación
   */
  MARCAR_LEIDA: (id) => `/notificaciones/${id}/leer`,
  
  /** PUT - Marcar todas como leídas */
  MARCAR_TODAS: '/notificaciones/leer-todas',
  
  /** 
   * DELETE - Eliminar notificación
   * @param {number|string} id - ID de la notificación
   */
  ELIMINAR: (id) => `/notificaciones/${id}`,
};

// ============================================================================
// ENDPOINTS DE DOCUMENTOS (Gestión Documental)
// ============================================================================

export const DOCUMENTOS_ENDPOINTS = {
  /** GET - Listar documentos */
  BASE: '/documentos',
  
  /** 
   * GET - Obtener documento por ID
   * @param {number|string} id - ID del documento
   */
  BY_ID: (id) => `/documentos/${id}`,
  
  /** POST - Subir documento (multipart/form-data) */
  UPLOAD: '/documentos/upload',
  
  /** 
   * GET - Descargar documento
   * @param {number|string} id - ID del documento
   */
  DOWNLOAD: (id) => `/documentos/${id}/download`,
  
  /** GET - Documentos próximos a vencer */
  VENCIMIENTOS: '/documentos/vencimientos',
};

// ============================================================================
// OBJETO CONSOLIDADO DE ENDPOINTS
// ============================================================================

/**
 * Objeto consolidado con todos los endpoints del sistema
 * Útil para imports simplificados
 */
export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  CLIENTES: CLIENTES_ENDPOINTS,
  INVENTARIO: INVENTARIO_ENDPOINTS,
  OPERACIONES: OPERACIONES_ENDPOINTS,
  REPORTES: REPORTES_ENDPOINTS,
  NOTIFICACIONES: NOTIFICACIONES_ENDPOINTS,
  DOCUMENTOS: DOCUMENTOS_ENDPOINTS,
};

// ============================================================================
// ALIAS PARA COMPATIBILIDAD (Frontend usa "Despachos")
// ============================================================================

/**
 * Alias de OPERACIONES_ENDPOINTS para usar en el frontend
 * El frontend habla de "Despachos", el backend de "Operaciones"
 */
export const DESPACHOS_ENDPOINTS = OPERACIONES_ENDPOINTS;

export const DESPACHOS_REPORTES = {
  EXCEL: REPORTES_ENDPOINTS.OPERACIONES_EXCEL,
  PDF: REPORTES_ENDPOINTS.OPERACIONES_PDF,
  DETALLE_EXCEL: REPORTES_ENDPOINTS.OPERACION_DETALLE_EXCEL,
  DETALLE_PDF: REPORTES_ENDPOINTS.OPERACION_DETALLE_PDF,
};

export default ENDPOINTS;