/**
 * ISTHO CRM - Controlador de Reportes
 * 
 * Maneja la generación y descarga de reportes.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
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
 */
const getDashboard = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    
    // Operaciones
    const [
      totalOperaciones,
      operacionesMes,
      operacionesSemana,
      operacionesPendientes,
      operacionesPorTipo,
      operacionesPorEstado
    ] = await Promise.all([
      Operacion.count(),
      Operacion.count({ where: { created_at: { [Op.gte]: inicioMes } } }),
      Operacion.count({ where: { created_at: { [Op.gte]: inicioSemana } } }),
      Operacion.count({ where: { estado: ['pendiente', 'en_proceso'] } }),
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
    
    // Inventario
    const [
      totalItems,
      totalUnidades,
      valorInventario,
      itemsStockBajo,
      itemsPorVencer
    ] = await Promise.all([
      Inventario.count(),
      Inventario.sum('cantidad'),
      Inventario.findAll({
        attributes: [[sequelize.literal('SUM(cantidad * costo_unitario)'), 'valor']],
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
    
    // Clientes
    const [
      totalClientes,
      clientesActivos,
      clientesNuevosMes
    ] = await Promise.all([
      Cliente.count(),
      Cliente.count({ where: { estado: 'activo' } }),
      Cliente.count({ where: { created_at: { [Op.gte]: inicioMes } } })
    ]);
    
    // Últimas operaciones
    const ultimasOperaciones = await Operacion.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: Cliente, as: 'cliente', attributes: ['razon_social'] }],
      attributes: ['id', 'numero_operacion', 'tipo', 'estado', 'total_unidades', 'created_at']
    });
    
    return res.json({
      success: true,
      data: {
        operaciones: {
          total: totalOperaciones,
          mes: operacionesMes,
          semana: operacionesSemana,
          pendientes: operacionesPendientes,
          porTipo: operacionesPorTipo,
          porEstado: operacionesPorEstado
        },
        inventario: {
          totalItems,
          totalUnidades: parseFloat(totalUnidades) || 0,
          valorTotal: parseFloat(valorInventario[0]?.valor) || 0,
          alertas: {
            stockBajo: itemsStockBajo,
            porVencer: itemsPorVencer
          }
        },
        clientes: {
          total: totalClientes,
          activos: clientesActivos,
          nuevosMes: clientesNuevosMes
        },
        ultimasOperaciones
      }
    });
    
  } catch (error) {
    logger.error('Error al obtener dashboard:', { message: error.message });
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