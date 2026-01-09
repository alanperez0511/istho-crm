/**
 * ============================================================================
 * ISTHO CRM - Hook useNotification
 * ============================================================================
 * Hook para mostrar notificaciones toast usando notistack.
 * Provee métodos convenientes para diferentes tipos de notificaciones.
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 * 
 * @example
 * const { success, error, warning, info } = useNotification();
 * 
 * success('Cliente creado correctamente');
 * error('Error al guardar', { persist: true });
 * warning('Stock bajo detectado');
 * info('Sincronizando con WMS...');
 */

import { useSnackbar } from 'notistack';
import { useCallback } from 'react';

const useNotification = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  
  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODOS BASE
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Mostrar notificación genérica
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones de notistack
   */
  const notify = useCallback((message, options = {}) => {
    return enqueueSnackbar(message, {
      ...options,
      style: {
        fontFamily: 'Arial, sans-serif',
        ...options.style,
      },
    });
  }, [enqueueSnackbar]);
  
  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODOS POR TIPO
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Notificación de éxito (verde)
   */
  const success = useCallback((message, options = {}) => {
    return notify(message, {
      variant: 'success',
      autoHideDuration: 3000,
      ...options,
    });
  }, [notify]);
  
  /**
   * Notificación de error (rojo)
   */
  const error = useCallback((message, options = {}) => {
    return notify(message, {
      variant: 'error',
      autoHideDuration: 5000,
      ...options,
    });
  }, [notify]);
  
  /**
   * Notificación de advertencia (amarillo)
   */
  const warning = useCallback((message, options = {}) => {
    return notify(message, {
      variant: 'warning',
      autoHideDuration: 4000,
      ...options,
    });
  }, [notify]);
  
  /**
   * Notificación informativa (azul)
   */
  const info = useCallback((message, options = {}) => {
    return notify(message, {
      variant: 'info',
      autoHideDuration: 3000,
      ...options,
    });
  }, [notify]);
  
  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODOS ESPECIALIZADOS ISTHO
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Notificación de operación guardada
   * @param {string} entity - Nombre de la entidad (Cliente, Despacho, etc.)
   */
  const saved = useCallback((entity = 'Registro') => {
    return success(entity + ' guardado correctamente');
  }, [success]);
  
  /**
   * Notificación de operación eliminada
   * @param {string} entity - Nombre de la entidad
   */
  const deleted = useCallback((entity = 'Registro') => {
    return success(entity + ' eliminado correctamente');
  }, [success]);
  
  /**
   * Notificación de error de API
   * Extrae el mensaje del error de forma inteligente
   * @param {Error} err - Error de la API
   */
  const apiError = useCallback((err) => {
    // Extraer mensaje del error
    let message = 'Error de conexión con el servidor';
    
    if (err && err.response && err.response.data) {
      message = err.response.data.message || err.response.data.error || message;
    } else if (err && err.message) {
      message = err.message;
    }
    
    // Persistir errores 500
    const shouldPersist = err && err.response && err.response.status === 500;
    
    return error(message, { 
      persist: shouldPersist,
    });
  }, [error]);
  
  /**
   * Notificación de sincronización WMS
   * @param {string} status - Estado: success, error, o loading
   */
  const wmsSync = useCallback((status) => {
    const st = status || 'success';
    if (st === 'success') {
      return success('Sincronización con WMS completada');
    } else if (st === 'error') {
      return error('Error al sincronizar con WMS');
    } else {
      return info('Sincronizando con WMS...');
    }
  }, [success, error, info]);
  
  /**
   * Notificación de despacho cerrado
   * @param {string} numero - Número del despacho
   */
  const despachoCerrado = useCallback((numero) => {
    return success('Despacho ' + numero + ' cerrado correctamente');
  }, [success]);
  
  /**
   * Notificación de alerta de stock
   * @param {number} count - Cantidad de productos con alerta
   */
  const stockAlert = useCallback((count) => {
    return warning(count + ' producto(s) con stock bajo o agotado');
  }, [warning]);
  
  /**
   * Notificación de documento subido
   * @param {string} name - Nombre del documento
   */
  const documentUploaded = useCallback((name) => {
    return success('Documento "' + name + '" subido correctamente');
  }, [success]);
  
  /**
   * Notificación de correo enviado
   * @param {string} to - Destinatario del correo
   */
  const emailSent = useCallback((to) => {
    return success('Correo enviado a ' + to);
  }, [success]);

  /**
   * Notificación de operación creada
   * @param {string} tipo - Tipo de operación (ingreso/salida)
   * @param {string} numero - Número de la operación
   */
  const operacionCreada = useCallback((tipo, numero) => {
    return success('Operación de ' + tipo + ' ' + numero + ' creada correctamente');
  }, [success]);

  /**
   * Notificación de avería registrada
   */
  const averiaRegistrada = useCallback(() => {
    return success('Avería registrada correctamente');
  }, [success]);

  /**
   * Notificación de cliente actualizado
   */
  const clienteActualizado = useCallback(() => {
    return success('Cliente actualizado correctamente');
  }, [success]);

  /**
   * Notificación de contacto agregado
   */
  const contactoAgregado = useCallback(() => {
    return success('Contacto agregado correctamente');
  }, [success]);

  /**
   * Notificación de sesión expirada
   */
  const sessionExpired = useCallback(() => {
    return warning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }, [warning]);

  /**
   * Notificación de permiso denegado
   */
  const permissionDenied = useCallback(() => {
    return error('No tienes permiso para realizar esta acción');
  }, [error]);
  
  // ══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════════
  
  return {
    // Base
    notify: notify,
    close: closeSnackbar,
    closeAll: function() { closeSnackbar(); },
    
    // Por tipo
    success: success,
    error: error,
    warning: warning,
    info: info,
    
    // Especializados ISTHO
    saved: saved,
    deleted: deleted,
    apiError: apiError,
    wmsSync: wmsSync,
    despachoCerrado: despachoCerrado,
    stockAlert: stockAlert,
    documentUploaded: documentUploaded,
    emailSent: emailSent,
    operacionCreada: operacionCreada,
    averiaRegistrada: averiaRegistrada,
    clienteActualizado: clienteActualizado,
    contactoAgregado: contactoAgregado,
    sessionExpired: sessionExpired,
    permissionDenied: permissionDenied,
  };
};

export default useNotification;