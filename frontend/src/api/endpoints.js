/**
 * ============================================================================
 * ISTHO CRM - Endpoints API
 * ============================================================================
 * Definición centralizada de todos los endpoints de la API.
 * Facilita mantenimiento y evita strings hardcodeados.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 2.1.0
 * @date Enero 2026
 */

// ════════════════════════════════════════════════════════════════════════════
// AUTENTICACIÓN
// ════════════════════════════════════════════════════════════════════════════

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  REGISTRO: '/auth/registro',
  CAMBIAR_PASSWORD: '/auth/cambiar-password',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
};

// ════════════════════════════════════════════════════════════════════════════
// CLIENTES
// ════════════════════════════════════════════════════════════════════════════

export const CLIENTES_ENDPOINTS = {
  BASE: '/clientes',
  BY_ID: (id) => `/clientes/${id}`,
  STATS: '/clientes/stats',
  CONTACTOS: (id) => `/clientes/${id}/contactos`,
  CONTACTO: (clienteId, contactoId) => `/clientes/${clienteId}/contactos/${contactoId}`,
  CONTACTO_PRINCIPAL: (clienteId, contactoId) => `/clientes/${clienteId}/contactos/${contactoId}/principal`,
  INVENTARIO: (id) => `/clientes/${id}/inventario`,
  DESPACHOS: (id) => `/clientes/${id}/despachos`,
  DOCUMENTOS: (id) => `/clientes/${id}/documentos`,
};

// ════════════════════════════════════════════════════════════════════════════
// INVENTARIO
// ════════════════════════════════════════════════════════════════════════════

export const INVENTARIO_ENDPOINTS = {
  // CRUD Base
  BASE: '/inventario',
  BY_ID: (id) => `/inventario/${id}`,
  BY_CLIENTE: (clienteId) => `/inventario/cliente/${clienteId}`,
  
  // Estadísticas y Alertas
  STATS: '/inventario/stats',
  ALERTAS: '/inventario/alertas',
  
  // Movimientos (entradas, salidas, ajustes)
  AJUSTAR: (id) => `/inventario/${id}/ajustar`,
  MOVIMIENTOS: (id) => `/inventario/${id}/movimientos`,
  ESTADISTICAS_PRODUCTO: (id) => `/inventario/${id}/estadisticas`,
  
  // Gestión de alertas
  ATENDER_ALERTA: (alertaId) => `/inventario/alertas/${alertaId}/atender`,
  DESCARTAR_ALERTA: (alertaId) => `/inventario/alertas/${alertaId}`,
  
  // Integración WMS (futuro)
  SYNC_WMS: '/inventario/sync-wms',
};

// ════════════════════════════════════════════════════════════════════════════
// OPERACIONES
// ════════════════════════════════════════════════════════════════════════════

export const OPERACIONES_ENDPOINTS = {
  BASE: '/operaciones',
  BY_ID: (id) => `/operaciones/${id}`,
  STATS: '/operaciones/stats',
  
  // WMS
  WMS_DOCUMENTOS: '/operaciones/wms/documentos',
  WMS_DOCUMENTO: (numero) => `/operaciones/wms/documento/${numero}`,
  
  // Acciones
  AVERIAS: (id) => `/operaciones/${id}/averias`,
  DOCUMENTOS: (id) => `/operaciones/${id}/documentos`,
  CERRAR: (id) => `/operaciones/${id}/cerrar`,
  TRANSPORTE: (id) => `/operaciones/${id}/transporte`,
};

// ════════════════════════════════════════════════════════════════════════════
// DESPACHOS
// ════════════════════════════════════════════════════════════════════════════

export const DESPACHOS_ENDPOINTS = {
  BASE: '/despachos',
  BY_ID: (id) => `/despachos/${id}`,
  STATS: '/despachos/stats',
  TRAZABILIDAD: (id) => `/despachos/${id}/trazabilidad`,
};

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTOS
// ════════════════════════════════════════════════════════════════════════════

export const DOCUMENTOS_ENDPOINTS = {
  BASE: '/documentos',
  BY_ID: (id) => `/documentos/${id}`,
  UPLOAD: '/documentos/upload',
  DOWNLOAD: (id) => `/documentos/${id}/download`,
};

// ════════════════════════════════════════════════════════════════════════════
// REPORTES
// ════════════════════════════════════════════════════════════════════════════

export const REPORTES_ENDPOINTS = {
  // Dashboard consolidado
  DASHBOARD: '/reportes/dashboard',
  
  // Reportes específicos
  DESPACHOS: '/reportes/despachos',
  INVENTARIO: '/reportes/inventario',
  CLIENTES: '/reportes/clientes',
  OPERACIONES: '/reportes/operaciones',
};

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES
// ════════════════════════════════════════════════════════════════════════════

export const NOTIFICACIONES_ENDPOINTS = {
  BASE: '/notificaciones',
  MARCAR_LEIDA: (id) => `/notificaciones/${id}/leer`,
  MARCAR_TODAS: '/notificaciones/leer-todas',
};

// ════════════════════════════════════════════════════════════════════════════
// USUARIOS
// ════════════════════════════════════════════════════════════════════════════

export const USUARIOS_ENDPOINTS = {
  BASE: '/usuarios',
  BY_ID: (id) => `/usuarios/${id}`,
  PERFIL: '/usuarios/perfil',
  CAMBIAR_PASSWORD: '/usuarios/cambiar-password',
};

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD (Alias - usa reportes/dashboard)
// ════════════════════════════════════════════════════════════════════════════

export const DASHBOARD_ENDPOINTS = {
  STATS: '/reportes/dashboard',
  KPIS: '/reportes/dashboard',
  GRAFICOS: '/reportes/dashboard',
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORT UNIFICADO
// ════════════════════════════════════════════════════════════════════════════

export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  CLIENTES: CLIENTES_ENDPOINTS,
  INVENTARIO: INVENTARIO_ENDPOINTS,
  OPERACIONES: OPERACIONES_ENDPOINTS,
  DESPACHOS: DESPACHOS_ENDPOINTS,
  DOCUMENTOS: DOCUMENTOS_ENDPOINTS,
  REPORTES: REPORTES_ENDPOINTS,
  NOTIFICACIONES: NOTIFICACIONES_ENDPOINTS,
  USUARIOS: USUARIOS_ENDPOINTS,
  DASHBOARD: DASHBOARD_ENDPOINTS,
};

export default ENDPOINTS;