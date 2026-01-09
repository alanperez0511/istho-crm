/**
 * ISTHO CRM - Entry Point del Servidor
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

require('dotenv').config();
const app = require('./src/app');
const db = require('./src/models');
const logger = require('./src/utils/logger');

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

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor iniciado exitosamente`);
      logger.info(`   📍 Puerto: ${PORT}`);
      logger.info(`   🌍 Ambiente: ${process.env.NODE_ENV}`);
      logger.info(`   📡 API URL: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
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