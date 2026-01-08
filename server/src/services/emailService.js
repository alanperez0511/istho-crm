/**
 * ISTHO CRM - Servicio de Email
 * 
 * Servicio principal para envío de correos electrónicos.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const { getTransporter, defaultFrom } = require('../config/email');
const logger = require('../utils/logger');

// Cache de plantillas compiladas
const templateCache = {};

/**
 * Cargar y compilar plantilla
 */
const loadTemplate = (templateName) => {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }
  
  const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
  const basePath = path.join(__dirname, '../templates/email/base.html');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Plantilla no encontrada: ${templateName}`);
  }
  
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const baseContent = fs.readFileSync(basePath, 'utf8');
  
  // Compilar plantilla de contenido
  const contentTemplate = Handlebars.compile(templateContent);
  
  // Compilar plantilla base
  const baseTemplate = Handlebars.compile(baseContent);
  
  templateCache[templateName] = { contentTemplate, baseTemplate };
  
  return templateCache[templateName];
};

/**
 * Renderizar email completo
 */
const renderEmail = (templateName, data) => {
  const { contentTemplate, baseTemplate } = loadTemplate(templateName);
  
  // Renderizar contenido
  const contenido = contentTemplate(data);
  
  // Insertar en plantilla base
  const html = baseTemplate({
    asunto: data.asunto || 'Notificación ISTHO CRM',
    contenido
  });
  
  return html;
};

/**
 * Enviar correo
 */
const enviarCorreo = async ({
  para,
  cc = null,
  cco = null,
  asunto,
  templateName,
  datos,
  adjuntos = []
}) => {
  try {
    const transporter = await getTransporter();
    
    // Renderizar HTML
    const html = renderEmail(templateName, { ...datos, asunto });
    
    // Preparar opciones
    const mailOptions = {
      from: `"${defaultFrom.name}" <${defaultFrom.address}>`,
      to: Array.isArray(para) ? para.join(', ') : para,
      subject: asunto,
      html,
      // Versión texto plano (básica)
      text: `${asunto}\n\nEste correo contiene contenido HTML. Por favor, visualícelo en un cliente compatible.`
    };
    
    if (cc) {
      mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
    }
    
    if (cco) {
      mailOptions.bcc = Array.isArray(cco) ? cco.join(', ') : cco;
    }
    
    // Adjuntos
    if (adjuntos.length > 0) {
      mailOptions.attachments = adjuntos.map(adj => ({
        filename: adj.nombre || path.basename(adj.path),
        path: adj.path,
        contentType: adj.tipo
      }));
    }
    
    // Enviar
    const info = await transporter.sendMail(mailOptions);
    
    logger.info('📧 Correo enviado:', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: asunto
    });
    
    // Si es Ethereal, mostrar URL de previsualización
    if (info.messageId && process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info('📧 Preview URL:', previewUrl);
      }
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
    
  } catch (error) {
    logger.error('❌ Error al enviar correo:', { 
      message: error.message,
      to: para,
      subject: asunto
    });
    
    return {
      success: false,
      error: error.message
    };
  }
};

// =============================================
// FUNCIONES ESPECÍFICAS DE NOTIFICACIÓN
// =============================================

/**
 * Enviar notificación de cierre de operación
 */
const enviarCierreOperacion = async (operacion, correosDestino) => {
  try {
    // Preparar datos para la plantilla
    const datos = {
      tipoOperacion: operacion.tipo === 'ingreso' ? 'INGRESO DE MERCANCÍA' : 'SALIDA DE MERCANCÍA',
      numeroOperacion: operacion.numero_operacion,
      documentoWms: operacion.documento_wms,
      fecha: new Date(operacion.fecha_operacion).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      productos: operacion.detalles || [],
      totalUnidades: operacion.total_unidades,
      totalAverias: operacion.total_averias,
      tieneAverias: operacion.total_averias > 0,
      origen: operacion.origen || 'No especificado',
      destino: operacion.destino || 'No especificado',
      placa: operacion.vehiculo_placa || 'No especificada',
      conductor: operacion.conductor_nombre || 'No especificado',
      conductorCedula: operacion.conductor_cedula || 'No especificada',
      conductorTelefono: operacion.conductor_telefono || 'No especificado',
      observaciones: operacion.observaciones_cierre || operacion.observaciones
    };
    
    // Preparar adjuntos (documentos de cumplido)
    const adjuntos = [];
    if (operacion.documentos && operacion.documentos.length > 0) {
      for (const doc of operacion.documentos) {
        const filePath = path.join(__dirname, '../../', doc.archivo_url);
        if (fs.existsSync(filePath)) {
          adjuntos.push({
            nombre: doc.archivo_nombre,
            path: filePath,
            tipo: doc.archivo_tipo
          });
        }
      }
    }
    
    // Parsear correos
    const correos = correosDestino.split(',').map(c => c.trim()).filter(c => c);
    
    if (correos.length === 0) {
      logger.warn('No hay correos destino para enviar notificación de cierre');
      return { success: false, error: 'Sin destinatarios' };
    }
    
    return await enviarCorreo({
      para: correos,
      asunto: `[ISTHO] ${datos.tipoOperacion} - ${operacion.numero_operacion}`,
      templateName: 'operacion-cierre',
      datos,
      adjuntos
    });
    
  } catch (error) {
    logger.error('Error al enviar cierre de operación:', { message: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Enviar alerta de inventario
 */
const enviarAlertaInventario = async (alertas, correosDestino) => {
  try {
    const correos = Array.isArray(correosDestino) 
      ? correosDestino 
      : correosDestino.split(',').map(c => c.trim());
    
    const datos = {
      stockBajo: alertas.stockBajo || [],
      proximosVencer: alertas.proximosVencer || [],
      vencidos: alertas.vencidos || [],
      urlInventario: `${process.env.APP_URL}/inventario`
    };
    
    // Formatear fechas
    datos.proximosVencer = datos.proximosVencer.map(item => ({
      ...item,
      fecha_vencimiento: new Date(item.fecha_vencimiento).toLocaleDateString('es-CO')
    }));
    
    datos.vencidos = datos.vencidos.map(item => ({
      ...item,
      fecha_vencimiento: new Date(item.fecha_vencimiento).toLocaleDateString('es-CO')
    }));
    
    return await enviarCorreo({
      para: correos,
      asunto: '[ISTHO] ⚠️ Alerta de Inventario',
      templateName: 'alerta-inventario',
      datos
    });
    
  } catch (error) {
    logger.error('Error al enviar alerta de inventario:', { message: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Enviar correo de bienvenida
 */
const enviarBienvenida = async (usuario, passwordTemporal = null) => {
  try {
    const datos = {
      nombre: usuario.nombre_completo,
      username: usuario.username,
      email: usuario.email,
      rol: usuario.rol,
      passwordTemporal,
      urlLogin: `${process.env.APP_URL}/login`
    };
    
    return await enviarCorreo({
      para: usuario.email,
      asunto: '[ISTHO] Bienvenido al CRM',
      templateName: 'bienvenida',
      datos
    });
    
  } catch (error) {
    logger.error('Error al enviar bienvenida:', { message: error.message });
    return { success: false, error: error.message };
  }
};

module.exports = {
  enviarCorreo,
  renderEmail,
  enviarCierreOperacion,
  enviarAlertaInventario,
  enviarBienvenida
};