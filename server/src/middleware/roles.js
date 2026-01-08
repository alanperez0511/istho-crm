/**
 * ISTHO CRM - Middleware de Control de Roles
 * 
 * Controla el acceso a recursos según el rol del usuario.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const { forbidden } = require('../utils/responses');
const { ROLES } = require('../utils/constants');

/**
 * Jerarquía de roles (mayor número = más permisos)
 */
const JERARQUIA_ROLES = {
  [ROLES.CLIENTE]: 1,
  [ROLES.OPERADOR]: 2,
  [ROLES.SUPERVISOR]: 3,
  [ROLES.ADMIN]: 4
};

/**
 * Middleware que requiere roles específicos
 * @param  {...string} rolesPermitidos - Roles que pueden acceder
 * @returns {Function} Middleware
 * 
 * @example
 * router.delete('/:id', verificarToken, requiereRol('admin'), eliminar);
 * router.get('/', verificarToken, requiereRol('admin', 'supervisor'), listar);
 */
const requiereRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Verificar que existe usuario (debe usarse después de verificarToken)
    if (!req.user) {
      return forbidden(res, 'Acceso denegado');
    }
    
    const rolUsuario = req.user.rol;
    
    // Verificar si el rol está en la lista de permitidos
    if (rolesPermitidos.includes(rolUsuario)) {
      return next();
    }
    
    return forbidden(res, `Esta acción requiere rol: ${rolesPermitidos.join(' o ')}`);
  };
};

/**
 * Middleware que requiere nivel de rol mínimo
 * @param {string} rolMinimo - Rol mínimo requerido
 * @returns {Function} Middleware
 * 
 * @example
 * router.put('/:id', verificarToken, requiereRolMinimo('supervisor'), actualizar);
 */
const requiereRolMinimo = (rolMinimo) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Acceso denegado');
    }
    
    const nivelUsuario = JERARQUIA_ROLES[req.user.rol] || 0;
    const nivelMinimo = JERARQUIA_ROLES[rolMinimo] || 999;
    
    if (nivelUsuario >= nivelMinimo) {
      return next();
    }
    
    return forbidden(res, `Se requiere rol ${rolMinimo} o superior`);
  };
};

/**
 * Middleware para verificar que es admin
 */
const soloAdmin = requiereRol(ROLES.ADMIN);

/**
 * Middleware para verificar que es supervisor o admin
 */
const supervisorOAdmin = requiereRol(ROLES.ADMIN, ROLES.SUPERVISOR);

/**
 * Middleware para verificar que NO es cliente
 */
const noClientes = (req, res, next) => {
  if (!req.user) {
    return forbidden(res, 'Acceso denegado');
  }
  
  if (req.user.rol === ROLES.CLIENTE) {
    return forbidden(res, 'Los clientes no pueden acceder a este recurso');
  }
  
  next();
};

module.exports = {
  requiereRol,
  requiereRolMinimo,
  soloAdmin,
  supervisorOAdmin,
  noClientes,
  JERARQUIA_ROLES
};