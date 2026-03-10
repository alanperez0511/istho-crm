/**
 * ISTHO CRM - Controlador de Reportes
 * 
 * Maneja la generación y descarga de reportes.
 * 
 * CORRECCIÓN v1.1.0:
 * - getDashboard ahora retorna porTipo y porEstado como objetos
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.1.0
 */

const { Op } = require('sequelize');
const {
  Operacion,
  OperacionDetalle,
  Inventario,
  Cliente,
  Contacto,
  sequelize
} = require('../models');
const excelService = require('../services/excelService');
const pdfService = require('../services/pdfService');
const { serverError, notFound } = require('../utils/responses');
const logger = require('../utils/logger');

/**
 * Parsear filtros de fecha
 */
const parsearFiltrosFecha = (query) => {
  const where = {};
  
  if (query.fecha_desde) {
    where.fecha_operacion = where.fecha_operacion || {};
    where.fecha_operacion[Op.gte] = query.fecha_desde;
  }
  
  if (query.fecha_hasta) {
    where.fecha_operacion = where.fecha_operacion || {};
    where.fecha_operacion[Op.lte] = query.fecha_hasta;
  }
  
  if (query.cliente_id) {
    where.cliente_id = query.cliente_id;
  }
  
  if (query.tipo && query.tipo !== 'todos') {
    where.tipo = query.tipo;
  }
  
  if (query.estado && query.estado !== 'todos') {
    where.estado = query.estado;
  }
  
  return where;
};

// =============================================
// REPORTES DE OPERACIONES
// =============================================

/**
 * GET /reportes/operaciones/excel
 * Exportar operaciones a Excel
 */
const exportarOperacionesExcel = async (req, res) => {
  try {
    const where = parsearFiltrosFecha(req.query);
    
    const operaciones = await Operacion.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'codigo_cliente', 'razon_social'] }
      ],
      order: [['fecha_operacion', 'DESC']]
    });
    
    const buffer = await excelService.exportarOperaciones(operaciones, {
      periodo: req.query.fecha_desde && req.query.fecha_hasta 
        ? `${req.query.fecha_desde} a ${req.query.fecha_hasta}` 
        : null
    });
    
    const filename = `operaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    logger.error('Error al exportar operaciones Excel:', { message: error.message });
    return serverError(res, 'Error al generar el reporte', error);
  }
};

/**
 * GET /reportes/operaciones/pdf
 * Exportar operaciones a PDF
 */
const exportarOperacionesPDF = async (req, res) => {
  try {
    const where = parsearFiltrosFecha(req.query);
    
    const operaciones = await Operacion.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'codigo_cliente', 'razon_social'] }
      ],
      order: [['fecha_operacion', 'DESC']]
    });
    
    const buffer = await pdfService.generarPDFOperaciones(operaciones, req.query);
    
    const filename = `operaciones_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    logger.error('Error al exportar operaciones PDF:', { message: error.message });
    return serverError(res, 'Error al generar el reporte', error);
  }
};

/**
 * GET /reportes/operaciones/:id/excel
 * Exportar detalle de operación a Excel
 */
const exportarDetalleOperacionExcel = async (req, res) => {
  try {
    const { id } = req.params;
    
    const operacion = await Operacion.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: OperacionDetalle, as: 'detalles' }
      ]
    });
    
    if (!operacion) {
      return notFound(res, 'Operación no encontrada');
    }
    
    const buffer = await excelService.exportarDetalleOperacion(operacion);
    
    const filename = `operacion_${operacion.numero_operacion}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    logger.error('Error al exportar detalle Excel:', { message: error.message });
    return serverError(res, 'Error al generar el reporte', error);
  }
};

/**
 * GET /reportes/operaciones/:id/pdf
 * Exportar detalle de operación a PDF
 */
const exportarDetalleOperacionPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const operacion = await Operacion.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: OperacionDetalle, as: 'detalles' }
      ]
    });
    
    if (!operacion) {
      return notFound(res, 'Operación no encontrada');
    }
    
    const buffer = await pdfService.generarPDFDetalleOperacion(operacion);
    
    const filename = `operacion_${operacion.numero_operacion}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    logger.error('Error al exportar detalle PDF:', { message: error.message });
    return serverError(res, 'Error al generar el reporte', error);
  }
};

// =============================================
// REPORTES DE INVENTARIO
// =============================================

/**
 * GET /reportes/inventario/excel
 * Exportar inventario a Excel
 */
const exportarInventarioExcel = async (req, res) => {
  try {
    const where = {};
    
    if (req.query.cliente_id) {
      where.cliente_id = req.query.cliente_id;
    }
    
    if (req.query.estado && req.query.estado !== 'todos') {
      where.estado = req.query.estado;
    }
    
    if (req.query.zona) {
      where.zona = req.query.zona;
    }
    
    const inventario = await Inventario.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'codigo_cliente', 'razon_social'] }
      ],
      order: [['producto', 'ASC']]
    });
    
    const buffer = await excelService.exportarInventario(inventario, req.query);
    
    const filename = `inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    logger.error('Error al exportar inventario Excel:', { message: error.message });
    return serverError(res, 'Error al generar el reporte', error);
  }
};

/**
 * GET /reportes/inventario/pdf
 * Exportar inventario a PDF
 */
const exportarInventarioPDF = async (req, res) => {
  try {
    const where = {};
    
    if (req.query.cliente_id) {
      where.cliente_id = req.query.cliente_id;
    }
    
    if (req.query.estado && req.query.estado !== 'todos') {
      where.estado = req.query.estado;
    }
    
    const inventario = await Inventario.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'codigo_cliente', 'razon_social'] }
      ],
      order: [['producto', 'ASC']]
    });
    
    const buffer = await pdfService.generarPDFInventario(inventario, req.query);
    
    const filename = `inventario_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    logger.error('Error al exportar inventario PDF:', { message: error.message });
    return serverError(res, 'Error al generar el reporte', error);
  }
};

// =============================================
// REPORTES DE CLIENTES
// =============================================

/**
 * GET /reportes/clientes/excel
 * Exportar clientes a Excel
 */
const exportarClientesExcel = async (req, res) => {
  try {
    const where = {};
    
    if (req.query.estado && req.query.estado !== 'todos') {
      where.estado = req.query.estado;
    }
    
    if (req.query.tipo_cliente) {
      where.tipo_cliente = req.query.tipo_cliente;
    }
    
    const clientes = await Cliente.findAll({
      where,
      include: [
        { model: Contacto, as: 'contactos', where: { activo: true }, required: false }
      ],
      order: [['razon_social', 'ASC']]
    });
    
    const buffer = await excelService.exportarClientes(clientes);
    
    const filename = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    logger.error('Error al exportar clientes Excel:', { message: error.message });
    return serverError(res, 'Error al generar el reporte', error);
  }
};

// =============================================
// DASHBOARD
// =============================================

/**
 * GET /reportes/dashboard
 * Datos consolidados para dashboard
 * 
 * CORREGIDO: porTipo y porEstado ahora son objetos, no arrays
 */
const getDashboard = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());

    // Filtro base por cliente (inyectado por filtrarPorCliente middleware)
    const clienteFilter = req.query.cliente_id ? { cliente_id: req.query.cliente_id } : {};
    const esCliente = !!req.query.cliente_id;

    // ═══════════════════════════════════════════════════════════════════════
    // OPERACIONES
    // ═══════════════════════════════════════════════════════════════════════

    const [
      totalOperaciones,
      operacionesMes,
      operacionesSemana,
      operacionesPendientes,
      operacionesPorTipoRaw,
      operacionesPorEstadoRaw,
      entradasPendientes,
      salidasPendientes,
      enProceso,
      cerradasMes
    ] = await Promise.all([
      Operacion.count({ where: { ...clienteFilter } }),
      Operacion.count({ where: { ...clienteFilter, created_at: { [Op.gte]: inicioMes } } }),
      Operacion.count({ where: { ...clienteFilter, created_at: { [Op.gte]: inicioSemana } } }),
      Operacion.count({ where: { ...clienteFilter, estado: { [Op.in]: ['pendiente', 'en_proceso'] } } }),
      Operacion.findAll({
        attributes: ['tipo', [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']],
        where: { ...clienteFilter },
        group: ['tipo'],
        raw: true
      }),
      Operacion.findAll({
        attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']],
        where: { ...clienteFilter },
        group: ['estado'],
        raw: true
      }),
      // KPIs de auditoría
      Operacion.count({ where: { ...clienteFilter, tipo: 'ingreso', estado: { [Op.in]: ['pendiente', 'en_proceso'] } } }),
      Operacion.count({ where: { ...clienteFilter, tipo: 'salida', estado: { [Op.in]: ['pendiente', 'en_proceso'] } } }),
      Operacion.count({ where: { ...clienteFilter, estado: 'en_proceso' } }),
      Operacion.count({ where: { ...clienteFilter, estado: 'cerrado', created_at: { [Op.gte]: inicioMes } } }),
    ]);
    
    // Convertir arrays a objetos para el frontend
    const porTipo = {
      ingreso: 0,
      salida: 0,
      transferencia: 0,
      ajuste: 0
    };
    operacionesPorTipoRaw.forEach(item => {
      if (item.tipo) {
        porTipo[item.tipo] = parseInt(item.cantidad) || 0;
      }
    });
    
    const porEstado = {
      pendiente: 0,
      en_proceso: 0,
      cerrado: 0,
      anulado: 0
    };
    operacionesPorEstadoRaw.forEach(item => {
      if (item.estado) {
        porEstado[item.estado] = parseInt(item.cantidad) || 0;
      }
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // INVENTARIO
    // ═══════════════════════════════════════════════════════════════════════
    
    const invFilter = clienteFilter;
    const [
      totalItems,
      totalUnidades,
      valorInventarioRaw,
      itemsStockBajo,
      itemsPorVencer
    ] = await Promise.all([
      Inventario.count({ where: { ...invFilter } }),
      Inventario.sum('cantidad', { where: { ...invFilter } }),
      Inventario.findAll({
        attributes: [[sequelize.literal('SUM(cantidad * COALESCE(costo_unitario, 0))'), 'valor']],
        where: { ...invFilter },
        raw: true
      }),
      Inventario.count({
        where: { ...invFilter, [Op.and]: [sequelize.literal('cantidad <= stock_minimo AND stock_minimo > 0')] }
      }),
      Inventario.count({
        where: {
          ...invFilter,
          fecha_vencimiento: {
            [Op.between]: [hoy, new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)]
          }
        }
      })
    ]);
    
    // ═══════════════════════════════════════════════════════════════════════
    // CLIENTES
    // ═══════════════════════════════════════════════════════════════════════
    
    // Para clientes, solo mostrar su propio dato
    const clienteWhere = esCliente ? { id: req.query.cliente_id } : {};
    const [
      totalClientes,
      clientesActivos,
      clientesNuevosMes
    ] = await Promise.all([
      Cliente.count({ where: { ...clienteWhere } }),
      Cliente.count({ where: { ...clienteWhere, estado: 'activo' } }),
      esCliente ? 0 : Cliente.count({ where: { created_at: { [Op.gte]: inicioMes } } })
    ]);
    
    // ═══════════════════════════════════════════════════════════════════════
    // ÚLTIMAS OPERACIONES
    // ═══════════════════════════════════════════════════════════════════════
    
    const ultimasOperaciones = await Operacion.findAll({
      where: { ...clienteFilter },
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: Cliente, as: 'cliente', attributes: ['razon_social'] }],
      attributes: ['id', 'numero_operacion', 'tipo', 'estado', 'total_unidades', 'created_at']
    });

    // Últimas entradas y salidas por separado (para tablas del dashboard)
    const [ultimasEntradas, ultimasSalidas] = await Promise.all([
      Operacion.findAll({
        where: { ...clienteFilter, tipo: 'ingreso' },
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          { model: Cliente, as: 'cliente', attributes: ['razon_social'] },
          { model: OperacionDetalle, as: 'detalles', attributes: ['id'] }
        ],
        attributes: ['id', 'numero_operacion', 'documento_wms', 'tipo', 'estado', 'total_unidades', 'total_referencias', 'created_at']
      }),
      Operacion.findAll({
        where: { ...clienteFilter, tipo: 'salida' },
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          { model: Cliente, as: 'cliente', attributes: ['razon_social'] },
          { model: OperacionDetalle, as: 'detalles', attributes: ['id'] }
        ],
        attributes: ['id', 'numero_operacion', 'documento_wms', 'tipo', 'estado', 'total_unidades', 'total_referencias', 'created_at']
      }),
    ]);

    const formatOp = (op) => ({
      id: op.id,
      documento: op.documento_wms || op.numero_operacion,
      cliente: op.cliente?.razon_social || 'N/A',
      tipo: op.tipo,
      lineas: op.detalles?.length || 0,
      verificadas: 0,
      estado: op.estado,
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // RESPUESTA
    // ═══════════════════════════════════════════════════════════════════════
    
    return res.json({
      success: true,
      data: {
        operaciones: {
          total: totalOperaciones || 0,
          mes: operacionesMes || 0,
          semana: operacionesSemana || 0,
          pendientes: operacionesPendientes || 0,
          entradasPendientes: entradasPendientes || 0,
          salidasPendientes: salidasPendientes || 0,
          enProceso: enProceso || 0,
          cerradasMes: cerradasMes || 0,
          porTipo,
          porEstado
        },
        inventario: {
          totalItems: totalItems || 0,
          totalUnidades: parseFloat(totalUnidades) || 0,
          valorTotal: parseFloat(valorInventarioRaw[0]?.valor) || 0,
          alertas: {
            stockBajo: itemsStockBajo || 0,
            porVencer: itemsPorVencer || 0
          }
        },
        clientes: {
          total: totalClientes || 0,
          activos: clientesActivos || 0,
          nuevosMes: clientesNuevosMes || 0
        },
        ultimasOperaciones: ultimasOperaciones || [],
        ultimasEntradas: ultimasEntradas.map(formatOp),
        ultimasSalidas: ultimasSalidas.map(formatOp)
      }
    });
    
  } catch (error) {
    logger.error('Error al obtener dashboard:', { message: error.message, stack: error.stack });
    return serverError(res, 'Error al obtener datos del dashboard', error);
  }
};

module.exports = {
  exportarOperacionesExcel,
  exportarOperacionesPDF,
  exportarDetalleOperacionExcel,
  exportarDetalleOperacionPDF,
  exportarInventarioExcel,
  exportarInventarioPDF,
  exportarClientesExcel,
  getDashboard
};