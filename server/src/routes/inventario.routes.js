/**
 * ============================================================================
 * ISTHO CRM - Rutas de Inventario
 * ============================================================================
 * Define todos los endpoints del módulo de inventario:
 * - CRUD de productos
 * - Movimientos (entradas/salidas/ajustes)
 * - Alertas
 * - Estadísticas
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 2.0.0
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const validate = require('../validators/inventarioValidator');

// ════════════════════════════════════════════════════════════════════════════
// VALIDADORES
// ════════════════════════════════════════════════════════════════════════════

const validateCreate = [
  body('cliente_id')
    .notEmpty().withMessage('El cliente es requerido')
    .isInt().withMessage('ID de cliente inválido'),
  body('sku')
    .optional()
    .isString().withMessage('SKU debe ser texto')
    .isLength({ max: 50 }).withMessage('SKU máximo 50 caracteres'),
  body('codigo')
    .optional()
    .isString().withMessage('Código debe ser texto'),
  body('producto')
    .optional()
    .isString().withMessage('Nombre del producto debe ser texto'),
  body('nombre')
    .optional()
    .isString().withMessage('Nombre debe ser texto'),
  body('cantidad')
    .optional()
    .isFloat({ min: 0 }).withMessage('Cantidad debe ser un número positivo'),
  body('stock_actual')
    .optional()
    .isFloat({ min: 0 }).withMessage('Stock debe ser un número positivo'),
  body('stock_minimo')
    .optional()
    .isFloat({ min: 0 }).withMessage('Stock mínimo debe ser un número positivo'),
  body('costo_unitario')
    .optional()
    .isFloat({ min: 0 }).withMessage('Costo debe ser un número positivo'),
];

const validateUpdate = [
  param('id').isInt().withMessage('ID inválido'),
  body('producto')
    .optional()
    .isString().withMessage('Nombre debe ser texto'),
  body('cantidad')
    .optional()
    .isFloat({ min: 0 }).withMessage('Cantidad debe ser positiva'),
];

const validateAjuste = [
  param('id').isInt().withMessage('ID inválido'),
  body('cantidad')
    .notEmpty().withMessage('La cantidad es requerida')
    .isFloat().withMessage('Cantidad debe ser un número'),
  body('tipo')
    .notEmpty().withMessage('El tipo es requerido')
    .isIn(['entrada', 'salida', 'ajuste']).withMessage('Tipo debe ser: entrada, salida o ajuste'),
  body('motivo')
    .optional()
    .isString().withMessage('Motivo debe ser texto'),
];

const validateId = [
  param('id').isInt().withMessage('ID inválido')
];

// ════════════════════════════════════════════════════════════════════════════
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ════════════════════════════════════════════════════════════════════════════

router.use(authenticate);

// ════════════════════════════════════════════════════════════════════════════
// RUTAS DE CONSULTA (Todos los usuarios autenticados)
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/inventario
 * Listar inventario con filtros y paginación
 * 
 * Query params:
 * - page, limit: Paginación
 * - search: Búsqueda en producto, SKU, código barras
 * - cliente_id: Filtrar por cliente
 * - categoria: Filtrar por categoría
 * - zona, bodega: Filtrar por zona/bodega
 * - estado: Filtrar por estado
 * - stock_bajo: true para solo stock bajo
 * - por_vencer: true para próximos a vencer
 */
router.get('/', inventarioController.listar);

/**
 * GET /api/v1/inventario/stats
 * Obtener estadísticas/KPIs de inventario
 * 
 * Query params:
 * - cliente_id: Filtrar por cliente (opcional)
 */
router.get('/stats', inventarioController.estadisticas);

/**
 * GET /api/v1/inventario/alertas
 * Obtener alertas de stock bajo, agotados y vencimientos
 * 
 * Query params:
 * - cliente_id: Filtrar por cliente
 * - tipo: 'agotado', 'bajo_stock', 'vencimiento'
 */
router.get('/alertas', inventarioController.alertas);

/**
 * GET /api/v1/inventario/cliente/:clienteId
 * Obtener inventario de un cliente específico
 */
router.get(
  '/cliente/:clienteId',
  param('clienteId').isInt().withMessage('ID de cliente inválido'),
  validate,
  inventarioController.obtenerPorCliente
);

/**
 * GET /api/v1/inventario/:id
 * Obtener un item de inventario por ID
 */
router.get(
  '/:id',
  validateId,
  validate,
  inventarioController.obtenerPorId
);

/**
 * GET /api/v1/inventario/:id/movimientos
 * Obtener historial de movimientos de un producto
 * 
 * Query params:
 * - page, limit: Paginación
 */
router.get(
  '/:id/movimientos',
  validateId,
  validate,
  inventarioController.obtenerMovimientos
);

/**
 * GET /api/v1/inventario/:id/estadisticas
 * Obtener estadísticas de movimientos para gráficos
 * 
 * Query params:
 * - meses: Número de meses hacia atrás (default: 6)
 */
router.get(
  '/:id/estadisticas',
  validateId,
  validate,
  inventarioController.obtenerEstadisticasProducto
);

// ════════════════════════════════════════════════════════════════════════════
// RUTAS DE MODIFICACIÓN (Operador+)
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/v1/inventario
 * Crear un nuevo item de inventario
 */
router.post(
  '/',
  authorize(['admin', 'supervisor', 'operador']),
  validateCreate,
  validate,
  inventarioController.crear
);

/**
 * PUT /api/v1/inventario/:id
 * Actualizar un item de inventario
 */
router.put(
  '/:id',
  authorize(['admin', 'supervisor', 'operador']),
  validateUpdate,
  validate,
  inventarioController.actualizar
);

/**
 * POST /api/v1/inventario/:id/ajustar
 * Ajustar cantidad (entrada, salida, ajuste)
 */
router.post(
  '/:id/ajustar',
  authorize(['admin', 'supervisor', 'operador']),
  validateAjuste,
  validate,
  inventarioController.ajustarCantidad
);

/**
 * POST /api/v1/inventario/:id/movimientos
 * Alias de ajustar - Registrar movimiento
 */
router.post(
  '/:id/movimientos',
  authorize(['admin', 'supervisor', 'operador']),
  validateAjuste,
  validate,
  inventarioController.ajustarCantidad
);

// ════════════════════════════════════════════════════════════════════════════
// RUTAS DE ALERTAS (Operador+)
// ════════════════════════════════════════════════════════════════════════════

/**
 * PUT /api/v1/inventario/alertas/:alertaId/atender
 * Marcar una alerta como atendida
 */
router.put(
  '/alertas/:alertaId/atender',
  authorize(['admin', 'supervisor', 'operador']),
  inventarioController.atenderAlerta
);

/**
 * DELETE /api/v1/inventario/alertas/:alertaId
 * Descartar una alerta
 */
router.delete(
  '/alertas/:alertaId',
  authorize(['admin', 'supervisor', 'operador']),
  inventarioController.descartarAlerta
);

// ════════════════════════════════════════════════════════════════════════════
// RUTAS DE ELIMINACIÓN (Supervisor+)
// ════════════════════════════════════════════════════════════════════════════

/**
 * DELETE /api/v1/inventario/:id
 * Eliminar un item de inventario
 */
router.delete(
  '/:id',
  authorize(['admin', 'supervisor']),
  validateId,
  validate,
  inventarioController.eliminar
);

module.exports = router;
