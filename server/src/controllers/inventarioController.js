/**
 * ISTHO CRM - Controlador de Inventario
 * 
 * Maneja todas las operaciones CRUD de inventario.
 * Incluye alertas de stock, filtros avanzados y estadísticas.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const { Op } = require('sequelize');
const { Inventario, Cliente, Auditoria, sequelize } = require('../models');
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
  getClientIP,
  sanitizarBusqueda
} = require('../utils/helpers');
const logger = require('../utils/logger');

// Campos permitidos para ordenamiento
const CAMPOS_ORDENAMIENTO = ['producto', 'sku', 'cantidad', 'ubicacion', 'fecha_vencimiento', 'created_at', 'estado'];

// =============================================
// OPERACIONES DE INVENTARIO
// =============================================

/**
 * GET /inventario
 * Listar inventario con paginación, filtros y búsqueda
 */
const listar = async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginacion(req.query);
    const order = parseOrdenamiento(req.query, CAMPOS_ORDENAMIENTO);
    
    // Construir condiciones de filtro
    const where = {};
    
    // Filtro por cliente
    if (req.query.cliente_id) {
      where.cliente_id = req.query.cliente_id;
    }
    
    // Filtro por estado
    if (req.query.estado && req.query.estado !== 'todos') {
      where.estado = req.query.estado;
    }
    
    // Filtro por categoría
    if (req.query.categoria) {
      where.categoria = { [Op.like]: `%${sanitizarBusqueda(req.query.categoria)}%` };
    }
    
    // Filtro por zona
    if (req.query.zona) {
      where.zona = { [Op.like]: `%${sanitizarBusqueda(req.query.zona)}%` };
    }
    
    // Filtro por ubicación
    if (req.query.ubicacion) {
      where.ubicacion = { [Op.like]: `%${sanitizarBusqueda(req.query.ubicacion)}%` };
    }
    
    // Filtro por stock bajo
    if (req.query.stock_bajo === 'true') {
      where[Op.and] = [
        sequelize.literal('cantidad <= stock_minimo'),
        { stock_minimo: { [Op.gt]: 0 } }
      ];
    }
    
    // Filtro por próximos a vencer (30 días)
    if (req.query.por_vencer === 'true') {
      const hoy = new Date();
      const en30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      where.fecha_vencimiento = {
        [Op.between]: [hoy, en30Dias]
      };
    }
    
    // Búsqueda general (producto, SKU, código de barras)
    if (req.query.search) {
      const searchTerm = sanitizarBusqueda(req.query.search);
      where[Op.or] = [
        { producto: { [Op.like]: `%${searchTerm}%` } },
        { sku: { [Op.like]: `%${searchTerm}%` } },
        { codigo_barras: { [Op.like]: `%${searchTerm}%` } },
        { lote: { [Op.like]: `%${searchTerm}%` } }
      ];
    }
    
    // Ejecutar consulta
    const { count, rows } = await Inventario.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['id', 'codigo_cliente', 'razon_social']
      }]
    });
    
    // Agregar campos virtuales calculados
    const inventarioConCalculos = rows.map(item => {
      const itemJSON = item.toJSON();
      itemJSON.cantidad_disponible = item.cantidad_disponible;
      itemJSON.valor_total = item.valor_total;
      itemJSON.stock_bajo = item.tieneStockBajo();
      itemJSON.proximo_a_vencer = item.proximoAVencer();
      return itemJSON;
    });
    
    logger.debug('Inventario listado:', { 
      total: count, 
      page, 
      filtros: req.query 
    });
    
    return paginated(res, inventarioConCalculos, buildPaginacion(count, page, limit));
    
  } catch (error) {
    logger.error('Error al listar inventario:', { message: error.message });
    return serverError(res, 'Error al obtener el inventario', error);
  }
};

/**
 * GET /inventario/stats
 * Obtener estadísticas de inventario
 */
const estadisticas = async (req, res) => {
  try {
    const whereCliente = req.query.cliente_id ? { cliente_id: req.query.cliente_id } : {};
    
    // Total de items y valor
    const totales = await Inventario.findOne({
      where: whereCliente,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_items'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_unidades'],
        [sequelize.fn('SUM', sequelize.literal('cantidad * COALESCE(costo_unitario, 0)')), 'valor_total']
      ],
      raw: true
    });
    
    // Por estado
    const porEstado = await Inventario.findAll({
      where: whereCliente,
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      group: ['estado'],
      raw: true
    });
    
    // Stock bajo
    const stockBajo = await Inventario.count({
      where: {
        ...whereCliente,
        [Op.and]: [
          sequelize.literal('cantidad <= stock_minimo'),
          { stock_minimo: { [Op.gt]: 0 } }
        ]
      }
    });
    
    // Próximos a vencer (30 días)
    const hoy = new Date();
    const en30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const proximosVencer = await Inventario.count({
      where: {
        ...whereCliente,
        fecha_vencimiento: {
          [Op.between]: [hoy, en30Dias]
        }
      }
    });
    
    // Vencidos
    const vencidos = await Inventario.count({
      where: {
        ...whereCliente,
        fecha_vencimiento: {
          [Op.lt]: hoy
        }
      }
    });
    
    // Por categoría (top 10)
    const porCategoria = await Inventario.findAll({
      where: {
        ...whereCliente,
        categoria: { [Op.ne]: null }
      },
      attributes: [
        'categoria',
        [sequelize.fn('COUNT', sequelize.col('id')), 'items'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'unidades']
      ],
      group: ['categoria'],
      order: [[sequelize.literal('unidades'), 'DESC']],
      limit: 10,
      raw: true
    });
    
    // Por zona
    const porZona = await Inventario.findAll({
      where: {
        ...whereCliente,
        zona: { [Op.ne]: null }
      },
      attributes: [
        'zona',
        [sequelize.fn('COUNT', sequelize.col('id')), 'items'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'unidades']
      ],
      group: ['zona'],
      order: [[sequelize.literal('unidades'), 'DESC']],
      raw: true
    });
    
    const stats = {
      resumen: {
        total_items: parseInt(totales.total_items) || 0,
        total_unidades: parseFloat(totales.total_unidades) || 0,
        valor_total: parseFloat(totales.valor_total) || 0
      },
      alertas: {
        stock_bajo: stockBajo,
        proximos_vencer: proximosVencer,
        vencidos: vencidos
      },
      porEstado: porEstado.map(e => ({
        estado: e.estado,
        cantidad: parseInt(e.cantidad)
      })),
      porCategoria: porCategoria.map(c => ({
        categoria: c.categoria,
        items: parseInt(c.items),
        unidades: parseFloat(c.unidades)
      })),
      porZona: porZona.map(z => ({
        zona: z.zona,
        items: parseInt(z.items),
        unidades: parseFloat(z.unidades)
      }))
    };
    
    return success(res, stats);
    
  } catch (error) {
    logger.error('Error al obtener estadísticas de inventario:', { message: error.message });
    return serverError(res, 'Error al obtener estadísticas', error);
  }
};

/**
 * GET /inventario/alertas
 * Obtener alertas de stock bajo y vencimientos
 */
const alertas = async (req, res) => {
  try {
    const whereCliente = req.query.cliente_id ? { cliente_id: req.query.cliente_id } : {};
    
    // Stock bajo
    const stockBajo = await Inventario.findAll({
      where: {
        ...whereCliente,
        [Op.and]: [
          sequelize.literal('cantidad <= stock_minimo'),
          { stock_minimo: { [Op.gt]: 0 } }
        ]
      },
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['id', 'codigo_cliente', 'razon_social']
      }],
      order: [['cantidad', 'ASC']],
      limit: 50
    });
    
    // Próximos a vencer (30 días)
    const hoy = new Date();
    const en30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const proximosVencer = await Inventario.findAll({
      where: {
        ...whereCliente,
        fecha_vencimiento: {
          [Op.between]: [hoy, en30Dias]
        }
      },
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['id', 'codigo_cliente', 'razon_social']
      }],
      order: [['fecha_vencimiento', 'ASC']],
      limit: 50
    });
    
    // Vencidos
    const vencidos = await Inventario.findAll({
      where: {
        ...whereCliente,
        fecha_vencimiento: {
          [Op.lt]: hoy
        },
        estado: { [Op.ne]: 'vencido' } // Que aún no se han marcado
      },
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['id', 'codigo_cliente', 'razon_social']
      }],
      order: [['fecha_vencimiento', 'ASC']],
      limit: 50
    });
    
    return success(res, {
      stock_bajo: stockBajo,
      proximos_vencer: proximosVencer,
      vencidos: vencidos
    });
    
  } catch (error) {
    logger.error('Error al obtener alertas:', { message: error.message });
    return serverError(res, 'Error al obtener alertas', error);
  }
};

/**
 * GET /inventario/:id
 * Obtener un item de inventario por ID
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Inventario.findByPk(id, {
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['id', 'codigo_cliente', 'razon_social', 'nit']
      }]
    });
    
    if (!item) {
      return notFound(res, 'Item de inventario no encontrado');
    }
    
    // Agregar campos calculados
    const itemJSON = item.toJSON();
    itemJSON.cantidad_disponible = item.cantidad_disponible;
    itemJSON.valor_total = item.valor_total;
    itemJSON.stock_bajo = item.tieneStockBajo();
    itemJSON.proximo_a_vencer = item.proximoAVencer();
    itemJSON.esta_vencido = item.estaVencido();
    
    return success(res, itemJSON);
    
  } catch (error) {
    logger.error('Error al obtener item:', { message: error.message, id: req.params.id });
    return serverError(res, 'Error al obtener el item', error);
  }
};

/**
 * GET /inventario/cliente/:clienteId
 * Obtener inventario de un cliente específico
 */
const obtenerPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { page, limit, offset } = parsePaginacion(req.query);
    const order = parseOrdenamiento(req.query, CAMPOS_ORDENAMIENTO);
    
    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return notFound(res, 'Cliente no encontrado');
    }
    
    const where = { cliente_id: clienteId };
    
    // Filtro por estado
    if (req.query.estado && req.query.estado !== 'todos') {
      where.estado = req.query.estado;
    }
    
    // Búsqueda
    if (req.query.search) {
      const searchTerm = sanitizarBusqueda(req.query.search);
      where[Op.or] = [
        { producto: { [Op.like]: `%${searchTerm}%` } },
        { sku: { [Op.like]: `%${searchTerm}%` } }
      ];
    }
    
    const { count, rows } = await Inventario.findAndCountAll({
      where,
      order,
      limit,
      offset
    });
    
    // Agregar campos calculados
    const inventarioConCalculos = rows.map(item => {
      const itemJSON = item.toJSON();
      itemJSON.cantidad_disponible = item.cantidad_disponible;
      itemJSON.valor_total = item.valor_total;
      itemJSON.stock_bajo = item.tieneStockBajo();
      return itemJSON;
    });
    
    return paginated(res, inventarioConCalculos, buildPaginacion(count, page, limit));
    
  } catch (error) {
    logger.error('Error al obtener inventario por cliente:', { message: error.message });
    return serverError(res, 'Error al obtener el inventario', error);
  }
};

/**
 * POST /inventario
 * Crear un nuevo item de inventario
 */
const crear = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const datos = limpiarObjeto(req.body);
    
    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(datos.cliente_id);
    if (!cliente) {
      await transaction.rollback();
      return notFound(res, 'Cliente no encontrado');
    }
    
    // Verificar SKU+Lote duplicado para el mismo cliente
    const existente = await Inventario.findOne({
      where: {
        cliente_id: datos.cliente_id,
        sku: datos.sku,
        lote: datos.lote || null
      }
    });
    
    if (existente) {
      await transaction.rollback();
      return conflict(res, `Ya existe un item con SKU ${datos.sku}${datos.lote ? ` y lote ${datos.lote}` : ''} para este cliente`);
    }
    
    // Crear item
    const item = await Inventario.create(datos, { transaction });
    
    // Registrar en auditoría
    await Auditoria.registrar({
      tabla: 'inventario',
      registro_id: item.id,
      accion: 'crear',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      datos_nuevos: datos,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      descripcion: `Item de inventario creado: ${item.producto} (${item.sku}) - Cliente: ${cliente.razon_social}`
    });
    
    await transaction.commit();
    
    logger.info('Item de inventario creado:', { 
      itemId: item.id, 
      sku: item.sku,
      clienteId: datos.cliente_id,
      creadoPor: req.user.id 
    });
    
    return created(res, 'Item de inventario creado exitosamente', item);
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al crear item de inventario:', { message: error.message });
    return serverError(res, 'Error al crear el item', error);
  }
};

/**
 * PUT /inventario/:id
 * Actualizar un item de inventario
 */
const actualizar = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const datos = limpiarObjeto(req.body);
    
    // Buscar item
    const item = await Inventario.findByPk(id);
    
    if (!item) {
      await transaction.rollback();
      return notFound(res, 'Item de inventario no encontrado');
    }
    
    // Si se cambia SKU o lote, verificar que no exista duplicado
    if ((datos.sku && datos.sku !== item.sku) || (datos.lote !== undefined && datos.lote !== item.lote)) {
      const existente = await Inventario.findOne({
        where: {
          cliente_id: item.cliente_id,
          sku: datos.sku || item.sku,
          lote: datos.lote !== undefined ? datos.lote : item.lote,
          id: { [Op.ne]: id }
        }
      });
      
      if (existente) {
        await transaction.rollback();
        return conflict(res, 'Ya existe un item con ese SKU y lote para este cliente');
      }
    }
    
    // Guardar datos anteriores
    const datosAnteriores = item.toJSON();
    
    // Actualizar
    await item.update(datos, { transaction });
    
    // Registrar en auditoría
    await Auditoria.registrar({
      tabla: 'inventario',
      registro_id: item.id,
      accion: 'actualizar',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      datos_anteriores: datosAnteriores,
      datos_nuevos: datos,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      descripcion: `Item de inventario actualizado: ${item.producto} (${item.sku})`
    });
    
    await transaction.commit();
    
    // Recargar con cliente
    await item.reload({
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['id', 'codigo_cliente', 'razon_social']
      }]
    });
    
    logger.info('Item de inventario actualizado:', { 
      itemId: id, 
      actualizadoPor: req.user.id 
    });
    
    return successMessage(res, 'Item de inventario actualizado exitosamente', item);
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al actualizar item:', { message: error.message, id: req.params.id });
    return serverError(res, 'Error al actualizar el item', error);
  }
};

/**
 * DELETE /inventario/:id
 * Eliminar un item de inventario
 */
const eliminar = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const item = await Inventario.findByPk(id, {
      include: [{ model: Cliente, as: 'cliente' }]
    });
    
    if (!item) {
      await transaction.rollback();
      return notFound(res, 'Item de inventario no encontrado');
    }
    
    // Verificar si tiene cantidad > 0
    if (parseFloat(item.cantidad) > 0) {
      await transaction.rollback();
      return errorResponse(
        res, 
        'No se puede eliminar un item con stock disponible. Primero ajuste la cantidad a 0.',
        400
      );
    }
    
    const datosAnteriores = item.toJSON();
    
    // Eliminar
    await item.destroy({ transaction });
    
    // Registrar en auditoría
    await Auditoria.registrar({
      tabla: 'inventario',
      registro_id: id,
      accion: 'eliminar',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      datos_anteriores: datosAnteriores,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      descripcion: `Item de inventario eliminado: ${item.producto} (${item.sku}) - Cliente: ${item.cliente?.razon_social}`
    });
    
    await transaction.commit();
    
    logger.info('Item de inventario eliminado:', { 
      itemId: id, 
      eliminadoPor: req.user.id 
    });
    
    return successMessage(res, 'Item de inventario eliminado exitosamente');
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al eliminar item:', { message: error.message, id: req.params.id });
    return serverError(res, 'Error al eliminar el item', error);
  }
};

/**
 * POST /inventario/:id/ajustar
 * Ajustar cantidad de inventario (entrada, salida, ajuste)
 */
const ajustarCantidad = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { cantidad, tipo, motivo } = req.body;
    
    const item = await Inventario.findByPk(id);
    
    if (!item) {
      await transaction.rollback();
      return notFound(res, 'Item de inventario no encontrado');
    }
    
    const cantidadAnterior = parseFloat(item.cantidad);
    let cantidadNueva;
    
    switch (tipo) {
      case 'entrada':
        cantidadNueva = cantidadAnterior + parseFloat(cantidad);
        break;
      case 'salida':
        cantidadNueva = cantidadAnterior - parseFloat(cantidad);
        if (cantidadNueva < 0) {
          await transaction.rollback();
          return errorResponse(res, 'No hay suficiente stock para esta salida', 400);
        }
        break;
      case 'ajuste':
        cantidadNueva = parseFloat(cantidad);
        break;
      default:
        await transaction.rollback();
        return errorResponse(res, 'Tipo de ajuste no válido', 400);
    }
    
    // Guardar datos anteriores
    const datosAnteriores = { cantidad: cantidadAnterior };
    
    // Actualizar cantidad
    await item.update({ cantidad: cantidadNueva }, { transaction });
    
    // Registrar en auditoría
    await Auditoria.registrar({
      tabla: 'inventario',
      registro_id: item.id,
      accion: 'actualizar',
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre_completo,
      datos_anteriores: datosAnteriores,
      datos_nuevos: { 
        cantidad: cantidadNueva, 
        tipo_ajuste: tipo, 
        cantidad_ajustada: cantidad,
        motivo 
      },
      ip_address: getClientIP(req),
      descripcion: `Ajuste de inventario (${tipo}): ${item.producto} - ${cantidadAnterior} → ${cantidadNueva}. ${motivo || ''}`
    });
    
    await transaction.commit();
    
    logger.info('Cantidad de inventario ajustada:', { 
      itemId: id, 
      tipo,
      cantidadAnterior,
      cantidadNueva,
      ajustadoPor: req.user.id 
    });
    
    return successMessage(res, 'Cantidad ajustada exitosamente', {
      id: item.id,
      producto: item.producto,
      sku: item.sku,
      cantidad_anterior: cantidadAnterior,
      cantidad_nueva: cantidadNueva,
      diferencia: cantidadNueva - cantidadAnterior
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al ajustar cantidad:', { message: error.message, id: req.params.id });
    return serverError(res, 'Error al ajustar la cantidad', error);
  }
};

module.exports = {
  listar,
  estadisticas,
  alertas,
  obtenerPorId,
  obtenerPorCliente,
  crear,
  actualizar,
  eliminar,
  ajustarCantidad
};