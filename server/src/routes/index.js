/**
 * ISTHO CRM - Router Principal
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth.routes');
const clienteRoutes = require('./cliente.routes');
const inventarioRoutes = require('./inventario.routes');
const operacionRoutes = require('./operacion.routes');
const auditoriasRoutes = require('./auditorias.routes');
const reporteRoutes = require('./reporte.routes');
const notificacionesRoutes = require('./notificacionesRoutes');
const wmsSyncRoutes = require('./wmsSync.routes');
const plantillaEmailRoutes = require('./plantillaEmail.routes');

// Info de la API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ISTHO CRM API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/auth - Autenticación y usuarios',
      clientes: '/clientes - Gestión de clientes y contactos',
      inventario: '/inventario - Gestión de inventario y stock',
      operaciones: '/operaciones - Ingresos y salidas de mercancía',
      auditorias: '/auditorias - Auditorías WMS (entradas y salidas)',
      reportes: '/reportes - Reportes y exportación',
      notificaciones: '/notificaciones - Notificaciones',
      wms: '/wms/sync - Sincronización con WMS Copérnico'
    }
  });
});

// Montar rutas
router.use('/auth', authRoutes);
router.use('/clientes', clienteRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/operaciones', operacionRoutes);
router.use('/auditorias', auditoriasRoutes);
router.use('/reportes', reporteRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/wms/sync', wmsSyncRoutes);
router.use('/plantillas-email', plantillaEmailRoutes);

module.exports = router;