/**
 * ============================================================================
 * ISTHO CRM - Modelo MovimientoInventario
 * ============================================================================
 * Registra el historial de todos los movimientos de inventario:
 * entradas, salidas, ajustes, reservas, etc.
 * 
 * Permite trazabilidad completa y auditoría de cambios de stock.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 * @date Enero 2026
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MovimientoInventario = sequelize.define('MovimientoInventario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // ════════════════════════════════════════════════════════════════════════
    // RELACIONES
    // ════════════════════════════════════════════════════════════════════════
    
    inventario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'inventario',
        key: 'id'
      },
      comment: 'FK al registro de inventario'
    },
    
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      comment: 'Usuario que realizó el movimiento'
    },
    
    operacion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'operaciones',
        key: 'id'
      },
      comment: 'Operación relacionada (si aplica)'
    },
    
    // ════════════════════════════════════════════════════════════════════════
    // DATOS DEL MOVIMIENTO
    // ════════════════════════════════════════════════════════════════════════
    
    tipo: {
      type: DataTypes.ENUM('entrada', 'salida', 'ajuste', 'reserva', 'liberacion', 'transferencia'),
      allowNull: false,
      comment: 'Tipo de movimiento'
    },
    
    motivo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Motivo del movimiento (compra, despacho, ajuste, etc.)'
    },
    
    cantidad: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      comment: 'Cantidad del movimiento (positivo=entrada, negativo=salida)'
    },
    
    stock_anterior: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      comment: 'Stock antes del movimiento'
    },
    
    stock_resultante: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      comment: 'Stock después del movimiento'
    },
    
    // ════════════════════════════════════════════════════════════════════════
    // DOCUMENTACIÓN
    // ════════════════════════════════════════════════════════════════════════
    
    documento_referencia: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Número de documento de referencia (OC, factura, remisión)'
    },
    
    documento_tipo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Tipo de documento (orden_compra, factura, remision, etc.)'
    },
    
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // ════════════════════════════════════════════════════════════════════════
    // DATOS DE UBICACIÓN (para transferencias)
    // ════════════════════════════════════════════════════════════════════════
    
    ubicacion_origen: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Ubicación de origen (para transferencias)'
    },
    
    ubicacion_destino: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Ubicación de destino (para transferencias)'
    },
    
    // ════════════════════════════════════════════════════════════════════════
    // COSTOS
    // ════════════════════════════════════════════════════════════════════════
    
    costo_unitario: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Costo unitario al momento del movimiento'
    },
    
    costo_total: {
      type: DataTypes.VIRTUAL,
      get() {
        const cantidad = Math.abs(parseFloat(this.getDataValue('cantidad')) || 0);
        const costo = parseFloat(this.getDataValue('costo_unitario')) || 0;
        return cantidad * costo;
      }
    },
    
    // ════════════════════════════════════════════════════════════════════════
    // METADATOS
    // ════════════════════════════════════════════════════════════════════════
    
    fecha_movimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha y hora del movimiento'
    },
    
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
    
  }, {
    tableName: 'movimientos_inventario',
    timestamps: true,
    underscored: true,
    
    indexes: [
      { fields: ['inventario_id'] },
      { fields: ['usuario_id'] },
      { fields: ['operacion_id'] },
      { fields: ['tipo'] },
      { fields: ['fecha_movimiento'] },
      { fields: ['documento_referencia'] },
      // Índice compuesto para consultas frecuentes
      { 
        fields: ['inventario_id', 'fecha_movimiento'],
        name: 'idx_inventario_fecha'
      }
    ]
  });

  // ============================================
  // MÉTODOS ESTÁTICOS
  // ============================================

  /**
   * Registrar un movimiento de inventario
   * @param {Object} datos - Datos del movimiento
   * @param {Object} options - Opciones de Sequelize (transaction, etc.)
   */
  MovimientoInventario.registrar = async function(datos, options = {}) {
    return await this.create({
      inventario_id: datos.inventario_id,
      usuario_id: datos.usuario_id,
      operacion_id: datos.operacion_id || null,
      tipo: datos.tipo,
      motivo: datos.motivo,
      cantidad: datos.cantidad,
      stock_anterior: datos.stock_anterior,
      stock_resultante: datos.stock_resultante,
      documento_referencia: datos.documento_referencia,
      documento_tipo: datos.documento_tipo,
      observaciones: datos.observaciones,
      ubicacion_origen: datos.ubicacion_origen,
      ubicacion_destino: datos.ubicacion_destino,
      costo_unitario: datos.costo_unitario,
      fecha_movimiento: datos.fecha_movimiento || new Date(),
      ip_address: datos.ip_address,
      user_agent: datos.user_agent
    }, options);
  };

  /**
   * Obtener historial de un producto
   * @param {number} inventarioId - ID del registro de inventario
   * @param {Object} options - Opciones de filtrado
   */
  MovimientoInventario.getHistorial = async function(inventarioId, options = {}) {
    const { 
      limit = 50, 
      offset = 0, 
      tipo = null,
      fechaDesde = null,
      fechaHasta = null 
    } = options;
    
    const where = { inventario_id: inventarioId };
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (fechaDesde || fechaHasta) {
      where.fecha_movimiento = {};
      if (fechaDesde) {
        where.fecha_movimiento[require('sequelize').Op.gte] = fechaDesde;
      }
      if (fechaHasta) {
        where.fecha_movimiento[require('sequelize').Op.lte] = fechaHasta;
      }
    }
    
    return await this.findAndCountAll({
      where,
      order: [['fecha_movimiento', 'DESC']],
      limit,
      offset,
      include: [{
        model: sequelize.models.Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre_completo', 'username']
      }]
    });
  };

  /**
   * Obtener estadísticas de movimientos para un producto
   * @param {number} inventarioId - ID del registro de inventario
   * @param {number} meses - Número de meses hacia atrás
   */
  MovimientoInventario.getEstadisticas = async function(inventarioId, meses = 6) {
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - meses);
    
    const movimientos = await this.findAll({
      where: {
        inventario_id: inventarioId,
        fecha_movimiento: {
          [require('sequelize').Op.gte]: fechaInicio
        }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_movimiento'), '%Y-%m'), 'mes'],
        'tipo',
        [sequelize.fn('SUM', sequelize.literal('ABS(cantidad)')), 'total']
      ],
      group: ['mes', 'tipo'],
      order: [['mes', 'ASC']],
      raw: true
    });
    
    // Transformar a formato para gráficos
    const mesesUnicos = [...new Set(movimientos.map(m => m.mes))];
    
    return mesesUnicos.map(mes => {
      const entradas = movimientos.find(m => m.mes === mes && m.tipo === 'entrada');
      const salidas = movimientos.find(m => m.mes === mes && m.tipo === 'salida');
      
      // Formatear mes para display
      const [year, month] = mes.split('-');
      const nombreMes = new Date(year, month - 1).toLocaleDateString('es-CO', { month: 'short' });
      
      return {
        name: `${nombreMes} ${year}`,
        mes: mes,
        entradas: parseFloat(entradas?.total || 0),
        salidas: parseFloat(salidas?.total || 0)
      };
    });
  };

  return MovimientoInventario;
};
