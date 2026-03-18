/**
 * ISTHO CRM - Configuración de Base de Datos
 *
 * Soporta MYSQL_URL (Railway) y variables individuales (local/XAMPP).
 *
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 2.0.0
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Opciones comunes
const logging = process.env.DB_LOGGING === 'true'
  ? (msg) => console.log(`[DB] ${msg}`)
  : false;

const commonOptions = {
  dialect: 'mysql',
  logging,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000
  },
  timezone: '-05:00',
  dialectOptions: {
    ...(process.env.NODE_ENV === 'production' && {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }),
    dateStrings: true,
    typeCast: true
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

// Priorizar MYSQL_URL (Railway), fallback a variables individuales
const sequelize = process.env.MYSQL_URL
  ? new Sequelize(process.env.MYSQL_URL, commonOptions)
  : new Sequelize(
      process.env.DB_NAME || 'istho_crm',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        ...commonOptions,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306
      }
    );

/**
 * Probar conexión a la base de datos
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente.');
    if (process.env.MYSQL_URL) {
      console.log('   📍 Usando MYSQL_URL');
    } else {
      console.log(`   📍 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log(`   📁 Base de datos: ${process.env.DB_NAME}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
