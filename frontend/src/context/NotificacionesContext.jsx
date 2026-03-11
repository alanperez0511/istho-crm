/**
 * ============================================================================
 * ISTHO CRM - Contexto de Notificaciones
 * ============================================================================
 * Provee estado global de notificaciones con polling automático.
 * Usado por la campana del header y la página de notificaciones.
 *
 * CORRECCIÓN v1.1.0:
 * - Retry automático en fetch inicial si falla
 * - Parseo robusto de respuestas del servicio
 * - Logging de errores (no silenciados completamente)
 *
 * @author Coordinación TI ISTHO
 * @version 1.1.0
 * @date Marzo 2026
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import notificacionesService from '../api/notificacionesService';

const NotificacionesContext = createContext();

const POLLING_INTERVAL = 30000; // 30 segundos
const INITIAL_RETRY_DELAY = 3000; // 3 segundos para retry inicial

export const useNotificaciones = () => {
  const context = useContext(NotificacionesContext);
  if (!context) {
    throw new Error('useNotificaciones must be used within a NotificacionesProvider');
  }
  return context;
};

export const NotificacionesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const retryRef = useRef(null);

  // Obtener conteo de no leídas
  const fetchCount = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    try {
      const count = await notificacionesService.getCount();
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    } catch (err) {
      // Log en desarrollo para debugging
      if (import.meta.env.DEV) {
        console.warn('[NotificacionesContext] Error en fetchCount:', err);
      }
    }
  }, [user, isAuthenticated]);

  // Obtener últimas notificaciones (para el dropdown)
  const fetchRecientes = useCallback(async () => {
    if (!user || !isAuthenticated) return [];
    setLoading(true);
    try {
      const result = await notificacionesService.getAll({ page: 1, limit: 5 });
      const data = result?.data || [];
      setNotificaciones(data);
      // También actualizar el conteo
      await notificacionesService.getCount().then(count => {
        if (typeof count === 'number') setUnreadCount(count);
      }).catch(() => {});
      return data;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[NotificacionesContext] Error en fetchRecientes:', err);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Marcar una como leída
  const marcarLeida = useCallback(async (id) => {
    try {
      await notificacionesService.marcarLeida(id);
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true, fecha_lectura: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error al marcar leída:', err);
    }
  }, []);

  // Marcar todas como leídas
  const marcarTodasLeidas = useCallback(async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      setNotificaciones(prev =>
        prev.map(n => ({ ...n, leida: true, fecha_lectura: new Date() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error al marcar todas leídas:', err);
    }
  }, []);

  // Refrescar todo (conteo + lista)
  const refresh = useCallback(async () => {
    await Promise.all([fetchCount(), fetchRecientes()]);
  }, [fetchCount, fetchRecientes]);

  // Polling automático del conteo
  useEffect(() => {
    if (!user || !isAuthenticated) {
      setUnreadCount(0);
      setNotificaciones([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
      return;
    }

    // Fetch inicial
    fetchCount();

    // Retry después de un delay corto (por si el token no estaba listo)
    retryRef.current = setTimeout(() => {
      fetchCount();
    }, INITIAL_RETRY_DELAY);

    // Polling regular
    intervalRef.current = setInterval(fetchCount, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [user, isAuthenticated, fetchCount]);

  return (
    <NotificacionesContext.Provider
      value={{
        unreadCount,
        notificaciones,
        loading,
        fetchCount,
        fetchRecientes,
        marcarLeida,
        marcarTodasLeidas,
        refresh,
      }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
};
