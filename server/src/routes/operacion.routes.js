/**
 * ISTHO CRM - Rutas de Operaciones
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

const operacionController = require('../controllers/operacionController');
const { verificarToken } = require('../middleware/auth');
const { requiereRolMinimo, noClientes } = require('../middleware/roles');
const { uploadAveria, uploadCumplido } = require('../config/multer');
const {
  crearOperacionValidator,
  actualizarTransporteValidator,
  registrarAveriaValidator,
  cerrarOperacionValidator,
  idParamValidator,
  listarOperacionesValidator
} = require('../validators/operacionValidator');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// =============================================
// RUTAS WMS (Simulación)
// =============================================

router.get('/wms/documentos', operacionController.listarDocumentosWMS);
router.get('/wms/documento/:numero', operacionController.buscarDocumentoWMS);

// =============================================
// RUTAS DE OPERACIONES
// =============================================

router.get('/', listarOperacionesValidator, operacionController.listar);
router.get('/stats', requiereRolMinimo('operador'), operacionController.estadisticas);
router.get('/:id', idParamValidator, operacionController.obtenerPorId);

router.post('/', noClientes, requiereRolMinimo('operador'), crearOperacionValidator, operacionController.crear);

router.put('/:id/transporte', noClientes, requiereRolMinimo('operador'), actualizarTransporteValidator, operacionController.actualizarTransporte);

// Averías (con upload de imagen)
router.post('/:id/averias', noClientes, requiereRolMinimo('operador'), uploadAveria.single('foto'), registrarAveriaValidator, operacionController.registrarAveria);

// Documentos/Cumplidos (con upload de archivo)
router.post('/:id/documentos', noClientes, requiereRolMinimo('operador'), uploadCumplido.single('archivo'), operacionController.subirDocumento);

// Cerrar operación
router.post('/:id/cerrar', noClientes, requiereRolMinimo('operador'), cerrarOperacionValidator, operacionController.cerrar);

// Anular operación
router.delete('/:id', requiereRolMinimo('supervisor'), idParamValidator, operacionController.anular);

module.exports = router;