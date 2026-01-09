/**
 * ISTHO CRM - Servicio de Exportación Excel
 * 
 * Genera archivos Excel con formato profesional.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const ExcelJS = require('exceljs');
const path = require('path');
const logger = require('../utils/logger');

// Colores corporativos ISTHO
const COLORES = {
  primario: '1A237E',      // Azul oscuro
  secundario: '283593',    // Azul medio
  exito: '4CAF50',         // Verde
  advertencia: 'FF9800',   // Naranja
  error: 'F44336',         // Rojo
  gris: 'F5F5F5',          // Gris claro
  blanco: 'FFFFFF',
  negro: '000000'
};

/**
 * Aplicar estilos al encabezado
 */
const estiloEncabezado = {
  font: { bold: true, color: { argb: COLORES.blanco }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.primario } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }
};

/**
 * Aplicar estilos a las celdas de datos
 */
const estiloCelda = {
  border: {
    top: { style: 'thin', color: { argb: 'E0E0E0' } },
    left: { style: 'thin', color: { argb: 'E0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
    right: { style: 'thin', color: { argb: 'E0E0E0' } }
  },
  alignment: { vertical: 'middle' }
};

/**
 * Crear libro de Excel base con configuración
 */
const crearLibro = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ISTHO CRM';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.company = 'ISTHO S.A.S.';
  return workbook;
};

/**
 * Agregar encabezado corporativo a la hoja
 */
const agregarEncabezadoCorporativo = (worksheet, titulo, subtitulo = null) => {
  // Título principal
  worksheet.mergeCells('A1:H1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = `ISTHO S.A.S. - ${titulo}`;
  tituloCell.font = { bold: true, size: 16, color: { argb: COLORES.primario } };
  tituloCell.alignment = { horizontal: 'center' };
  
  // Subtítulo con fecha
  worksheet.mergeCells('A2:H2');
  const subtituloCell = worksheet.getCell('A2');
  subtituloCell.value = subtitulo || `Generado el ${new Date().toLocaleDateString('es-CO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  subtituloCell.font = { size: 10, color: { argb: '666666' } };
  subtituloCell.alignment = { horizontal: 'center' };
  
  // Fila vacía
  worksheet.getRow(3).height = 10;
  
  return 4; // Retorna la fila donde empiezan los datos
};

/**
 * Exportar operaciones a Excel
 */
const exportarOperaciones = async (operaciones, filtros = {}) => {
  try {
    const workbook = crearLibro();
    const worksheet = workbook.addWorksheet('Operaciones', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    // Encabezado corporativo
    let filaInicio = agregarEncabezadoCorporativo(
      worksheet, 
      'REPORTE DE OPERACIONES',
      filtros.periodo ? `Período: ${filtros.periodo}` : null
    );
    
    // Definir columnas
    worksheet.columns = [
      { header: 'N° Operación', key: 'numero_operacion', width: 18 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Doc. WMS', key: 'documento_wms', width: 18 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Fecha', key: 'fecha_operacion', width: 12 },
      { header: 'Estado', key: 'estado', width: 14 },
      { header: 'Referencias', key: 'total_referencias', width: 12 },
      { header: 'Unidades', key: 'total_unidades', width: 12 },
      { header: 'Averías', key: 'total_averias', width: 10 },
      { header: 'Placa', key: 'vehiculo_placa', width: 10 },
      { header: 'Conductor', key: 'conductor_nombre', width: 20 }
    ];
    
    // Aplicar estilos al encabezado (fila 4)
    const headerRow = worksheet.getRow(filaInicio);
    worksheet.columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      Object.assign(cell, estiloEncabezado);
    });
    headerRow.height = 25;
    
    // Agregar datos
    operaciones.forEach((op, index) => {
      const row = worksheet.getRow(filaInicio + 1 + index);
      
      row.getCell(1).value = op.numero_operacion;
      row.getCell(2).value = op.tipo?.toUpperCase();
      row.getCell(3).value = op.documento_wms;
      row.getCell(4).value = op.cliente?.razon_social || 'N/A';
      row.getCell(5).value = op.fecha_operacion ? new Date(op.fecha_operacion) : null;
      row.getCell(6).value = op.estado?.toUpperCase();
      row.getCell(7).value = op.total_referencias || 0;
      row.getCell(8).value = parseFloat(op.total_unidades) || 0;
      row.getCell(9).value = op.total_averias || 0;
      row.getCell(10).value = op.vehiculo_placa || '';
      row.getCell(11).value = op.conductor_nombre || '';
      
      // Estilos de fila
      row.eachCell((cell, colNumber) => {
        Object.assign(cell, estiloCelda);
        
        // Formato de fecha
        if (colNumber === 5 && cell.value) {
          cell.numFmt = 'DD/MM/YYYY';
        }
        
        // Color por estado
        if (colNumber === 6) {
          const estado = cell.value?.toLowerCase();
          if (estado === 'cerrado') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
          } else if (estado === 'anulado') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } };
          } else if (estado === 'en_proceso') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E0' } };
          }
        }
        
        // Color por tipo
        if (colNumber === 2) {
          const tipo = cell.value?.toLowerCase();
          cell.font = { 
            bold: true, 
            color: { argb: tipo === 'ingreso' ? COLORES.exito : COLORES.primario } 
          };
        }
        
        // Resaltar averías
        if (colNumber === 9 && cell.value > 0) {
          cell.font = { bold: true, color: { argb: COLORES.error } };
        }
      });
      
      // Alternar colores de fila
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          if (!cell.fill || cell.fill.fgColor?.argb === COLORES.blanco) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.gris } };
          }
        });
      }
    });
    
    // Agregar totales
    const totalRow = worksheet.getRow(filaInicio + 1 + operaciones.length + 1);
    totalRow.getCell(1).value = 'TOTALES';
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(7).value = operaciones.reduce((sum, op) => sum + (op.total_referencias || 0), 0);
    totalRow.getCell(8).value = operaciones.reduce((sum, op) => sum + (parseFloat(op.total_unidades) || 0), 0);
    totalRow.getCell(9).value = operaciones.reduce((sum, op) => sum + (op.total_averias || 0), 0);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F2FD' } };
    });
    
    // Congelar filas de encabezado
    worksheet.views = [{ state: 'frozen', ySplit: filaInicio }];
    
    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    logger.info('Excel de operaciones generado:', { registros: operaciones.length });
    
    return buffer;
    
  } catch (error) {
    logger.error('Error al generar Excel de operaciones:', { message: error.message });
    throw error;
  }
};

/**
 * Exportar inventario a Excel
 */
const exportarInventario = async (inventario, filtros = {}) => {
  try {
    const workbook = crearLibro();
    const worksheet = workbook.addWorksheet('Inventario', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    let filaInicio = agregarEncabezadoCorporativo(
      worksheet,
      'REPORTE DE INVENTARIO',
      filtros.cliente ? `Cliente: ${filtros.cliente}` : null
    );
    
    worksheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Producto', key: 'producto', width: 35 },
      { header: 'Cliente', key: 'cliente', width: 25 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Reservado', key: 'cantidad_reservada', width: 12 },
      { header: 'Disponible', key: 'cantidad_disponible', width: 12 },
      { header: 'U.M.', key: 'unidad_medida', width: 8 },
      { header: 'Stock Mín.', key: 'stock_minimo', width: 10 },
      { header: 'Ubicación', key: 'ubicacion', width: 12 },
      { header: 'Zona', key: 'zona', width: 12 },
      { header: 'Lote', key: 'lote', width: 12 },
      { header: 'Vencimiento', key: 'fecha_vencimiento', width: 12 },
      { header: 'Costo Unit.', key: 'costo_unitario', width: 12 },
      { header: 'Valor Total', key: 'valor_total', width: 15 },
      { header: 'Estado', key: 'estado', width: 12 }
    ];
    
    // Encabezados
    const headerRow = worksheet.getRow(filaInicio);
    worksheet.columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      Object.assign(cell, estiloEncabezado);
    });
    headerRow.height = 25;
    
    // Datos
    let valorTotal = 0;
    let totalUnidades = 0;
    
    inventario.forEach((item, index) => {
      const row = worksheet.getRow(filaInicio + 1 + index);
      const cantidad = parseFloat(item.cantidad) || 0;
      const reservado = parseFloat(item.cantidad_reservada) || 0;
      const costoUnitario = parseFloat(item.costo_unitario) || 0;
      const valorItem = cantidad * costoUnitario;
      
      valorTotal += valorItem;
      totalUnidades += cantidad;
      
      row.getCell(1).value = item.sku;
      row.getCell(2).value = item.producto;
      row.getCell(3).value = item.cliente?.razon_social || 'N/A';
      row.getCell(4).value = cantidad;
      row.getCell(5).value = reservado;
      row.getCell(6).value = cantidad - reservado;
      row.getCell(7).value = item.unidad_medida || 'UND';
      row.getCell(8).value = parseFloat(item.stock_minimo) || 0;
      row.getCell(9).value = item.ubicacion || '';
      row.getCell(10).value = item.zona || '';
      row.getCell(11).value = item.lote || '';
      row.getCell(12).value = item.fecha_vencimiento ? new Date(item.fecha_vencimiento) : null;
      row.getCell(13).value = costoUnitario;
      row.getCell(14).value = valorItem;
      row.getCell(15).value = item.estado?.toUpperCase();
      
      row.eachCell((cell, colNumber) => {
        Object.assign(cell, estiloCelda);
        
        // Formato moneda
        if (colNumber === 13 || colNumber === 14) {
          cell.numFmt = '"$"#,##0.00';
        }
        
        // Formato fecha
        if (colNumber === 12 && cell.value) {
          cell.numFmt = 'DD/MM/YYYY';
          
          // Resaltar vencidos o próximos a vencer
          const hoy = new Date();
          const vencimiento = new Date(cell.value);
          const diasParaVencer = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
          
          if (diasParaVencer < 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } };
            cell.font = { color: { argb: COLORES.error }, bold: true };
          } else if (diasParaVencer <= 30) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E0' } };
            cell.font = { color: { argb: COLORES.advertencia } };
          }
        }
        
        // Resaltar stock bajo
        if (colNumber === 4) {
          const stockMinimo = parseFloat(item.stock_minimo) || 0;
          if (cantidad <= stockMinimo && stockMinimo > 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } };
            cell.font = { color: { argb: COLORES.error }, bold: true };
          }
        }
      });
      
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          if (!cell.fill) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.gris } };
          }
        });
      }
    });
    
    // Totales
    const totalRow = worksheet.getRow(filaInicio + 1 + inventario.length + 1);
    totalRow.getCell(1).value = 'TOTALES';
    totalRow.getCell(4).value = totalUnidades;
    totalRow.getCell(14).value = valorTotal;
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F2FD' } };
      if (colNumber === 14) {
        cell.numFmt = '"$"#,##0.00';
      }
    });
    
    worksheet.views = [{ state: 'frozen', ySplit: filaInicio }];
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    logger.info('Excel de inventario generado:', { registros: inventario.length });
    
    return buffer;
    
  } catch (error) {
    logger.error('Error al generar Excel de inventario:', { message: error.message });
    throw error;
  }
};

/**
 * Exportar clientes a Excel
 */
const exportarClientes = async (clientes) => {
  try {
    const workbook = crearLibro();
    const worksheet = workbook.addWorksheet('Clientes', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    let filaInicio = agregarEncabezadoCorporativo(worksheet, 'DIRECTORIO DE CLIENTES');
    
    worksheet.columns = [
      { header: 'Código', key: 'codigo_cliente', width: 12 },
      { header: 'Razón Social', key: 'razon_social', width: 35 },
      { header: 'NIT', key: 'nit', width: 15 },
      { header: 'Ciudad', key: 'ciudad', width: 15 },
      { header: 'Departamento', key: 'departamento', width: 15 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Tipo', key: 'tipo_cliente', width: 15 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Contacto Principal', key: 'contacto_principal', width: 25 }
    ];
    
    const headerRow = worksheet.getRow(filaInicio);
    worksheet.columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      Object.assign(cell, estiloEncabezado);
    });
    headerRow.height = 25;
    
    clientes.forEach((cliente, index) => {
      const row = worksheet.getRow(filaInicio + 1 + index);
      
      row.getCell(1).value = cliente.codigo_cliente;
      row.getCell(2).value = cliente.razon_social;
      row.getCell(3).value = cliente.nit;
      row.getCell(4).value = cliente.ciudad || '';
      row.getCell(5).value = cliente.departamento || '';
      row.getCell(6).value = cliente.telefono || cliente.celular || '';
      row.getCell(7).value = cliente.email || '';
      row.getCell(8).value = cliente.tipo_cliente?.toUpperCase() || '';
      row.getCell(9).value = cliente.estado?.toUpperCase() || '';
      row.getCell(10).value = cliente.contactos?.find(c => c.es_principal)?.nombre || 
                             cliente.contactos?.[0]?.nombre || '';
      
      row.eachCell((cell, colNumber) => {
        Object.assign(cell, estiloCelda);
        
        if (colNumber === 9) {
          const estado = cell.value?.toLowerCase();
          if (estado === 'activo') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
          } else if (estado === 'inactivo' || estado === 'suspendido') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } };
          }
        }
      });
      
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          if (!cell.fill) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.gris } };
          }
        });
      }
    });
    
    worksheet.views = [{ state: 'frozen', ySplit: filaInicio }];
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    logger.info('Excel de clientes generado:', { registros: clientes.length });
    
    return buffer;
    
  } catch (error) {
    logger.error('Error al generar Excel de clientes:', { message: error.message });
    throw error;
  }
};

/**
 * Exportar detalle de una operación
 */
const exportarDetalleOperacion = async (operacion) => {
  try {
    const workbook = crearLibro();
    const worksheet = workbook.addWorksheet('Detalle Operación');
    
    // Información de cabecera
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = `ISTHO S.A.S. - DETALLE DE OPERACIÓN`;
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: COLORES.primario } };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Info general
    const infoData = [
      ['N° Operación:', operacion.numero_operacion, 'Documento WMS:', operacion.documento_wms],
      ['Tipo:', operacion.tipo?.toUpperCase(), 'Estado:', operacion.estado?.toUpperCase()],
      ['Cliente:', operacion.cliente?.razon_social, 'Fecha:', operacion.fecha_operacion],
      ['Origen:', operacion.origen || 'N/A', 'Destino:', operacion.destino || 'N/A'],
      ['Placa:', operacion.vehiculo_placa || 'N/A', 'Conductor:', operacion.conductor_nombre || 'N/A'],
    ];
    
    let fila = 3;
    infoData.forEach((row) => {
      worksheet.getCell(`A${fila}`).value = row[0];
      worksheet.getCell(`A${fila}`).font = { bold: true };
      worksheet.getCell(`B${fila}`).value = row[1];
      worksheet.getCell(`D${fila}`).value = row[2];
      worksheet.getCell(`D${fila}`).font = { bold: true };
      worksheet.getCell(`E${fila}`).value = row[3];
      fila++;
    });
    
    // Detalle de productos
    fila += 2;
    worksheet.getCell(`A${fila}`).value = 'DETALLE DE PRODUCTOS';
    worksheet.getCell(`A${fila}`).font = { bold: true, size: 12, color: { argb: COLORES.primario } };
    fila++;
    
    // Encabezados de detalle
    const headers = ['SKU', 'Producto', 'Cantidad', 'U.M.', 'Lote', 'Vencimiento', 'Averías'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(fila, index + 1);
      cell.value = header;
      Object.assign(cell, estiloEncabezado);
    });
    fila++;
    
    // Datos de detalle
    (operacion.detalles || []).forEach((detalle) => {
      worksheet.getCell(fila, 1).value = detalle.sku;
      worksheet.getCell(fila, 2).value = detalle.producto;
      worksheet.getCell(fila, 3).value = parseFloat(detalle.cantidad) || 0;
      worksheet.getCell(fila, 4).value = detalle.unidad_medida || 'UND';
      worksheet.getCell(fila, 5).value = detalle.lote || '';
      worksheet.getCell(fila, 6).value = detalle.fecha_vencimiento || '';
      worksheet.getCell(fila, 7).value = parseFloat(detalle.cantidad_averia) || 0;
      
      if (parseFloat(detalle.cantidad_averia) > 0) {
        worksheet.getCell(fila, 7).font = { bold: true, color: { argb: COLORES.error } };
      }
      
      fila++;
    });
    
    // Ajustar anchos
    worksheet.columns = [
      { width: 15 }, { width: 35 }, { width: 12 }, { width: 8 }, 
      { width: 12 }, { width: 12 }, { width: 10 }
    ];
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    logger.info('Excel de detalle operación generado:', { operacion: operacion.numero_operacion });
    
    return buffer;
    
  } catch (error) {
    logger.error('Error al generar Excel de detalle:', { message: error.message });
    throw error;
  }
};

module.exports = {
  exportarOperaciones,
  exportarInventario,
  exportarClientes,
  exportarDetalleOperacion
};