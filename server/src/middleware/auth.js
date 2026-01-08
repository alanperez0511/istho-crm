/**
 * ISTHO CRM - Middleware de Autenticación
 * 
 * Verifica tokens JWT y protege rutas.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { Usuario } = require('../models');
const { unauthorized, forbidden } = require('../utils/responses');
const logger = require('../utils/logger');

/**
 * Middleware para verificar token JWT
 * Agrega el usuario decodificado a req.user
 */
const verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return unauthorized(res, 'Token de acceso requerido');
    }
    
    // Formato esperado: "Bearer <token>"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return unauthorized(res, 'Formato de token inválido. Use: Bearer <token>');
    }
    
    const token = parts[1];
    
    // Verificar token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    // Buscar usuario en BD para verificar que sigue activo
    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'nombre_completo', 'rol', 'activo']
    });
    
    if (!usuario) {
      return unauthorized(res, 'Usuario no encontrado');
    }
    
    if (!usuario.activo) {
      return forbidden(res, 'Usuario desactivado. Contacte al administrador');
    }
    
    // Agregar usuario a la request
    req.user = {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol
    };
    
    next();
    
  } catch (error) {
    logger.warn('Error de autenticación:', { 
      message: error.message,
      ip: req.ip 
    });
    
    if (error.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expirado. Inicie sesión nuevamente');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Token inválido');
    }
    
    return unauthorized(res, 'Error de autenticación');
  }
};

/**
 * Middleware opcional - No falla si no hay token
 * Útil para rutas que funcionan diferente con/sin auth
 */
const verificarTokenOpcional = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    req.user = null;
    return next();
  }
  
  // Si hay token, verificarlo normalmente
  return verificarToken(req, res, next);
};

module.exports = {
  verificarToken,
  verificarTokenOpcional
};