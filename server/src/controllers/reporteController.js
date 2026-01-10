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
    
    // ═══════════════════════════════════════════════════════════════════════
    // OPERACIONES
    // ═══════════════════════════════════════════════════════════════════════
    
    const [
      totalOperaciones,
      operacionesMes,
      operacionesSemana,
      operacionesPendientes,
      operacionesPorTipoRaw,
      operacionesPorEstadoRaw
    ] = await Promise.all([
      Operacion.count(),
      Operacion.count({ where: { created_at: { [Op.gte]: inicioMes } } }),
      Operacion.count({ where: { created_at: { [Op.gte]: inicioSemana } } }),
      Operacion.count({ where: { estado: { [Op.in]: ['pendiente', 'en_proceso'] } } }),
      Operacion.findAll({
        attributes: ['tipo', [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']],
        group: ['tipo'],
        raw: true
      }),
      Operacion.findAll({
        attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']],
        group: ['estado'],
        raw: true
      })
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
    
    const [
      totalItems,
      totalUnidades,
      valorInventarioRaw,
      itemsStockBajo,
      itemsPorVencer
    ] = await Promise.all([
      Inventario.count(),
      Inventario.sum('cantidad'),
      Inventario.findAll({
        attributes: [[sequelize.literal('SUM(cantidad * COALESCE(costo_unitario, 0))'), 'valor']],
        raw: true
      }),
      Inventario.count({
        where: sequelize.literal('cantidad <= stock_minimo AND stock_minimo > 0')
      }),
      Inventario.count({
        where: {
          fecha_vencimiento: {
            [Op.between]: [hoy, new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)]
          }
        }
      })
    ]);
    
    // ═══════════════════════════════════════════════════════════════════════
    // CLIENTES
    // ═══════════════════════════════════════════════════════════════════════
    
    const [
      totalClientes,
      clientesActivos,
      clientesNuevosMes
    ] = await Promise.all([
      Cliente.count(),
      Cliente.count({ where: { estado: 'activo' } }),
      Cliente.count({ where: { created_at: { [Op.gte]: inicioMes } } })
    ]);
    
    // ═══════════════════════════════════════════════════════════════════════
    // ÚLTIMAS OPERACIONES
    // ═══════════════════════════════════════════════════════════════════════
    
    const ultimasOperaciones = await Operacion.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: Cliente, as: 'cliente', attributes: ['razon_social'] }],
      attributes: ['id', 'numero_operacion', 'tipo', 'estado', 'total_unidades', 'created_at']
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
          porTipo,    // Ahora es objeto: { ingreso: N, salida: N, ... }
          porEstado   // Ahora es objeto: { pendiente: N, en_proceso: N, ... }
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
        ultimasOperaciones: ultimasOperaciones || []
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