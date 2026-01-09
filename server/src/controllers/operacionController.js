/**
 * ISTHO CRM - Controlador de Operaciones
 * 
 * Maneja las operaciones de ingreso/salida de mercancía.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const { Op } = require('sequelize');
const {
  Operacion,
  OperacionDetalle,
  OperacionAveria,
  OperacionDocumento,
  Cliente,
  Contacto,
  Usuario,
  Auditoria,
  sequelize
} = require('../models');
const wmsService = require('../services/wmsService');
const {
  success,
  successMessage,
  created,
  paginated,
  error: errorResponse,
  notFound,
  conflict,
  serverError
} = require('../utils/responses');
const {
  parsePaginacion,
  buildPaginacion,
  parseOrdenamiento,
  limpiarObjeto,
  getClientIP
} = require('../utils/helpers');
const logger = require('../utils/logger');

const CAMPOS_ORDENAMIENTO = ['numero_operacion', 'fecha_operacion', 'tipo', 'estado', 'created_at'];

/**
 * Generar número de operación
 */
const generarNumeroOperacion = async () => {
  const año = new Date().getFullYear();
  const ultima = await Operacion.findOne({
    where: { numero_operacion: { [Op.like]: `OP-${año}-%` } },
    order: [['id', 'DESC']],
    paranoid: false
  });
  
  let siguiente = 1;
  if (ultima) {
    const partes = ultima.numero_operacion.split('-');
    siguiente = parseInt(partes[2]) + 1;
  }
  
  return `OP-${año}-${String(siguiente).padStart(4, '0')}`;
};

// =============================================
// OPERACIONES CRUD
// =============================================

/**
 * GET /operaciones/wms/documentos
 * Listar documentos disponibles en WMS
 */
const listarDocumentosWMS = async (req, res) => {
  try {
    const { tipo, cliente_codigo } = req.query;
    
    const documentos = await wmsService.listarDocumentosPendientes(
      tipo || 'ingreso',
      cliente_codigo
    );
    
    return success(res, documentos);
    
  } catch (error) {
    logger.error('Error al listar documentos WMS:', { message: error.message });
    return serverError(res, 'Error al consultar documentos del WMS', error);
  }
};

/**
 * GET /operaciones/wms/documento/:numero
 * Buscar documento específico en WMS
 */
const buscarDocumentoWMS = async (req, res) => {
  try {
    const { numero } = req.params;
    
    const documento = await wmsService.buscarDocumento(numero);
    
    if (!documento) {
      return notFound(res, `Documento ${numero} no encontrado en el WMS`);
    }
    
    return success(res, documento);
    
  } catch (error) {
    logger.error('Error al buscar documento WMS:', { message: error.message });
    return serverError(res, 'Error al consultar el WMS', error);
  }
};

/**
 * GET /operaciones
 * Listar operaciones
 */
const listar = async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginacion(req.query);
    const order = parseOrdenamiento(req.query, CAMPOS_ORDENAMIENTO, 'created_at', 'DESC');
    
    const where = {};
    
    if (req.query.tipo && req.query.tipo !== 'todos') {
      where.tipo = req.query.tipo;
    }
    
    if (req.query.estado && req.query.estado !== 'todos') {
      where.estado = req.query.estado;
    }
    
    if (req.query.cliente_id) {
      where.cliente_id = req.query.cliente_id;
    }
    
    if (req.query.fecha_desde || req.query.fecha_hasta) {
      where.fecha_operacion = {};
      if (req.query.fecha_desde) where.fecha_operacion[Op.gte] = req.query.fecha_desde;
      if (req.query.fecha_hasta) where.fecha_operacion[Op.lte] = req.query.fecha_hasta;
    }
    
    if (req.query.search) {
      const term = `%${req.query.search}%`;
      where[Op.or] = [
        { numero_operacion: { [Op.like]: term } },
        { documento_wms: { [Op.like]: term } }
      ];
    }
    
    const { count, rows } = await Operacion.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'codigo_cliente', 'razon_social'] },
        { model: Usuario, as: 'creador', attributes: ['id', 'nombre_completo'] }
      ]
    });
    
    return paginated(res, rows, buildPaginacion(count, page, limit));
    
  } catch (error) {
    logger.error('Error al listar operaciones:', { message: error.message });
    return serverError(res, 'Error al obtener operaciones', error);
  }
};

/**
 * GET /operaciones/stats
 * Estadísticas de operaciones
 */
const estadisticas = async (req, res) => {
  try {
    const whereCliente = req.query.cliente_id ? { cliente_id: req.query.cliente_id } : {};
    
    const porTipo = await Operacion.findAll({
      where: whereCliente,
      attributes: ['tipo', [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']],
      group: ['tipo'],
      raw: true
    });
    
    const porEstado = await Operacion.findAll({
      where: whereCliente,
      attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']],
      group: ['estado'],
      raw: true
    });
    
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const esteMes = await Operacion.count({
      where: { ...whereCliente, created_at: { [Op.gte]: inicioMes } }
    });
    
    const totalAverias = await Operacion.sum('total_averias', { where: whereCliente }) || 0;
    
    return success(res, {
      resumen: {
        total: porTipo.reduce((sum, t) => sum + parseInt(t.cantidad), 0),
        este_mes: esteMes,
        total_averias: totalAverias
      },
      porTipo: porTipo.map(t => ({ tipo: t.tipo, cantidad: parseInt(t.cantidad) })),
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: parseInt(e.cantidad) }))
    });
    
  } catch (error) {
    logger.error('Error al obtener estadísticas:', { message: error.message });
    return serverError(res, 'Error al obtener estadísticas', error);
  }
};

/**
 * GET /operaciones/:id
 * Obtener operación por ID
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const operacion = await Operacion.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'codigo_cliente', 'razon_social', 'nit'] },
        { model: Usuario, as: 'creador', attributes: ['id', 'nombre_completo'] },
        { model: Usuario, as: 'cerrador', attributes: ['id', 'nombre_completo'] },
        { 
          model: OperacionDetalle, 
          as: 'detalles',
          include: [{ model: OperacionAveria, as: 'evidencias_averia' }]
        },
        { model: OperacionAveria, as: 'averias' },
        { 
          model: OperacionDocumento, 
          as: 'documentos',
          include: [{ model: Usuario, as: 'usuario_subio', attributes: ['id', 'nombre_completo'] }]
        }
      ]
    });
    
    if (!operacion) {
      return notFound(res, 'Operación no encontrada');
    }
    
    return success(res, operacion);
    
  } catch (error) {
    logger.error('Error al obtener operación:', { message: error.message });
    return serverError(res, 'Error al obtener la operación', error);
  }
};

/**
 * POST /operaciones
 * Crear operación desde documento WMS
 */
const crear = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const datos = limpiarObjeto(req.body);
    
    // Buscar documento en WMS
    const docWMS = await wmsService.buscarDocumento(datos.documento_wms);
    
    if (!docWMS) {
      await transaction.rollback();
      return notFound(res, `Documento ${datos.documento_wms} no encontrado en el WMS`);
    }
    
    // Verificar que no exista operación con este documento
    const existente = await Operacion.findOne({
      where: { documento_wms: datos.documento_wms }
    });
    
    if (existente) {
      await transaction.rollback();
      return conflict(res, `Ya existe una operación para el documento ${datos.documento_wms}`);
    }
    
    // Verificar cliente
    const cliente = await Cliente.findByPk(datos.cliente_id);
    if (!cliente) {
      await transaction.rollback();
      return notFound(res, 'Cliente no encontrado');
    }
    
    // Generar número de operación
    datos.numero_operacion = await generarNumeroOperacion();
    datos.creado_por = req.user.id;
    datos.fecha_documento = docWMS.fecha_documento;
    datos.total_referencias = docWMS.productos.length;
    datos.total_unidades = docWMS.productos.reduce((sum, p) => sum + p.cantidad, 0);
    datos.estado = 'en_proceso';
    
    // Crear operación
    const operacion = await Operacion.create(datos, { transaction });
    
    // Crear detalle desde productos del WMS
    const detallesData = docWMS.productos.map(p => ({
      operacion_id: operacion.id,
      sku: p.sku,
      producto: p.producto,
      cantidad: p.cantidad,
      unidad_medida: p.unidad_medida,
      lote: p.lote,
      fecha_vencimiento: p.fecha_vencimiento
    }));
    
    await OperacionDetalle.bulkCreate(detallesData, { transaction });
    
    // Auditoría
    await Auditoria.registrar({
      tabla: 'operaciones',
      registro_id: operacion.id,
      accion: 'crear',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      datos_nuevos: datos,
      ip_address: getClientIP(req),
      descripcion: `Operación creada: ${operacion.numero_operacion} (${operacion.tipo})`
    });
    
    await transaction.commit();
    
    // Recargar con relaciones
    await operacion.reload({
      include: [
        { model: Cliente, as: 'cliente' },
        { model: OperacionDetalle, as: 'detalles' }
      ]
    });
    
    logger.info('Operación creada:', { id: operacion.id, numero: operacion.numero_operacion });
    
    return created(res, 'Operación creada exitosamente', operacion);
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al crear operación:', { message: error.message });
    return serverError(res, 'Error al crear la operación', error);
  }
};

/**
 * PUT /operaciones/:id/transporte
 * Actualizar información de transporte
 */
const actualizarTransporte = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const datos = limpiarObjeto(req.body);
    
    const operacion = await Operacion.findByPk(id);
    
    if (!operacion) {
      await transaction.rollback();
      return notFound(res, 'Operación no encontrada');
    }
    
    if (!operacion.esEditable()) {
      await transaction.rollback();
      return errorResponse(res, 'Esta operación ya no se puede modificar', 400);
    }
    
    const datosAnteriores = {
      origen: operacion.origen,
      destino: operacion.destino,
      vehiculo_placa: operacion.vehiculo_placa,
      conductor_nombre: operacion.conductor_nombre,
      conductor_cedula: operacion.conductor_cedula,
      conductor_telefono: operacion.conductor_telefono
    };
    
    await operacion.update(datos, { transaction });
    
    await Auditoria.registrar({
      tabla: 'operaciones',
      registro_id: operacion.id,
      accion: 'actualizar',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      datos_anteriores: datosAnteriores,
      datos_nuevos: datos,
      ip_address: getClientIP(req),
      descripcion: `Información de transporte actualizada: ${operacion.numero_operacion}`
    });
    
    await transaction.commit();
    
    logger.info('Transporte actualizado:', { operacionId: id });
    
    return successMessage(res, 'Información de transporte actualizada', operacion);
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al actualizar transporte:', { message: error.message });
    return serverError(res, 'Error al actualizar', error);
  }
};

/**
 * POST /operaciones/:id/averias
 * Registrar avería con evidencia
 */
const registrarAveria = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const datos = limpiarObjeto(req.body);
    
    const operacion = await Operacion.findByPk(id);
    
    if (!operacion) {
      await transaction.rollback();
      return notFound(res, 'Operación no encontrada');
    }
    
    if (!operacion.esEditable()) {
      await transaction.rollback();
      return errorResponse(res, 'Esta operación ya no se puede modificar', 400);
    }
    
    // Si hay archivo de evidencia
    let fotoData = {};
    if (req.file) {
      fotoData = {
        foto_url: `/uploads/averias/${req.file.filename}`,
        foto_nombre: req.file.originalname,
        foto_tipo: req.file.mimetype,
        foto_tamanio: req.file.size
      };
    }
    
    // Crear avería
    const averia = await OperacionAveria.create({
      operacion_id: id,
      detalle_id: datos.detalle_id,
      sku: datos.sku,
      cantidad: datos.cantidad,
      tipo_averia: datos.tipo_averia,
      descripcion: datos.descripcion,
      ...fotoData,
      registrado_por: req.user.id
    }, { transaction });
    
    // Actualizar detalle si se especificó
    if (datos.detalle_id) {
      const detalle = await OperacionDetalle.findByPk(datos.detalle_id);
      if (detalle) {
        const nuevaCantidadAveria = parseFloat(detalle.cantidad_averia) + parseFloat(datos.cantidad);
        await detalle.update({
          cantidad_averia: nuevaCantidadAveria,
          tipo_averia: datos.tipo_averia,
          observaciones_averia: datos.descripcion
        }, { transaction });
      }
    }
    
    // Actualizar total de averías en operación
    const totalAverias = await OperacionAveria.sum('cantidad', {
      where: { operacion_id: id },
      transaction
    });
    
    await operacion.update({ total_averias: totalAverias || 0 }, { transaction });
    
    await transaction.commit();
    
    logger.info('Avería registrada:', { operacionId: id, averiaId: averia.id });
    
    return created(res, 'Avería registrada exitosamente', averia);
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al registrar avería:', { message: error.message });
    return serverError(res, 'Error al registrar la avería', error);
  }
};

/**
 * POST /operaciones/:id/documentos
 * Subir documento de cumplido
 */
const subirDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_documento, nombre, descripcion } = req.body;
    
    const operacion = await Operacion.findByPk(id);
    
    if (!operacion) {
      return notFound(res, 'Operación no encontrada');
    }
    
    if (!operacion.esEditable()) {
      return errorResponse(res, 'Esta operación ya no se puede modificar', 400);
    }
    
    if (!req.file) {
      return errorResponse(res, 'Debe adjuntar un archivo', 400);
    }
    
    const documento = await OperacionDocumento.create({
      operacion_id: id,
      tipo_documento: tipo_documento || 'cumplido',
      nombre: nombre || req.file.originalname,
      archivo_url: `/uploads/cumplidos/${req.file.filename}`,
      archivo_nombre: req.file.originalname,
      archivo_tipo: req.file.mimetype,
      archivo_tamanio: req.file.size,
      descripcion,
      subido_por: req.user.id
    });
    
    logger.info('Documento subido:', { operacionId: id, documentoId: documento.id });
    
    return created(res, 'Documento subido exitosamente', documento);
    
  } catch (error) {
    logger.error('Error al subir documento:', { message: error.message });
    return serverError(res, 'Error al subir el documento', error);
  }
};

/**
 * POST /operaciones/:id/cerrar
 * Cerrar operación y enviar correo
 */
// Agregar importación al inicio del archivo
const emailService = require('../services/emailService');

// Modificar la función cerrar (reemplazar el TODO)
const cerrar = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { observaciones_cierre, enviar_correo, correos_destino } = req.body;
    
    const operacion = await Operacion.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: OperacionDetalle, as: 'detalles' },
        { model: OperacionDocumento, as: 'documentos' }
      ]
    });
    
    if (!operacion) {
      await transaction.rollback();
      return notFound(res, 'Operación no encontrada');
    }
    
    if (operacion.estado === 'cerrado') {
      await transaction.rollback();
      return errorResponse(res, 'Esta operación ya está cerrada', 400);
    }
    
    // Verificar que tenga al menos un documento de cumplido
    if (operacion.documentos.length === 0) {
      await transaction.rollback();
      return errorResponse(res, 'Debe subir al menos un documento de cumplido antes de cerrar', 400);
    }
    
    // Obtener correos de contactos del cliente si no se especificaron
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
    
    // Actualizar operación
    await operacion.update({
      estado: 'cerrado',
      fecha_cierre: new Date(),
      cerrado_por: req.user.id,
      observaciones_cierre,
      correos_destino: correosEnvio
    }, { transaction });
    
    // Auditoría
    await Auditoria.registrar({
      tabla: 'operaciones',
      registro_id: operacion.id,
      accion: 'actualizar',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      datos_anteriores: { estado: 'en_proceso' },
      datos_nuevos: { estado: 'cerrado' },
      ip_address: getClientIP(req),
      descripcion: `Operación cerrada: ${operacion.numero_operacion}`
    });
    
    await transaction.commit();
    
    // Enviar correo de cierre (fuera de la transacción)
    let resultadoCorreo = { success: false };
    if (enviar_correo !== false && correosEnvio) {
      resultadoCorreo = await emailService.enviarCierreOperacion(operacion, correosEnvio);
      
      // Actualizar estado del correo
      await operacion.update({
        correo_enviado: resultadoCorreo.success,
        fecha_correo_enviado: resultadoCorreo.success ? new Date() : null
      });
    }
    
    logger.info('Operación cerrada:', { 
      operacionId: id,
      correoEnviado: resultadoCorreo.success
    });
    
    return successMessage(res, 'Operación cerrada exitosamente', {
      numero_operacion: operacion.numero_operacion,
      estado: 'cerrado',
      correo_enviado: resultadoCorreo.success,
      correos_destino: correosEnvio,
      preview_url: resultadoCorreo.previewUrl // Solo en desarrollo
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al cerrar operación:', { message: error.message });
    return serverError(res, 'Error al cerrar la operación', error);
  }
};

/**
 * DELETE /operaciones/:id
 * Anular operación
 */
const anular = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const operacion = await Operacion.findByPk(id);
    
    if (!operacion) {
      await transaction.rollback();
      return notFound(res, 'Operación no encontrada');
    }
    
    if (operacion.estado === 'cerrado') {
      await transaction.rollback();
      return errorResponse(res, 'No se puede anular una operación cerrada', 400);
    }
    
    const estadoAnterior = operacion.estado;
    
    await operacion.update({
      estado: 'anulado',
      observaciones: `${operacion.observaciones || ''}\n[ANULADO] ${motivo || 'Sin motivo especificado'}`
    }, { transaction });
    
    await Auditoria.registrar({
      tabla: 'operaciones',
      registro_id: operacion.id,
      accion: 'eliminar',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      datos_anteriores: { estado: estadoAnterior },
      ip_address: getClientIP(req),
      descripcion: `Operación anulada: ${operacion.numero_operacion}. Motivo: ${motivo || 'No especificado'}`
    });
    
    await transaction.commit();
    
    logger.info('Operación anulada:', { operacionId: id });
    
    return successMessage(res, 'Operación anulada exitosamente');
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al anular operación:', { message: error.message });
    return serverError(res, 'Error al anular la operación', error);
  }
};


module.exports = {
  listarDocumentosWMS,
  buscarDocumentoWMS,
  listar,
  estadisticas,
  obtenerPorId,
  crear,
  actualizarTransporte,
  registrarAveria,
  subirDocumento,
  cerrar,
  anular
};