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
const reporteRoutes = require('./reporte.routes');
const notificacionesRoutes = require('./notificacionesRoutes');

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
      reportes: '/reportes - Reportes y exportación',
      notificaciones: '/notificaciones - Notificaciones'
    }
  });
});

// Montar rutas
router.use('/auth', authRoutes);
router.use('/clientes', clienteRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/operaciones', operacionRoutes);
router.use('/reportes', reporteRoutes);
router.use('/notificaciones', notificacionesRoutes);

module.exports = router;