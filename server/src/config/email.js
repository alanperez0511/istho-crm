/**
 * ISTHO CRM - Configuración de Email
 * 
 * Configuración de Nodemailer para envío de correos.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Configuración del transportador SMTP
 */
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Opciones adicionales
  pool: true, // Usar pool de conexiones
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5 // 5 correos por segundo máximo
};

/**
 * Remitente por defecto
 */
const defaultFrom = {
  name: process.env.EMAIL_FROM_NAME || 'ISTHO CRM',
  address: process.env.EMAIL_FROM_ADDRESS || 'notificaciones@istho.com.co'
};

/**
 * Crear transportador
 */
let transporter = null;

const createTransporter = async () => {
  try {
    // Si no hay configuración SMTP, crear cuenta de prueba en Ethereal
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('⚠️ No hay configuración SMTP. Creando cuenta de prueba Ethereal...');
      
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      logger.info('📧 Cuenta de prueba Ethereal creada:', {
        user: testAccount.user,
        webUrl: 'https://ethereal.email'
      });
      
      return transporter;
    }
    
    // Usar configuración de .env
    transporter = nodemailer.createTransport(emailConfig);
    
    // Verificar conexión
    await transporter.verify();
    logger.info('✅ Conexión SMTP verificada exitosamente');
    
    return transporter;
    
  } catch (error) {
    logger.error('❌ Error al configurar email:', { message: error.message });
    throw error;
  }
};

/**
 * Obtener transportador (singleton)
 */
const getTransporter = async () => {
  if (!transporter) {
    await createTransporter();
  }
  return transporter;
};

module.exports = {
  emailConfig,
  defaultFrom,
  getTransporter,
  createTransporter
};