/**
 * ISTHO CRM - Controlador de Administración
 *
 * CRUD de Usuarios internos, Roles y Permisos.
 *
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Usuario, Rol, Permiso, RolPermiso, Cliente, sequelize } = require('../models');
const { success, successMessage, created, serverError, notFound, badRequest, forbidden } = require('../utils/responses');
const { invalidarCachePermisos } = require('../middleware/auth');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════════════════
// USUARIOS INTERNOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/usuarios
 */
const listarUsuarios = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, rol_id, activo, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { nombre_completo: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (rol_id) where.rol_id = rol_id;
    if (activo !== undefined) where.activo = activo === 'true';

    const { rows, count } = await Usuario.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] },
      include: [
        { model: Rol, as: 'rolInfo', attributes: ['id', 'nombre', 'codigo', 'color', 'nivel_jerarquia'] },
        { model: Cliente, as: 'cliente', attributes: ['id', 'razon_social', 'codigo_cliente'], required: false }
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return success(res, {
      usuarios: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error al listar usuarios:', { message: error.message });
    return serverError(res, 'Error al listar usuarios', error);
  }
};

/**
 * GET /admin/usuarios/:id
 */
const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] },
      include: [
        { model: Rol, as: 'rolInfo', attributes: ['id', 'nombre', 'codigo', 'color', 'nivel_jerarquia'] },
        { model: Cliente, as: 'cliente', attributes: ['id', 'razon_social', 'codigo_cliente'], required: false }
      ]
    });

    if (!usuario) return notFound(res, 'Usuario no encontrado');
    return success(res, usuario);
  } catch (error) {
    logger.error('Error al obtener usuario:', { message: error.message });
    return serverError(res, 'Error al obtener usuario', error);
  }
};

/**
 * POST /admin/usuarios
 */
const crearUsuario = async (req, res) => {
  try {
    const { username, email, password, nombre, apellido, telefono, cargo, departamento, rol_id, cliente_id } = req.body;

    if (!username || !email || !password || !rol_id) {
      return badRequest(res, 'username, email, password y rol_id son requeridos');
    }

    // Verificar que el rol existe
    const rol = await Rol.findByPk(rol_id);
    if (!rol) return badRequest(res, 'El rol especificado no existe');

    // Verificar unicidad
    const existente = await Usuario.findOne({
      where: { [Op.or]: [{ username }, { email: email.toLowerCase() }] }
    });
    if (existente) {
      return badRequest(res, existente.username === username
        ? 'El username ya está en uso'
        : 'El email ya está registrado'
      );
    }

    const usuario = await Usuario.create({
      username,
      email: email.toLowerCase(),
      password_hash: password,
      nombre,
      apellido,
      telefono,
      cargo,
      departamento,
      rol: rol.codigo,
      rol_id: rol.id,
      cliente_id: rol.es_cliente ? cliente_id : null,
      activo: true,
      invitado_por: req.user.id,
      fecha_invitacion: new Date()
    });

    const resultado = await Usuario.findByPk(usuario.id, {
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] },
      include: [{ model: Rol, as: 'rolInfo', attributes: ['id', 'nombre', 'codigo', 'color'] }]
    });

    logger.info('Usuario creado:', { id: usuario.id, username, rol: rol.codigo, creadoPor: req.user.id });
    return created(res, 'Usuario creado exitosamente', resultado);
  } catch (error) {
    logger.error('Error al crear usuario:', { message: error.message });
    return serverError(res, 'Error al crear usuario', error);
  }
};

/**
 * PUT /admin/usuarios/:id
 */
const actualizarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return notFound(res, 'Usuario no encontrado');

    const { nombre, apellido, email, telefono, cargo, departamento, rol_id, activo, cliente_id } = req.body;

    // Si cambia rol, verificar que existe
    if (rol_id && rol_id !== usuario.rol_id) {
      const rol = await Rol.findByPk(rol_id);
      if (!rol) return badRequest(res, 'El rol especificado no existe');
      usuario.rol = rol.codigo;
      usuario.rol_id = rol.id;
      usuario.cliente_id = rol.es_cliente ? (cliente_id || usuario.cliente_id) : null;
    }

    // Si cambia email, verificar unicidad
    if (email && email.toLowerCase() !== usuario.email) {
      const existeEmail = await Usuario.findOne({ where: { email: email.toLowerCase(), id: { [Op.ne]: usuario.id } } });
      if (existeEmail) return badRequest(res, 'El email ya está registrado');
      usuario.email = email.toLowerCase();
    }

    if (nombre !== undefined) usuario.nombre = nombre;
    if (apellido !== undefined) usuario.apellido = apellido;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (cargo !== undefined) usuario.cargo = cargo;
    if (departamento !== undefined) usuario.departamento = departamento;
    if (activo !== undefined) usuario.activo = activo;

    await usuario.save();

    const resultado = await Usuario.findByPk(usuario.id, {
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] },
      include: [
        { model: Rol, as: 'rolInfo', attributes: ['id', 'nombre', 'codigo', 'color'] },
        { model: Cliente, as: 'cliente', attributes: ['id', 'razon_social'], required: false }
      ]
    });

    logger.info('Usuario actualizado:', { id: usuario.id, modificadoPor: req.user.id });
    return successMessage(res, 'Usuario actualizado exitosamente', resultado);
  } catch (error) {
    logger.error('Error al actualizar usuario:', { message: error.message });
    return serverError(res, 'Error al actualizar usuario', error);
  }
};

/**
 * PUT /admin/usuarios/:id/resetear-password
 */
const resetearPassword = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return notFound(res, 'Usuario no encontrado');

    const { password } = req.body;
    if (!password || password.length < 6) {
      return badRequest(res, 'La contraseña debe tener al menos 6 caracteres');
    }

    usuario.password_hash = password;
    usuario.requiere_cambio_password = true;
    await usuario.save();

    logger.info('Password reseteado:', { id: usuario.id, por: req.user.id });
    return successMessage(res, 'Contraseña reseteada exitosamente. El usuario deberá cambiarla al iniciar sesión.');
  } catch (error) {
    logger.error('Error al resetear password:', { message: error.message });
    return serverError(res, 'Error al resetear contraseña', error);
  }
};

/**
 * DELETE /admin/usuarios/:id
 */
const desactivarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return notFound(res, 'Usuario no encontrado');

    // No permitir desactivarse a sí mismo
    if (usuario.id === req.user.id) {
      return badRequest(res, 'No puedes desactivar tu propia cuenta');
    }

    await usuario.update({ activo: false });
    logger.info('Usuario desactivado:', { id: usuario.id, por: req.user.id });
    return successMessage(res, 'Usuario desactivado exitosamente');
  } catch (error) {
    logger.error('Error al desactivar usuario:', { message: error.message });
    return serverError(res, 'Error al desactivar usuario', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ROLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/roles
 */
const listarRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      include: [
        {
          model: Permiso,
          as: 'permisos',
          attributes: ['id', 'modulo', 'accion', 'descripcion', 'grupo'],
          through: { attributes: [] }
        }
      ],
      order: [['nivel_jerarquia', 'DESC']]
    });

    // Contar usuarios por rol
    const conteos = await Usuario.findAll({
      attributes: ['rol_id', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      group: ['rol_id'],
      raw: true
    });

    const conteoMap = {};
    conteos.forEach(function(c) { conteoMap[c.rol_id] = parseInt(c.total); });

    const resultado = roles.map(function(rol) {
      const r = rol.toJSON();
      r.total_usuarios = conteoMap[r.id] || 0;
      return r;
    });

    return success(res, resultado);
  } catch (error) {
    logger.error('Error al listar roles:', { message: error.message });
    return serverError(res, 'Error al listar roles', error);
  }
};

/**
 * GET /admin/roles/:id
 */
const obtenerRol = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id, {
      include: [{
        model: Permiso,
        as: 'permisos',
        attributes: ['id', 'modulo', 'accion', 'descripcion', 'grupo'],
        through: { attributes: [] }
      }]
    });

    if (!rol) return notFound(res, 'Rol no encontrado');

    // Contar usuarios
    const totalUsuarios = await Usuario.count({ where: { rol_id: rol.id } });
    const resultado = rol.toJSON();
    resultado.total_usuarios = totalUsuarios;

    return success(res, resultado);
  } catch (error) {
    logger.error('Error al obtener rol:', { message: error.message });
    return serverError(res, 'Error al obtener rol', error);
  }
};

/**
 * POST /admin/roles
 */
const crearRol = async (req, res) => {
  try {
    const { nombre, codigo, descripcion, nivel_jerarquia, color, permisos_ids } = req.body;

    if (!nombre || !codigo) {
      return badRequest(res, 'nombre y codigo son requeridos');
    }

    // Verificar unicidad
    const existente = await Rol.findOne({
      where: { [Op.or]: [{ nombre }, { codigo }] }
    });
    if (existente) {
      return badRequest(res, existente.nombre === nombre
        ? 'Ya existe un rol con este nombre'
        : 'Ya existe un rol con este código'
      );
    }

    const rol = await Rol.create({
      nombre,
      codigo,
      descripcion,
      nivel_jerarquia: nivel_jerarquia || 50,
      color: color || '#6B7280',
      es_sistema: false,
      es_cliente: false,
      activo: true
    });

    // Asignar permisos
    if (permisos_ids && permisos_ids.length > 0) {
      const records = permisos_ids.map(function(pid) {
        return { rol_id: rol.id, permiso_id: pid };
      });
      await RolPermiso.bulkCreate(records);
    }

    // Retornar con permisos incluidos
    const resultado = await Rol.findByPk(rol.id, {
      include: [{
        model: Permiso,
        as: 'permisos',
        attributes: ['id', 'modulo', 'accion', 'descripcion', 'grupo'],
        through: { attributes: [] }
      }]
    });

    invalidarCachePermisos();
    logger.info('Rol creado:', { id: rol.id, nombre, creadoPor: req.user.id });
    return created(res, 'Rol creado exitosamente', resultado);
  } catch (error) {
    logger.error('Error al crear rol:', { message: error.message });
    return serverError(res, 'Error al crear rol', error);
  }
};

/**
 * PUT /admin/roles/:id
 */
const actualizarRol = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id);
    if (!rol) return notFound(res, 'Rol no encontrado');

    const { nombre, descripcion, nivel_jerarquia, color, permisos_ids } = req.body;

    // No cambiar código de roles del sistema
    if (rol.es_sistema && req.body.codigo && req.body.codigo !== rol.codigo) {
      return badRequest(res, 'No se puede cambiar el código de un rol del sistema');
    }

    // Actualizar campos
    if (nombre) rol.nombre = nombre;
    if (descripcion !== undefined) rol.descripcion = descripcion;
    if (nivel_jerarquia !== undefined) rol.nivel_jerarquia = nivel_jerarquia;
    if (color) rol.color = color;
    if (req.body.activo !== undefined) rol.activo = req.body.activo;

    await rol.save();

    // Actualizar permisos si se enviaron
    if (permisos_ids !== undefined) {
      await RolPermiso.destroy({ where: { rol_id: rol.id } });
      if (permisos_ids.length > 0) {
        const records = permisos_ids.map(function(pid) {
          return { rol_id: rol.id, permiso_id: pid };
        });
        await RolPermiso.bulkCreate(records);
      }

      // Sincronizar campo `rol` legacy de usuarios con este rol
      // (no se necesita ya que `rol` se mantiene por el código del Rol)
    }

    const resultado = await Rol.findByPk(rol.id, {
      include: [{
        model: Permiso,
        as: 'permisos',
        attributes: ['id', 'modulo', 'accion', 'descripcion', 'grupo'],
        through: { attributes: [] }
      }]
    });

    invalidarCachePermisos();
    logger.info('Rol actualizado:', { id: rol.id, modificadoPor: req.user.id });
    return successMessage(res, 'Rol actualizado exitosamente', resultado);
  } catch (error) {
    logger.error('Error al actualizar rol:', { message: error.message });
    return serverError(res, 'Error al actualizar rol', error);
  }
};

/**
 * DELETE /admin/roles/:id
 */
const eliminarRol = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id);
    if (!rol) return notFound(res, 'Rol no encontrado');

    if (rol.es_sistema) {
      return badRequest(res, 'No se pueden eliminar roles del sistema');
    }

    // Verificar que no tenga usuarios asignados
    const totalUsuarios = await Usuario.count({ where: { rol_id: rol.id } });
    if (totalUsuarios > 0) {
      return badRequest(res, `No se puede eliminar: ${totalUsuarios} usuario(s) tienen este rol asignado`);
    }

    // Eliminar permisos asociados y el rol
    await RolPermiso.destroy({ where: { rol_id: rol.id } });
    await rol.destroy();

    invalidarCachePermisos();
    logger.info('Rol eliminado:', { id: rol.id, nombre: rol.nombre, por: req.user.id });
    return successMessage(res, 'Rol eliminado exitosamente');
  } catch (error) {
    logger.error('Error al eliminar rol:', { message: error.message });
    return serverError(res, 'Error al eliminar rol', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PERMISOS (solo lectura)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/permisos
 */
const listarPermisos = async (req, res) => {
  try {
    const permisos = await Permiso.findAll({
      order: [['grupo', 'ASC'], ['modulo', 'ASC'], ['accion', 'ASC']]
    });

    // Agrupar por módulo para la UI
    const agrupados = {};
    permisos.forEach(function(p) {
      if (!agrupados[p.modulo]) {
        agrupados[p.modulo] = { modulo: p.modulo, grupo: p.grupo, acciones: [] };
      }
      agrupados[p.modulo].acciones.push({
        id: p.id,
        accion: p.accion,
        descripcion: p.descripcion
      });
    });

    return success(res, {
      permisos: permisos,
      agrupados: Object.values(agrupados)
    });
  } catch (error) {
    logger.error('Error al listar permisos:', { message: error.message });
    return serverError(res, 'Error al listar permisos', error);
  }
};

module.exports = {
  // Usuarios
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  resetearPassword,
  desactivarUsuario,
  // Roles
  listarRoles,
  obtenerRol,
  crearRol,
  actualizarRol,
  eliminarRol,
  // Permisos
  listarPermisos,
};
