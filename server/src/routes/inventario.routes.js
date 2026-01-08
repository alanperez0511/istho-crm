/**
 * ISTHO CRM - Rutas de Inventario
 * 
 * Endpoints para gestión de inventario.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Controlador
const inventarioController = require('../controllers/inventarioController');

// Middleware
const { verificarToken } = require('../middleware/auth');
const { requiereRolMinimo, noClientes } = require('../middleware/roles');

// Validadores
const {
  crearInventarioValidator,
  actualizarInventarioValidator,
  idParamValidator,
  clienteIdParamValidator,
  listarInventarioValidator,
  ajustarCantidadValidator
} = require('../validators/inventarioValidator');

// =============================================
// Todas las rutas requieren autenticación
// =============================================
router.use(verificarToken);

// =============================================
// RUTAS DE INVENTARIO
// =============================================

/**
 * @route   GET /inventario
 * @desc    Listar inventario con paginación y filtros
 * @access  Privado
 * @query   page, limit, search, cliente_id, estado, categoria, zona, stock_bajo, por_vencer, sort, order
 */
router.get('/', listarInventarioValidator, inventarioController.listar);

/**
 * @route   GET /inventario/stats
 * @desc    Obtener estadísticas de inventario
 * @access  Privado (operador o superior)
 * @query   cliente_id (opcional, para filtrar por cliente)
 */
router.get('/stats', requiereRolMinimo('operador'), inventarioController.estadisticas);

/**
 * @route   GET /inventario/alertas
 * @desc    Obtener alertas de stock bajo y vencimientos
 * @access  Privado (operador o superior)
 * @query   cliente_id (opcional)
 */
router.get('/alertas', requiereRolMinimo('operador'), inventarioController.alertas);

/**
 * @route   GET /inventario/cliente/:clienteId
 * @desc    Obtener inventario de un cliente específico
 * @access  Privado
 */
router.get('/cliente/:clienteId', clienteIdParamValidator, inventarioController.obtenerPorCliente);

/**
 * @route   GET /inventario/:id
 * @desc    Obtener un item de inventario por ID
 * @access  Privado
 */
router.get('/:id', idParamValidator, inventarioController.obtenerPorId);

/**
 * @route   POST /inventario
 * @desc    Crear un nuevo item de inventario
 * @access  Privado (operador o superior)
 */
router.post('/', noClientes, requiereRolMinimo('operador'), crearInventarioValidator, inventarioController.crear);

/**
 * @route   PUT /inventario/:id
 * @desc    Actualizar un item de inventario
 * @access  Privado (operador o superior)
 */
router.put('/:id', noClientes, requiereRolMinimo('operador'), actualizarInventarioValidator, inventarioController.actualizar);

/**
 * @route   POST /inventario/:id/ajustar
 * @desc    Ajustar cantidad de inventario (entrada, salida, ajuste)
 * @access  Privado (operador o superior)
 */
router.post('/:id/ajustar', noClientes, requiereRolMinimo('operador'), ajustarCantidadValidator, inventarioController.ajustarCantidad);

/**
 * @route   DELETE /inventario/:id
 * @desc    Eliminar un item de inventario
 * @access  Privado (supervisor o superior)
 */
router.delete('/:id', requiereRolMinimo('supervisor'), idParamValidator, inventarioController.eliminar);

module.exports = router;