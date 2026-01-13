/**
 * ISTHO CRM - Modelo OperacionDetalle
 * 
 * Detalle de productos de cada operación.
 * 
 * MODIFICACIÓN v1.1.0:
 * - Agregado campo inventario_id para vincular con stock
 * - Permite rastrear reservas y movimientos de inventario
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.1.0
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OperacionDetalle = sequelize.define('OperacionDetalle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    operacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'operaciones',
        key: 'id'
      }
    },
    
    // ✅ AGREGADO: Referencia al inventario
    inventario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'inventario',
        key: 'id'
      },
      comment: 'Referencia al registro de inventario (para gestión de stock)'
    },
    
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    producto: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    
    cantidad: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false
    },
    
    unidad_medida: {
      type: DataTypes.STRING(20),
      defaultValue: 'UND'
    },
    
    lote: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    
    // Averías
    cantidad_averia: {
      type: DataTypes.DECIMAL(15, 3),
      defaultValue: 0,
      comment: 'Cantidad de unidades con avería'
    },
    
    cantidad_buena: {
      type: DataTypes.VIRTUAL,
      get() {
        const cantidad = parseFloat(this.getDataValue('cantidad')) || 0;
        const averia = parseFloat(this.getDataValue('cantidad_averia')) || 0;
        return cantidad - averia;
      }
    },
    
    tipo_averia: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Tipo de avería: golpeado, mojado, vencido, etc.'
    },
    
    observaciones_averia: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'operacion_detalle',
    timestamps: true,
    underscored: true,
    
    indexes: [
      { fields: ['operacion_id'] },
      { fields: ['sku'] },
      { fields: ['inventario_id'] }  // ✅ Índice para búsquedas
    ]
  });

  /**
   * Tiene avería
   */
  OperacionDetalle.prototype.tieneAveria = function() {
    return parseFloat(this.cantidad_averia) > 0;
  };

  return OperacionDetalle;
};