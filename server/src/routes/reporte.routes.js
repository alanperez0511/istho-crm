/**
 * ISTHO CRM - Rutas de Reportes
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

const reporteController = require('../controllers/reporteController');
const { verificarToken } = require('../middleware/auth');
const { requiereRolMinimo } = require('../middleware/roles');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// =============================================
// DASHBOARD
// =============================================

router.get('/dashboard', reporteController.getDashboard);

// =============================================
// REPORTES DE OPERACIONES
// =============================================

// Exportar listado de operaciones
router.get('/operaciones/excel', requiereRolMinimo('operador'), reporteController.exportarOperacionesExcel);
router.get('/operaciones/pdf', requiereRolMinimo('operador'), reporteController.exportarOperacionesPDF);

// Exportar detalle de una operación
router.get('/operaciones/:id/excel', reporteController.exportarDetalleOperacionExcel);
router.get('/operaciones/:id/pdf', reporteController.exportarDetalleOperacionPDF);

// =============================================
// REPORTES DE INVENTARIO
// =============================================

router.get('/inventario/excel', requiereRolMinimo('operador'), reporteController.exportarInventarioExcel);
router.get('/inventario/pdf', requiereRolMinimo('operador'), reporteController.exportarInventarioPDF);

// =============================================
// REPORTES DE CLIENTES
// =============================================

router.get('/clientes/excel', requiereRolMinimo('operador'), reporteController.exportarClientesExcel);

module.exports = router;