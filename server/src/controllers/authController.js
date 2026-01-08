/**
 * ISTHO CRM - Controlador de Autenticación
 * 
 * Maneja login, registro, logout y gestión de tokens.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const jwtConfig = require('../config/jwt');
const { Usuario, Auditoria } = require('../models');
const { 
  success, 
  successMessage, 
  created,
  error: errorResponse, 
  unauthorized, 
  notFound,
  conflict,
  serverError 
} = require('../utils/responses');
const logger = require('../utils/logger');

// Constantes de seguridad
const MAX_INTENTOS_LOGIN = 5;
const TIEMPO_BLOQUEO_MINUTOS = 15;

/**
 * Generar token JWT
 * @param {Object} usuario - Datos del usuario
 * @returns {string} Token JWT
 */
const generarToken = (usuario) => {
  const payload = {
    id: usuario.id,
    username: usuario.username,
    email: usuario.email,
    rol: usuario.rol
  };
  
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithm: jwtConfig.algorithm
  });
};

/**
 * POST /auth/login
 * Iniciar sesión
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario por email
    const usuario = await Usuario.findByEmail(email);
    
    if (!usuario) {
      logger.warn('Intento de login con email no registrado:', { email });
      return unauthorized(res, 'Credenciales inválidas');
    }
    
    // Verificar si está bloqueado
    if (usuario.estaBloqueado()) {
      const tiempoRestante = Math.ceil(
        (new Date(usuario.bloqueado_hasta) - new Date()) / 60000
      );
      return errorResponse(
        res,
        `Cuenta bloqueada temporalmente. Intente en ${tiempoRestante} minutos`,
        423,
        null,
        'ACCOUNT_LOCKED'
      );
    }
    
    // Verificar si está activo
    if (!usuario.activo) {
      return errorResponse(
        res,
        'Cuenta desactivada. Contacte al administrador',
        403,
        null,
        'ACCOUNT_DISABLED'
      );
    }
    
    // Verificar contraseña
    const passwordValido = await usuario.verificarPassword(password);
    
    if (!passwordValido) {
      // Incrementar intentos fallidos
      usuario.intentos_fallidos += 1;
      
      // Bloquear si excede máximo
      if (usuario.intentos_fallidos >= MAX_INTENTOS_LOGIN) {
        usuario.bloqueado_hasta = new Date(Date.now() + TIEMPO_BLOQUEO_MINUTOS * 60000);
        logger.warn('Cuenta bloqueada por múltiples intentos:', { 
          email, 
          intentos: usuario.intentos_fallidos 
        });
      }
      
      await usuario.save();
      
      return unauthorized(res, 'Credenciales inválidas');
    }
    
    // Login exitoso - resetear intentos y actualizar último acceso
    usuario.intentos_fallidos = 0;
    usuario.bloqueado_hasta = null;
    usuario.ultimo_acceso = new Date();
    await usuario.save();
    
    // Generar token
    const token = generarToken(usuario);
    
    // Registrar en auditoría
    await Auditoria.registrar({
      tabla: 'usuarios',
      registro_id: usuario.id,
      accion: 'login',
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre_completo,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      descripcion: `Inicio de sesión exitoso: ${usuario.email}`
    });
    
    logger.info('Login exitoso:', { 
      userId: usuario.id, 
      email: usuario.email 
    });
    
    return successMessage(res, 'Inicio de sesión exitoso', {
      user: usuario.toPublicJSON(),
      token,
      expiresIn: jwtConfig.expiresIn
    });
    
  } catch (error) {
    logger.error('Error en login:', { message: error.message });
    return serverError(res, 'Error al procesar el login', error);
  }
};

/**
 * GET /auth/me
 * Obtener usuario actual
 */
const me = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] }
    });
    
    if (!usuario) {
      return notFound(res, 'Usuario no encontrado');
    }
    
    return success(res, usuario.toPublicJSON());
    
  } catch (error) {
    logger.error('Error en /auth/me:', { message: error.message });
    return serverError(res, 'Error al obtener información del usuario', error);
  }
};

/**
 * POST /auth/registro
 * Registrar nuevo usuario (solo admin)
 */
const registro = async (req, res) => {
  try {
    const { username, email, password, nombre_completo, rol } = req.body;
    
    // Verificar email duplicado
    const existeEmail = await Usuario.findByEmail(email);
    if (existeEmail) {
      return conflict(res, 'El email ya está registrado');
    }
    
    // Verificar username duplicado
    const existeUsername = await Usuario.findByUsername(username);
    if (existeUsername) {
      return conflict(res, 'El nombre de usuario ya está en uso');
    }
    
    // Crear usuario
    const nuevoUsuario = await Usuario.crearConPassword({
      username,
      email: email.toLowerCase(),
      password,
      nombre_completo,
      rol: rol || 'operador'
    });
    
    // Registrar en auditoría
    await Auditoria.registrar({
      tabla: 'usuarios',
      registro_id: nuevoUsuario.id,
      accion: 'crear',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      datos_nuevos: { username, email, nombre_completo, rol },
      ip_address: req.ip,
      descripcion: `Usuario creado: ${username}`
    });
    
    logger.info('Usuario creado:', { 
      userId: nuevoUsuario.id, 
      createdBy: req.user.id 
    });
    
    return created(res, 'Usuario creado exitosamente', nuevoUsuario.toPublicJSON());
    
  } catch (error) {
    logger.error('Error en registro:', { message: error.message });
    return serverError(res, 'Error al crear usuario', error);
  }
};

/**
 * POST /auth/logout
 * Cerrar sesión
 */
const logout = async (req, res) => {
  try {
    // Registrar en auditoría
    await Auditoria.registrar({
      tabla: 'usuarios',
      registro_id: req.user.id,
      accion: 'logout',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      ip_address: req.ip,
      descripcion: `Cierre de sesión: ${req.user.email}`
    });
    
    logger.info('Logout exitoso:', { userId: req.user.id });
    
    return successMessage(res, 'Sesión cerrada exitosamente');
    
  } catch (error) {
    logger.error('Error en logout:', { message: error.message });
    return serverError(res, 'Error al cerrar sesión', error);
  }
};

/**
 * PUT /auth/cambiar-password
 * Cambiar contraseña del usuario actual
 */
const cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    
    // Buscar usuario
    const usuario = await Usuario.findByPk(req.user.id);
    
    if (!usuario) {
      return notFound(res, 'Usuario no encontrado');
    }
    
    // Verificar contraseña actual
    const passwordValido = await usuario.verificarPassword(password_actual);
    
    if (!passwordValido) {
      return errorResponse(res, 'La contraseña actual es incorrecta', 400);
    }
    
    // Actualizar contraseña
    usuario.password_hash = password_nuevo; // El hook la hasheará
    await usuario.save();
    
    // Registrar en auditoría
    await Auditoria.registrar({
      tabla: 'usuarios',
      registro_id: usuario.id,
      accion: 'actualizar',
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre_completo,
      ip_address: req.ip,
      descripcion: 'Cambio de contraseña'
    });
    
    logger.info('Contraseña cambiada:', { userId: usuario.id });
    
    return successMessage(res, 'Contraseña actualizada exitosamente');
    
  } catch (error) {
    logger.error('Error en cambiarPassword:', { message: error.message });
    return serverError(res, 'Error al cambiar la contraseña', error);
  }
};

/**
 * POST /auth/forgot-password
 * Solicitar recuperación de contraseña
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Buscar usuario
    const usuario = await Usuario.findByEmail(email);
    
    // Siempre responder igual (seguridad)
    if (!usuario) {
      return successMessage(
        res, 
        'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      );
    }
    
    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Guardar token (expira en 1 hora)
    usuario.reset_token = resetTokenHash;
    usuario.reset_token_expires = new Date(Date.now() + 60 * 60 * 1000);
    await usuario.save();
    
    // TODO: Enviar email con token
    // await emailService.enviarRecuperacionPassword(usuario.email, resetToken);
    
    logger.info('Token de recuperación generado:', { email });
    
    return successMessage(
      res, 
      'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    );
    
  } catch (error) {
    logger.error('Error en forgotPassword:', { message: error.message });
    return serverError(res, 'Error al procesar la solicitud', error);
  }
};

/**
 * POST /auth/reset-password
 * Resetear contraseña con token
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Hash del token recibido
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Buscar usuario con token válido
    const usuario = await Usuario.findOne({
      where: {
        reset_token: resetTokenHash,
        reset_token_expires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });
    
    if (!usuario) {
      return errorResponse(
        res, 
        'Token inválido o expirado', 
        400,
        null,
        'INVALID_TOKEN'
      );
    }
    
    // Actualizar contraseña y limpiar token
    usuario.password_hash = password;
    usuario.reset_token = null;
    usuario.reset_token_expires = null;
    usuario.intentos_fallidos = 0;
    usuario.bloqueado_hasta = null;
    await usuario.save();
    
    // Registrar en auditoría
    await Auditoria.registrar({
      tabla: 'usuarios',
      registro_id: usuario.id,
      accion: 'actualizar',
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre_completo,
      ip_address: req.ip,
      descripcion: 'Contraseña restablecida mediante token'
    });
    
    logger.info('Contraseña restablecida:', { userId: usuario.id });
    
    return successMessage(res, 'Contraseña restablecida exitosamente');
    
  } catch (error) {
    logger.error('Error en resetPassword:', { message: error.message });
    return serverError(res, 'Error al restablecer la contraseña', error);
  }
};

/**
 * POST /auth/refresh
 * Refrescar token (obtener nuevo token con el actual válido)
 */
const refreshToken = async (req, res) => {
  try {
    // El usuario ya está verificado por el middleware
    const usuario = await Usuario.findByPk(req.user.id);
    
    if (!usuario || !usuario.activo) {
      return unauthorized(res, 'Usuario no válido');
    }
    
    // Generar nuevo token
    const token = generarToken(usuario);
    
    logger.debug('Token refrescado:', { userId: usuario.id });
    
    return success(res, {
      token,
      expiresIn: jwtConfig.expiresIn
    });
    
  } catch (error) {
    logger.error('Error en refreshToken:', { message: error.message });
    return serverError(res, 'Error al refrescar token', error);
  }
};

module.exports = {
  login,
  me,
  registro,
  logout,
  cambiarPassword,
  forgotPassword,
  resetPassword,
  refreshToken
};