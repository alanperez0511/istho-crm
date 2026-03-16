/**
 * ISTHO CRM - Entry Point del Servidor
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const db = require('./src/models');
const logger = require('./src/utils/logger');
const socketService = require('./src/services/socketService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Banner
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║      🚛  ISTHO CRM - Backend API Server  🚛              ║');
    console.log('║                                                          ║');
    console.log('║      Transporte, Logística y Almacenamiento              ║');
    console.log('║      Girardota, Antioquia - Colombia                     ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\n');

    // Conectar y sincronizar BD
    logger.info('Conectando a la base de datos...');
    await db.sequelize.authenticate();
    logger.info('✅ Conexión a MySQL establecida correctamente');
    
    // Sincronizar modelos
    logger.info('Sincronizando modelos...');
    await db.syncModels({ alter: process.env.NODE_ENV === 'development' });

    // Crear usuario admin por defecto si no existe
    await crearAdminPorDefecto();
    
    // Crear usuario supervisor por defecto si no existe
    await crearSupervisorPorDefecto();

    // Crear usuario operador por defecto si no existe
    await crearOperadorPorDefecto();

    // Inicializar reportes programados
    const reporteScheduler = require('./src/services/reporteScheduler');
    await reporteScheduler.inicializar();

    // Crear servidor HTTP y adjuntar Socket.IO
    const server = http.createServer(app);
    socketService.inicializar(server);

    // Iniciar servidor
    server.listen(PORT, () => {
      logger.info(`🚀 Servidor iniciado exitosamente`);
      logger.info(`   📍 Puerto: ${PORT}`);
      logger.info(`   🌍 Ambiente: ${process.env.NODE_ENV}`);
      logger.info(`   📡 API URL: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
      logger.info(`   🔌 WebSocket: ws://localhost:${PORT}`);
      logger.info(`   ❤️  Health: http://localhost:${PORT}/health`);
      console.log('\n   Presiona Ctrl+C para detener el servidor\n');
    });

  } catch (error) {
    logger.error('❌ Error fatal al iniciar:', { message: error.message });
    console.error(error);
    process.exit(1);
  }
};

/**
 * Crear usuario administrador por defecto
 */
const crearAdminPorDefecto = async () => {
  try {
    const { Usuario } = db;
    
    // Verificar si ya existe un admin
    const adminExiste = await Usuario.findOne({ where: { rol: 'admin' } });
    
    if (!adminExiste) {
      await Usuario.crearConPassword({
        username: 'admin',
        email: 'admin@istho.com.co',
        password: 'Admin2026*',  // CAMBIAR EN PRODUCCIÓN
        nombre_completo: 'Administrador ISTHO',
        rol: 'admin'
      });
      
      logger.info('✅ Usuario admin creado por defecto');
      logger.warn('⚠️  IMPORTANTE: Cambiar contraseña del admin en producción!');
      console.log('\n   📧 Email: admin@istho.com.co');
      console.log('   🔑 Password: Admin2026*\n');
    }
  } catch (error) {
    logger.error('Error al crear admin por defecto:', { message: error.message });
  }
};

/**
 * Crear usuario supervisor por defecto
 * 
 * @returns {Promise<void>}
 */
const crearSupervisorPorDefecto = async () => {
  try {
    const { Usuario } = db;
    
    // Verificar si ya existe un supervisor
    const supervisorExiste = await Usuario.findOne({ where: { rol: 'supervisor' } });
    
    if (!supervisorExiste) {
      await Usuario.crearConPassword({
        username: 'supervisor',
        email: 'supervisor@istho.com.co',
        password: 'Supervisor2026*',  // CAMBIAR EN PRODUCCIÓN
        nombre_completo: 'Supervisor ISTHO',
        rol: 'supervisor'
      });
      
      logger.info('✅ Usuario supervisor creado por defecto');
      logger.warn('⚠️  IMPORTANTE: Cambiar contraseña del supervisor en producción!');
      console.log('\n   📧 Email: supervisor@istho.com.co');
      console.log('   🔑 Password: Supervisor2026*\n');
    }
  } catch (error) {
    logger.error('Error al crear supervisor por defecto:', { message: error.message });
  }
};

/**
 * Crear usuario operador por defecto
 */
const crearOperadorPorDefecto = async () => {
  try {
    const { Usuario } = db;
    
    // Verificar si ya existe un operador
    const operadorExiste = await Usuario.findOne({ where: { rol: 'operador' } });
    
    if (!operadorExiste) {
      await Usuario.crearConPassword({
        username: 'operador',
        email: 'operador@istho.com.co',
        password: 'Operador2026*',  // CAMBIAR EN PRODUCCIÓN
        nombre_completo: 'Operador ISTHO',
        rol: 'operador'
      });
      
      logger.info('✅ Usuario operador creado por defecto');
      logger.warn('⚠️  IMPORTANTE: Cambiar contraseña del operador en producción!');
      console.log('\n   📧 Email: operador@istho.com.co');
      console.log('   🔑 Password: Operador2026*\n');
    }
  } catch (error) {
    logger.error('Error al crear operador por defecto:', { message: error.message });
  }
};

// Manejo de señales
process.on('SIGTERM', async () => {
  logger.info('🛑 Cerrando servidor (SIGTERM)...');
  await db.sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 Cerrando servidor (Ctrl+C)...');
  await db.sequelize.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', { reason: reason?.message || reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { message: error.message });
  process.exit(1);
});

// Iniciar
startServer();