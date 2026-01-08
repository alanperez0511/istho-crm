/**
 * ISTHO CRM - Rutas de Clientes
 * 
 * Endpoints para gestión de clientes y contactos.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Controlador
const clienteController = require('../controllers/clienteController');

// Middleware
const { verificarToken } = require('../middleware/auth');
const { requiereRolMinimo, noClientes } = require('../middleware/roles');

// Validadores
const {
  crearClienteValidator,
  actualizarClienteValidator,
  idParamValidator,
  listarClientesValidator,
  crearContactoValidator,
  actualizarContactoValidator,
  contactoParamsValidator
} = require('../validators/clienteValidator');

// =============================================
// Todas las rutas requieren autenticación
// =============================================
router.use(verificarToken);

// =============================================
// RUTAS DE CLIENTES
// =============================================

/**
 * @route   GET /clientes
 * @desc    Listar clientes con paginación y filtros
 * @access  Privado (todos los roles autenticados)
 * @query   page, limit, search, estado, tipo_cliente, ciudad, sort, order
 */
router.get('/', listarClientesValidator, clienteController.listar);

/**
 * @route   GET /clientes/stats
 * @desc    Obtener estadísticas de clientes
 * @access  Privado (supervisor o superior)
 */
router.get('/stats', requiereRolMinimo('operador'), clienteController.estadisticas);

/**
 * @route   GET /clientes/:id
 * @desc    Obtener un cliente por ID
 * @access  Privado
 */
router.get('/:id', idParamValidator, clienteController.obtenerPorId);

/**
 * @route   POST /clientes
 * @desc    Crear un nuevo cliente
 * @access  Privado (supervisor o superior)
 */
router.post('/', noClientes, requiereRolMinimo('operador'), crearClienteValidator, clienteController.crear);

/**
 * @route   PUT /clientes/:id
 * @desc    Actualizar un cliente
 * @access  Privado (supervisor o superior)
 */
router.put('/:id', noClientes, requiereRolMinimo('operador'), actualizarClienteValidator, clienteController.actualizar);

/**
 * @route   DELETE /clientes/:id
 * @desc    Eliminar un cliente (soft delete)
 * @access  Privado (admin o supervisor)
 */
router.delete('/:id', requiereRolMinimo('supervisor'), idParamValidator, clienteController.eliminar);

// =============================================
// RUTAS DE CONTACTOS (anidadas en clientes)
// =============================================

/**
 * @route   GET /clientes/:id/contactos
 * @desc    Listar contactos de un cliente
 * @access  Privado
 * @query   incluir_inactivos (true/false)
 */
router.get('/:id/contactos', idParamValidator, clienteController.listarContactos);

/**
 * @route   POST /clientes/:id/contactos
 * @desc    Agregar contacto a un cliente
 * @access  Privado (operador o superior)
 */
router.post('/:id/contactos', noClientes, requiereRolMinimo('operador'), crearContactoValidator, clienteController.crearContacto);

/**
 * @route   PUT /clientes/:id/contactos/:contactoId
 * @desc    Actualizar contacto de un cliente
 * @access  Privado (operador o superior)
 */
router.put('/:id/contactos/:contactoId', noClientes, requiereRolMinimo('operador'), actualizarContactoValidator, clienteController.actualizarContacto);

/**
 * @route   DELETE /clientes/:id/contactos/:contactoId
 * @desc    Eliminar contacto de un cliente
 * @access  Privado (supervisor o superior)
 */
router.delete('/:id/contactos/:contactoId', requiereRolMinimo('supervisor'), contactoParamsValidator, clienteController.eliminarContacto);

module.exports = router;