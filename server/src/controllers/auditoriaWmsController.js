/**
 * ISTHO CRM - Controlador de Auditorías WMS
 *
 * Maneja el flujo de auditoría de entradas (ingresos) y salidas (despachos)
 * provenientes del WMS. Cada auditoría pasa por: Pendiente → En Proceso → Cerrado.
 *
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.1.0 - Corregido para coincidir con modelos reales
 */

const { Op } = require('sequelize');
const notificacionService = require('../services/notificacionService');
const emailService = require('../services/emailService');
const {
  Operacion,
  OperacionDetalle,
  OperacionAveria,
  Cliente,
  Contacto,
  Usuario,
  Auditoria,
  OperacionDocumento,
  CajaInventario,
  sequelize
} = require('../models');
const {
  success,
  successMessage,
  paginated,
  error: errorResponse,
  notFound,
  serverError
} = require('../utils/responses');
const { parsePaginacion, getClientIP } = require('../utils/helpers');
const logger = require('../utils/logger');

// ════════════════════════════════════════════════════════════════════════════
// ENTRADAS (Ingresos)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Listar entradas/ingresos con filtros
 * GET /auditorias/entradas
 */
const listarEntradas = async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginacion(req.query);
    const { estado, search } = req.query;

    const where = { tipo: 'ingreso' };

    if (estado && estado !== 'todos') {
      where.estado = estado;
    }

    if (search) {
      where[Op.or] = [
        { numero_operacion: { [Op.like]: `%${search}%` } },
        { '$cliente.razon_social$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Operacion.findAndCountAll({
      where,
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'razon_social']
        },
        {
          model: OperacionDetalle,
          as: 'detalles',
          attributes: ['id', 'producto', 'sku', 'cantidad', 'unidad_medida', 'cantidad_averia', 'verificado']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
      subQuery: false
    });

    const entradas = rows.map(op => ({
      id: op.id,
      documento: op.numero_operacion,
      documento_wms: op.documento_wms || null,
      cliente: op.cliente?.razon_social || 'Sin cliente',
      tipo_documento: 'Recepción',
      fecha_ingreso: op.fecha_operacion || op.created_at,
      estado: op.estado,
      lineas: op.detalles?.length || 0,
      lineas_verificadas: (op.detalles || []).filter(d => d.verificado).length,
    }));

    return paginated(res, entradas, { total: count, page, limit });
  } catch (err) {
    logger.error('[AUDITORIAS] Error al listar entradas:', err);
    return serverError(res, 'Error al obtener entradas', err);
  }
};

/**
 * Obtener detalle de una entrada por ID
 * GET /auditorias/entradas/:id
 */
const obtenerEntradaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const operacion = await Operacion.findOne({
      where: { id, tipo: 'ingreso' },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'razon_social']
        },
        {
          model: OperacionDetalle,
          as: 'detalles',
          attributes: ['id', 'producto', 'sku', 'cantidad', 'unidad_medida', 'cantidad_averia', 'lote', 'fecha_vencimiento', 'verificado', 'numero_caja', 'deleted_at'],
          paranoid: false // Incluir líneas eliminadas para permitir restauración
        },
        {
          model: OperacionDocumento,
          as: 'documentos',
          attributes: ['id', 'archivo_nombre', 'archivo_url', 'archivo_tipo', 'archivo_tamanio', 'created_at']
        }
      ]
    });

    if (!operacion) {
      return notFound(res, 'Entrada no encontrada');
    }

    const data = {
      id: operacion.id,
      documento: operacion.numero_operacion,
      documento_wms: operacion.documento_wms || null,
      cliente: operacion.cliente?.razon_social || 'Sin cliente',
      tipo_documento: 'Recepción',
      fecha_ingreso: operacion.fecha_operacion || operacion.created_at,
      estado: operacion.estado,
      lineas: (operacion.detalles || []).map(d => ({
        id: d.id,
        sku: d.sku || '',
        producto: d.producto,
        cantidad_esperada: d.cantidad,
        unidad: d.unidad_medida || 'UND',
        cantidad_averia: d.cantidad_averia || 0,
        lote: d.lote || '',
        fecha_vencimiento: d.fecha_vencimiento || null,
        verificado: !!d.verificado,
        caja: d.numero_caja || '',
        eliminado: !!d.deleted_at,
      })),
      logistica: {
        conductor: operacion.conductor_nombre || '',
        cedula: operacion.conductor_cedula || '',
        placa: operacion.vehiculo_placa || '',
        telefono: operacion.conductor_telefono || '',
        origen: operacion.origen || '',
        destino: operacion.destino || '',
        observaciones: operacion.observaciones || '',
      },
      evidencias: (operacion.documentos || []).map(doc => ({
        id: doc.id,
        nombre: doc.archivo_nombre,
        url: doc.archivo_url,
        tipo: doc.archivo_tipo,
        tamanio: doc.archivo_tamanio,
        fecha: doc.created_at
      }))
    };

    return success(res, data);
  } catch (err) {
    logger.error('[AUDITORIAS] Error al obtener entrada:', err);
    return serverError(res, 'Error al obtener entrada', err);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// SALIDAS (Despachos)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Listar salidas/despachos con filtros
 * GET /auditorias/salidas
 */
const listarSalidas = async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginacion(req.query);
    const { estado, search } = req.query;

    const where = { tipo: 'salida' };

    if (estado && estado !== 'todos') {
      where.estado = estado;
    }

    if (search) {
      where[Op.or] = [
        { numero_operacion: { [Op.like]: `%${search}%` } },
        { '$cliente.razon_social$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Operacion.findAndCountAll({
      where,
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'razon_social']
        },
        {
          model: OperacionDetalle,
          as: 'detalles',
          attributes: ['id', 'producto', 'sku', 'cantidad', 'unidad_medida', 'cantidad_averia', 'verificado']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
      subQuery: false
    });

    const salidas = rows.map(op => ({
      id: op.id,
      documento: op.numero_operacion,
      documento_wms: op.documento_wms || null,
      cliente: op.cliente?.razon_social || 'Sin cliente',
      tipo_documento: 'Despacho',
      fecha_salida: op.fecha_operacion || op.created_at,
      estado: op.estado,
      lineas: op.detalles?.length || 0,
      lineas_verificadas: (op.detalles || []).filter(d => d.verificado).length,
    }));

    return paginated(res, salidas, { total: count, page, limit });
  } catch (err) {
    logger.error('[AUDITORIAS] Error al listar salidas:', err);
    return serverError(res, 'Error al obtener salidas', err);
  }
};

/**
 * Obtener detalle de una salida por ID
 * GET /auditorias/salidas/:id
 */
const obtenerSalidaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const operacion = await Operacion.findOne({
      where: { id, tipo: 'salida' },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'razon_social']
        },
        {
          model: OperacionDetalle,
          as: 'detalles',
          attributes: ['id', 'producto', 'sku', 'cantidad', 'unidad_medida', 'cantidad_averia', 'lote', 'fecha_vencimiento', 'verificado', 'numero_caja', 'deleted_at'],
          paranoid: false // Incluir líneas eliminadas para permitir restauración
        },
        {
          model: OperacionDocumento,
          as: 'documentos',
          attributes: ['id', 'archivo_nombre', 'archivo_url', 'archivo_tipo', 'archivo_tamanio', 'created_at']
        }
      ]
    });

    if (!operacion) {
      return notFound(res, 'Salida no encontrada');
    }

    const data = {
      id: operacion.id,
      documento: operacion.numero_operacion,
      documento_wms: operacion.documento_wms || null,
      cliente: operacion.cliente?.razon_social || 'Sin cliente',
      tipo_documento: 'Despacho',
      fecha_salida: operacion.fecha_operacion || operacion.created_at,
      estado: operacion.estado,
      lineas: (operacion.detalles || []).map(d => ({
        id: d.id,
        sku: d.sku || '',
        producto: d.producto,
        cantidad_esperada: d.cantidad,
        unidad: d.unidad_medida || 'UND',
        cantidad_averia: d.cantidad_averia || 0,
        lote: d.lote || '',
        fecha_vencimiento: d.fecha_vencimiento || null,
        verificado: !!d.verificado,
        caja: d.numero_caja || '',
        eliminado: !!d.deleted_at,
      })),
      logistica: {
        conductor: operacion.conductor_nombre || '',
        cedula: operacion.conductor_cedula || '',
        placa: operacion.vehiculo_placa || '',
        telefono: operacion.conductor_telefono || '',
        origen: operacion.origen || '',
        destino: operacion.destino || '',
        observaciones: operacion.observaciones || '',
      },
      evidencias: (operacion.documentos || []).map(doc => ({
        id: doc.id,
        nombre: doc.archivo_nombre,
        url: doc.archivo_url,
        tipo: doc.archivo_tipo,
        tamanio: doc.archivo_tamanio,
        fecha: doc.created_at
      }))
    };

    return success(res, data);
  } catch (err) {
    logger.error('[AUDITORIAS] Error al obtener salida:', err);
    return serverError(res, 'Error al obtener salida', err);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ACCIONES SOBRE LÍNEAS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Actualizar cantidad de avería de una línea
 * PUT /auditorias/:id/lineas/:lineaId/verificar
 */
const verificarLinea = async (req, res) => {
  try {
    const { id, lineaId } = req.params;
    const { cantidad_averia, tipo_averia, observaciones_averia, verificado } = req.body;

    const detalle = await OperacionDetalle.findOne({
      where: { id: lineaId, operacion_id: id }
    });

    if (!detalle) {
      return notFound(res, 'Línea no encontrada');
    }

    const updateData = {};
    if (cantidad_averia !== undefined) updateData.cantidad_averia = cantidad_averia;
    if (tipo_averia !== undefined) updateData.tipo_averia = tipo_averia;
    if (observaciones_averia !== undefined) updateData.observaciones_averia = observaciones_averia;
    if (verificado !== undefined) updateData.verificado = !!verificado;

    await detalle.update(updateData);

    // Actualizar estado de la operación si es necesario
    const operacion = await Operacion.findByPk(id);
    if (operacion && operacion.estado === 'pendiente') {
      await operacion.update({ estado: 'en_proceso' });
    }

    // Registrar auditoría
    await Auditoria.registrar({
      tabla: 'operacion_detalle',
      registro_id: detalle.id,
      accion: 'actualizar',
      usuario_id: req.user?.id,
      usuario_nombre: req.user?.nombre_completo,
      descripcion: `Línea actualizada: ${detalle.producto}`,
      ip_address: getClientIP(req)
    });

    return successMessage(res, 'Línea actualizada correctamente');
  } catch (err) {
    logger.error('[AUDITORIAS] Error al verificar línea:', err);
    return serverError(res, 'Error al verificar línea', err);
  }
};

/**
 * Eliminar una línea (soft delete via Sequelize paranoid o destroy)
 * DELETE /auditorias/:id/lineas/:lineaId
 */
const eliminarLinea = async (req, res) => {
  try {
    const { id, lineaId } = req.params;

    const detalle = await OperacionDetalle.findOne({
      where: { id: lineaId, operacion_id: id }
    });

    if (!detalle) {
      return notFound(res, 'Línea no encontrada');
    }

    const productoNombre = detalle.producto;
    await detalle.destroy();

    const operacion = await Operacion.findByPk(id);
    if (operacion && operacion.estado === 'pendiente') {
      await operacion.update({ estado: 'en_proceso' });
    }

    await Auditoria.registrar({
      tabla: 'operacion_detalle',
      registro_id: parseInt(lineaId),
      accion: 'eliminar',
      usuario_id: req.user?.id,
      usuario_nombre: req.user?.nombre_completo,
      descripcion: `Línea eliminada: ${productoNombre}`,
      ip_address: getClientIP(req)
    });

    return successMessage(res, 'Línea eliminada correctamente');
  } catch (err) {
    logger.error('[AUDITORIAS] Error al eliminar línea:', err);
    return serverError(res, 'Error al eliminar línea', err);
  }
};

/**
 * Restaurar una línea previamente eliminada
 * PUT /auditorias/:id/lineas/:lineaId/restaurar
 */
const restaurarLinea = async (req, res) => {
  try {
    const { id, lineaId } = req.params;

    const detalle = await OperacionDetalle.findOne({
      where: { id: lineaId, operacion_id: id },
      paranoid: false
    });

    if (!detalle) {
      return notFound(res, 'Línea no encontrada');
    }

    await detalle.restore();

    await Auditoria.registrar({
      tabla: 'operacion_detalle',
      registro_id: detalle.id,
      accion: 'actualizar',
      usuario_id: req.user?.id,
      usuario_nombre: req.user?.nombre_completo,
      descripcion: `Línea restaurada: ${detalle.producto}`,
      ip_address: getClientIP(req)
    });

    return successMessage(res, 'Línea restaurada correctamente');
  } catch (err) {
    logger.error('[AUDITORIAS] Error al restaurar línea:', err);
    return serverError(res, 'Error al restaurar línea', err);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// DATOS LOGÍSTICOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Guardar/actualizar datos logísticos
 * PUT /auditorias/:id/logistica
 */
const guardarDatosLogisticos = async (req, res) => {
  try {
    const { id } = req.params;
    const { conductor, cedula, placa, telefono, origen, destino, observaciones } = req.body;

    const operacion = await Operacion.findByPk(id);
    if (!operacion) {
      return notFound(res, 'Operación no encontrada');
    }

    await operacion.update({
      conductor_nombre: conductor || '',
      conductor_cedula: cedula || '',
      vehiculo_placa: placa || '',
      conductor_telefono: telefono || '',
      origen: origen || '',
      destino: destino || '',
      observaciones: observaciones || '',
    });

    await Auditoria.registrar({
      tabla: 'operaciones',
      registro_id: operacion.id,
      accion: 'actualizar',
      usuario_id: req.user?.id,
      usuario_nombre: req.user?.nombre_completo,
      descripcion: `Datos logísticos actualizados para ${operacion.numero_operacion}`,
      ip_address: getClientIP(req)
    });

    return successMessage(res, 'Datos logísticos guardados correctamente');
  } catch (err) {
    logger.error('[AUDITORIAS] Error al guardar datos logísticos:', err);
    return serverError(res, 'Error al guardar datos logísticos', err);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// EVIDENCIAS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Subir evidencias (PDF + fotos)
 * POST /auditorias/:id/evidencias
 */
const subirEvidencias = async (req, res) => {
  try {
    const { id } = req.params;

    const operacion = await Operacion.findByPk(id);
    if (!operacion) {
      return notFound(res, 'Operación no encontrada');
    }

    // Los archivos ya fueron procesados por multer
    const archivos = req.files || [];

    if (archivos.length === 0) {
      return errorResponse(res, 'No se recibieron archivos', 400);
    }

    // Guardar evidencias en la base de datos
    const promesasDocumentos = archivos.map(file => {
      return OperacionDocumento.create({
        operacion_id: id,
        tipo_documento: 'cumplido',
        nombre: `Evidencia - ${file.originalname}`,
        archivo_nombre: file.originalname,
        archivo_url: `/uploads/${file.fieldname === 'evidencias' ? 'cumplidos' : 'temp'}/${file.filename}`,
        archivo_tipo: file.mimetype,
        archivo_tamanio: file.size,
        subido_por: req.user?.id
      });
    });

    await Promise.all(promesasDocumentos);

    await Auditoria.registrar({
      tabla: 'operaciones',
      registro_id: operacion.id,
      accion: 'actualizar',
      usuario_id: req.user?.id,
      usuario_nombre: req.user?.nombre_completo,
      descripcion: `${archivos.length} evidencia(s) subida(s) para ${operacion.numero_operacion}`,
      ip_address: getClientIP(req)
    });

    return successMessage(res, `${archivos.length} evidencia(s) subida(s) correctamente`, {
      archivos: archivos.map(f => ({ nombre: f.originalname, tamaño: f.size, tipo: f.mimetype }))
    });
  } catch (err) {
    logger.error('[AUDITORIAS] Error al subir evidencias:', err);
    return serverError(res, 'Error al subir evidencias', err);
  }
};

/**
 * Eliminar una evidencia
 * DELETE /auditorias/:id/evidencias/:evidenciaId
 */
const eliminarEvidencia = async (req, res) => {
  try {
    const { id, evidenciaId } = req.params;

    const documento = await OperacionDocumento.findOne({
      where: { id: evidenciaId, operacion_id: id }
    });

    if (!documento) {
      return notFound(res, 'Evidencia no encontrada');
    }

    // Eliminar archivo físico si existe
    const fs = require('fs');
    const path = require('path');
    if (documento.archivo_url) {
      const filePath = path.join(__dirname, '../..', documento.archivo_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await documento.destroy();

    await Auditoria.registrar({
      tabla: 'operacion_documentos',
      registro_id: parseInt(evidenciaId),
      accion: 'eliminar',
      usuario_id: req.user?.id,
      usuario_nombre: req.user?.nombre_completo,
      descripcion: `Evidencia eliminada: ${documento.archivo_nombre}`,
      ip_address: getClientIP(req)
    });

    return successMessage(res, 'Evidencia eliminada correctamente');
  } catch (err) {
    logger.error('[AUDITORIAS] Error al eliminar evidencia:', err);
    return serverError(res, 'Error al eliminar evidencia', err);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// CIERRE DE AUDITORÍA
// ════════════════════════════════════════════════════════════════════════════

/**
 * Cerrar una auditoría
 * POST /auditorias/:id/cerrar
 *
 * Cierra la auditoría, envía notificación in-app y correo electrónico
 * a los contactos del cliente que tengan recibe_notificaciones = true.
 */
const cerrarAuditoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { enviar_correo, correos_destino } = req.body;

    const operacion = await Operacion.findByPk(id, {
      include: [{ model: Cliente, as: 'cliente' }]
    });
    if (!operacion) {
      return notFound(res, 'Operación no encontrada');
    }

    if (operacion.estado === 'cerrado') {
      return errorResponse(res, 'La auditoría ya se encuentra cerrada', 409);
    }

    // ════════════════════════════════════════════════════════════════════
    // OBTENER CORREOS DE DESTINO (contactos con recibe_notificaciones)
    // ════════════════════════════════════════════════════════════════════

    let correosEnvio = correos_destino;
    if (!correosEnvio && enviar_correo !== false) {
      const contactos = await Contacto.findAll({
        where: {
          cliente_id: operacion.cliente_id,
          recibe_notificaciones: true,
          activo: true,
          email: { [Op.ne]: null }
        }
      });
      correosEnvio = contactos.map(c => c.email).join(', ');
    }

    // ════════════════════════════════════════════════════════════════════
    // ACTUALIZAR OPERACIÓN
    // ════════════════════════════════════════════════════════════════════

    await operacion.update({
      estado: 'cerrado',
      fecha_cierre: new Date(),
      cerrado_por: req.user?.id,
      correos_destino: correosEnvio || null
    });

    await Auditoria.registrar({
      tabla: 'operaciones',
      registro_id: operacion.id,
      accion: 'actualizar',
      usuario_id: req.user?.id,
      usuario_nombre: req.user?.nombre_completo,
      descripcion: `Auditoría cerrada: ${operacion.numero_operacion}`,
      ip_address: getClientIP(req)
    });

    // Notificar in-app a usuarios del cliente + admins
    notificacionService.notificarOperacionCerrada(operacion, req.user?.nombre_completo || 'Sistema').catch(err => {
      logger.error('[AUDITORIAS] Error al enviar notificación de cierre:', { message: err.message });
    });

    // ════════════════════════════════════════════════════════════════════
    // ENVIAR CORREO ELECTRÓNICO
    // ════════════════════════════════════════════════════════════════════

    let resultadoCorreo = { success: false };
    if (enviar_correo !== false && correosEnvio) {
      try {
        // Recargar operación con todas las relaciones para el email
        await operacion.reload({
          include: [
            { model: Cliente, as: 'cliente' },
            { model: OperacionDetalle, as: 'detalles' },
            { model: OperacionDocumento, as: 'documentos' },
            { model: OperacionAveria, as: 'averias' },
            { model: Usuario, as: 'cerrador', attributes: ['id', 'nombre_completo'] }
          ]
        });

        resultadoCorreo = await emailService.enviarCierreOperacion(operacion, correosEnvio);

        await operacion.update({
          correo_enviado: resultadoCorreo.success,
          fecha_correo_enviado: resultadoCorreo.success ? new Date() : null
        });

        logger.info('[AUDITORIAS] Correo de cierre enviado:', {
          operacion_id: operacion.id,
          numero: operacion.numero_operacion,
          destinatarios: correosEnvio,
          success: resultadoCorreo.success
        });
      } catch (emailErr) {
        logger.error('[AUDITORIAS] Error al enviar correo de cierre:', { message: emailErr.message });
      }
    }

    return successMessage(res, 'Auditoría cerrada correctamente', {
      numero_operacion: operacion.numero_operacion,
      correo_enviado: resultadoCorreo.success,
      correos_destino: correosEnvio || null,
      preview_url: resultadoCorreo.previewUrl
    });
  } catch (err) {
    logger.error('[AUDITORIAS] Error al cerrar auditoría:', err);
    return serverError(res, 'Error al cerrar auditoría', err);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS Y KPIs
// ════════════════════════════════════════════════════════════════════════════

/**
 * Obtener estadísticas de auditorías
 * GET /auditorias/stats
 */
const estadisticas = async (req, res) => {
  try {
    const [entradas, salidas] = await Promise.all([
      Operacion.findAll({
        where: { tipo: 'ingreso' },
        attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
        group: ['estado'],
        raw: true
      }),
      Operacion.findAll({
        where: { tipo: 'salida' },
        attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
        group: ['estado'],
        raw: true
      })
    ]);

    const toMap = (arr) => arr.reduce((acc, r) => ({ ...acc, [r.estado]: parseInt(r.total) }), {});
    const entradasMap = toMap(entradas);
    const salidasMap = toMap(salidas);

    return success(res, {
      entradas: {
        pendientes: entradasMap.pendiente || 0,
        en_proceso: entradasMap.en_proceso || 0,
        cerradas: entradasMap.cerrado || 0,
      },
      salidas: {
        pendientes: salidasMap.pendiente || 0,
        en_proceso: salidasMap.en_proceso || 0,
        cerradas: salidasMap.cerrado || 0,
      }
    });
  } catch (err) {
    logger.error('[AUDITORIAS] Error al obtener estadísticas:', err);
    return serverError(res, 'Error al obtener estadísticas', err);
  }
};

/**
 * Obtener operaciones recientes (para Dashboard)
 * GET /auditorias/recientes
 */
const recientes = async (req, res) => {
  try {
    const limite = parseInt(req.query.limit) || 5;

    const [entradas, salidas] = await Promise.all([
      Operacion.findAll({
        where: { tipo: 'ingreso' },
        include: [{ model: Cliente, as: 'cliente', attributes: ['razon_social'] }],
        order: [['created_at', 'DESC']],
        limit: limite
      }),
      Operacion.findAll({
        where: { tipo: 'salida' },
        include: [{ model: Cliente, as: 'cliente', attributes: ['razon_social'] }],
        order: [['created_at', 'DESC']],
        limit: limite
      })
    ]);

    const mapOp = (op, tipo) => ({
      id: op.id,
      documento: op.numero_operacion,
      cliente: op.cliente?.razon_social || 'Sin cliente',
      tipo_documento: tipo === 'ingreso' ? 'Recepción' : 'Despacho',
      fecha: op.fecha_operacion || op.created_at,
      estado: op.estado,
    });

    return success(res, {
      entradas: entradas.map(e => mapOp(e, 'ingreso')),
      salidas: salidas.map(s => mapOp(s, 'salida')),
    });
  } catch (err) {
    logger.error('[AUDITORIAS] Error al obtener recientes:', err);
    return serverError(res, 'Error al obtener operaciones recientes', err);
  }
};

module.exports = {
  listarEntradas,
  obtenerEntradaPorId,
  listarSalidas,
  obtenerSalidaPorId,
  verificarLinea,
  eliminarLinea,
  restaurarLinea,
  guardarDatosLogisticos,
  subirEvidencias,
  eliminarEvidencia,
  cerrarAuditoria,
  estadisticas,
  recientes,
};
