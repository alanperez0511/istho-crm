/**
 * ============================================================================
 * ISTHO CRM - Configuración de Email (Dual Provider)
 * ============================================================================
 *
 * Soporta dos proveedores:
 * - Resend (producción): API HTTP, no necesita SMTP ni puertos abiertos
 * - Nodemailer SMTP (desarrollo/fallback): Gmail u otro SMTP
 *
 * Si RESEND_API_KEY existe → usa Resend via HTTP
 * Si no → usa Nodemailer SMTP como antes
 *
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 3.0.0
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════════════

const defaultFrom = {
  name: process.env.SMTP_FROM_NAME || 'ISTHO CRM',
  address: process.env.RESEND_FROM || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@istho.com'
};

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : undefined
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000
};

// ════════════════════════════════════════════════════════════════════════════
// RESEND WRAPPER (imita interfaz nodemailer para compatibilidad)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Crea un wrapper de Resend que expone sendMail/verify/close
 * como nodemailer para que emailService.js no se modifique
 */
const createResendTransporter = () => {
  let Resend;
  try {
    Resend = require('resend').Resend;
  } catch {
    logger.error('❌ Paquete "resend" no instalado. Ejecuta: npm install resend');
    throw new Error('Paquete resend no instalado');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM || defaultFrom.address;

  logger.info('📧 Usando Resend como proveedor de email', { from });

  return {
    sendMail: async (mailOptions) => {
      const { to, subject, html, text, attachments } = mailOptions;

      const toAddresses = Array.isArray(to) ? to : [to];

      const payload = {
        from: mailOptions.from
          ? (typeof mailOptions.from === 'string' ? mailOptions.from : `${mailOptions.from.name} <${mailOptions.from.address}>`)
          : `${defaultFrom.name} <${from}>`,
        to: toAddresses,
        subject,
        html: html || undefined,
        text: text || undefined
      };

      // Resend soporta attachments con { filename, content }
      if (attachments && attachments.length > 0) {
        payload.attachments = attachments.map(att => ({
          filename: att.filename,
          content: att.content
        }));
      }

      const { data, error } = await resend.emails.send(payload);

      if (error) {
        logger.error('❌ Error enviando email con Resend:', error);
        throw new Error(error.message || 'Error enviando email con Resend');
      }

      logger.info('✅ Email enviado con Resend', { id: data?.id, to: toAddresses });
      return { messageId: data?.id, accepted: toAddresses };
    },

    verify: async () => {
      // Resend no tiene verify, simplemente validamos que la API key existe
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY no configurada');
      }
      logger.info('✅ Resend API key configurada');
      return true;
    },

    close: () => {
      // No-op para Resend
    }
  };
};

// ════════════════════════════════════════════════════════════════════════════
// NODEMAILER TRANSPORTER
// ════════════════════════════════════════════════════════════════════════════

let transporter = null;
let transporterVerified = false;

const createProductionTransporter = () => {
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    logger.error('❌ Configuración SMTP incompleta', {
      hasUser: !!smtpConfig.auth.user,
      hasPass: !!smtpConfig.auth.pass,
      host: smtpConfig.host
    });
    throw new Error('Configuración SMTP incompleta. Verifica SMTP_USER y SMTP_PASS en .env');
  }

  logger.info('📧 Creando transporter SMTP', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    user: smtpConfig.auth.user,
    secure: smtpConfig.secure
  });

  return nodemailer.createTransport(smtpConfig);
};

const createDevTransporter = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    logger.info('📧 Cuenta Ethereal creada para desarrollo', {
      user: testAccount.user
    });

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (error) {
    logger.warn('⚠️ No se pudo crear cuenta Ethereal, usando configuración SMTP', error.message);
    return createProductionTransporter();
  }
};

// ════════════════════════════════════════════════════════════════════════════
// TRANSPORTER FACTORY
// ════════════════════════════════════════════════════════════════════════════

const getTransporter = async () => {
  if (transporter && transporterVerified) {
    return transporter;
  }

  try {
    // Prioridad: Resend → SMTP → Ethereal
    if (process.env.RESEND_API_KEY) {
      transporter = createResendTransporter();
    } else {
      const useEthereal = process.env.NODE_ENV === 'development' &&
                          process.env.USE_ETHEREAL === 'true' &&
                          !process.env.SMTP_PASS;

      if (useEthereal) {
        transporter = await createDevTransporter();
      } else {
        transporter = createProductionTransporter();
      }
    }

    await transporter.verify();
    transporterVerified = true;
    logger.info('✅ Conexión de email verificada exitosamente');

    return transporter;

  } catch (error) {
    logger.error('❌ Error al configurar transporter de email:', {
      message: error.message,
      code: error.code
    });

    if (error.message.includes('Invalid login') || error.message.includes('authentication')) {
      logger.error('💡 SOLUCIÓN: Usa una Contraseña de Aplicación de Google:');
      logger.error('   1. Ve a https://myaccount.google.com/apppasswords');
      logger.error('   2. Genera una nueva contraseña');
      logger.error('   3. Copia los 16 caracteres a SMTP_PASS en .env');
    }

    throw error;
  }
};

const verificarConexion = async () => {
  try {
    const transport = await getTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    logger.error('❌ Error verificando conexión de email:', error.message);
    return false;
  }
};

const resetTransporter = () => {
  if (transporter && transporter.close) {
    transporter.close();
  }
  transporter = null;
  transporterVerified = false;
  logger.info('🔄 Transporter de email reseteado');
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════

module.exports = {
  getTransporter,
  verificarConexion,
  resetTransporter,
  defaultFrom,
  smtpConfig
};
