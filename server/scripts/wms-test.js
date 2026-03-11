/**
 * ISTHO CRM - Script de Simulación WMS: Día Típico de Operación
 *
 * Simula un día completo de operación logística con el WMS Copérnico:
 *
 *  JORNADA MAÑANA (7:00 - 12:00)
 *   1. Health check del API
 *   2. Sincronización de catálogo (5 productos de 2 clientes diferentes)
 *   3. Recepción #1: Remisión grande - 4 SKUs, 6 cajas, múltiples lotes
 *   4. Recepción #2: Devolución de cliente - 1 caja devuelta
 *
 *  JORNADA TARDE (13:00 - 17:00)
 *   5. Picking #1: Despacho a sucursal - 2 SKUs, 3 cajas
 *   6. Picking #2: Pedido urgente - 1 caja específica
 *
 *  VALIDACIONES
 *   7. Verificar auditoría de entrada (numero_caja mapeado)
 *   8. Re-envío duplicado (debe rechazarlo)
 *   9. Errores esperados (NIT inválido, sin detalles, etc.)
 *
 * Ejecutar: node scripts/wms-test.js
 *
 * Opciones:
 *   --solo-catalogo    Solo ejecuta sincronización de catálogo
 *   --solo-entradas    Solo ejecuta catálogo + entradas
 *   --solo-salidas     Solo ejecuta catálogo + entradas + salidas
 *   --con-errores      Incluye pruebas de errores esperados
 *   --completo         Ejecuta todo (default)
 *
 * @author Coordinación TI - ISTHO S.A.S.
 */

require('dotenv').config();

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const API_URL = process.env.CRM_API_URL || 'http://localhost:5000/api/v1';
const API_KEY = process.env.WMS_API_KEY || 'istho-wms-dev-key-2026';
const NIT_CLIENTE_1 = process.env.TEST_NIT || '800245795-0';
const NIT_CLIENTE_2 = process.env.TEST_NIT_2 || '900797309-5';

// Token JWT para verificar auditorías (se obtiene con login)
const JWT_USER = process.env.TEST_USER || 'admin@istho.com.co';
const JWT_PASS = process.env.TEST_PASS || 'Admin2026*';

const args = process.argv.slice(2);
const MODO = args.find(a => a.startsWith('--'))?.replace('--', '') || 'completo';

// ============================================================================
// HELPERS
// ============================================================================

let totalTests = 0;
let passed = 0;
let failed = 0;
let warnings = 0;

const log = {
  title: (msg) => console.log(`\n${'═'.repeat(64)}\n  ${msg}\n${'═'.repeat(64)}`),
  section: (msg) => console.log(`\n${'─'.repeat(48)}\n  ${msg}\n${'─'.repeat(48)}`),
  ok: (msg) => { passed++; totalTests++; console.log(`  ✅ ${msg}`); },
  fail: (msg) => { failed++; totalTests++; console.log(`  ❌ ${msg}`); },
  warn: (msg) => { warnings++; console.log(`  ⚠️  ${msg}`); },
  info: (msg) => console.log(`  💡 ${msg}`),
  detail: (msg) => console.log(`     ${msg}`),
  json: (label, obj) => console.log(`     ${label}: ${JSON.stringify(obj, null, 2).split('\n').join('\n     ')}`),
};

/**
 * Llamada HTTP al API WMS (usa X-WMS-API-Key)
 */
const wmsCall = async (method, endpoint, body = null) => {
  const url = `${API_URL}/wms/sync${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-WMS-API-Key': API_KEY,
      },
      body: body ? JSON.stringify(body) : null,
    });

    const contentType = res.headers.get('content-type');
    const data = contentType?.includes('application/json')
      ? await res.json()
      : { message: await res.text() };

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
};

/**
 * Llamada HTTP al API CRM (usa JWT Bearer token)
 */
let jwtToken = null;
const crmCall = async (method, endpoint, body = null) => {
  const url = `${API_URL}${endpoint}`;
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (jwtToken) headers['Authorization'] = `Bearer ${jwtToken}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
};

/**
 * Aserción simple
 */
const assert = (condition, passMsg, failMsg) => {
  if (condition) {
    log.ok(passMsg);
  } else {
    log.fail(failMsg || `FALLÓ: ${passMsg}`);
  }
};

// ============================================================================
// GENERADORES DE DATOS REALISTAS
// ============================================================================

const uid = () => Date.now().toString().slice(-6);
const todayLote = `L-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`;

// Catálogo de productos reales
const CATALOGO = {
  cliente1: [
    { codigo: '9400605', descripcion: 'BALDE CON TAPA DULCE DE LECHE 5KG', unidad_medida: 'UND' },
    { codigo: '9400320', descripcion: 'BOLSA LECHE CONDENSADA 1KG X12', unidad_medida: 'PAQ' },
    { codigo: '9400118', descripcion: 'CREMA DE LECHE UHT 200ML X24', unidad_medida: 'CJA' },
    { codigo: '9400750', descripcion: 'QUESO DOBLE CREMA BLOQUE 2.5KG', unidad_medida: 'UND' },
    { codigo: '9400890', descripcion: 'YOGURT FRESA BOLSA 150G X30', unidad_medida: 'CJA' },
  ],
  cliente2: [
    { codigo: '656355', descripcion: 'PLACA ST 12.7 1220 2440 BR (86)', unidad_medida: 'UND' },
    { codigo: '656360', descripcion: 'PLACA RH 12.7 1220 2440 BR (50)', unidad_medida: 'UND' },
    { codigo: '740120', descripcion: 'PERFIL OMEGA CAL 26 X 3M', unidad_medida: 'UND' },
  ],
};

// ============================================================================
// PASO 1: HEALTH CHECK
// ============================================================================

async function paso1_healthCheck() {
  log.section('1. HEALTH CHECK - Verificar conectividad API');

  const res = await wmsCall('GET', '/status');

  if (res.ok) {
    log.ok(`API WMS activa - v${res.data?.data?.version || res.data?.version || '?'}`);
  } else if (res.error) {
    log.fail(`No se pudo conectar al servidor: ${res.error}`);
    log.info(`¿Está corriendo el servidor en ${API_URL}?`);
    return false;
  } else {
    log.fail(`Status endpoint respondió ${res.status}`);
    return false;
  }

  // Verificar API key inválida
  const badKey = await fetch(`${API_URL}/wms/sync/status`, {
    headers: { 'X-WMS-API-Key': 'clave-invalida' },
  }).then(r => r.status).catch(() => 0);

  assert(badKey === 403, 'API Key inválida rechazada correctamente (403)', 'API Key inválida NO fue rechazada');

  return true;
}

// ============================================================================
// PASO 2: SINCRONIZACIÓN DE CATÁLOGO
// ============================================================================

async function paso2_catalogo() {
  log.section('2. SINCRONIZACIÓN DE CATÁLOGO');

  // Cliente 1: 5 productos lácteos
  log.info(`Sincronizando ${CATALOGO.cliente1.length} productos para Cliente 1 (NIT: ${NIT_CLIENTE_1})`);
  const r1 = await wmsCall('POST', '/productos', {
    nit: NIT_CLIENTE_1,
    productos: CATALOGO.cliente1,
  });

  if (r1.ok) {
    const d = r1.data?.data || r1.data;
    log.ok(`Cliente 1: ${d.creados} creados, ${d.actualizados} actualizados`);
    assert(d.errores?.length === 0, 'Sin errores en sincronización', `Hubo ${d.errores?.length} errores`);
  } else {
    log.fail(`Error sincronizando Cliente 1: ${r1.data?.message || r1.error}`);
  }

  // Cliente 2: 3 productos de construcción
  log.info(`Sincronizando ${CATALOGO.cliente2.length} productos para Cliente 2 (NIT: ${NIT_CLIENTE_2})`);
  const r2 = await wmsCall('POST', '/productos', {
    nit: NIT_CLIENTE_2,
    productos: CATALOGO.cliente2,
  });

  if (r2.ok) {
    const d = r2.data?.data || r2.data;
    log.ok(`Cliente 2: ${d.creados} creados, ${d.actualizados} actualizados`);
  } else {
    log.warn(`Cliente 2 falló (puede que el NIT no exista): ${r2.data?.message || r2.error}`);
  }

  // Re-sync: Actualizar descripción de un producto existente
  log.info('Re-sync: Actualizando descripción de producto existente...');
  const r3 = await wmsCall('POST', '/productos', {
    nit: NIT_CLIENTE_1,
    productos: [
      { codigo: '9400605', descripcion: 'BALDE C/TAPA DULCE DE LECHE LATTI 5KG', unidad_medida: 'UND' },
    ],
  });

  if (r3.ok) {
    const d = r3.data?.data || r3.data;
    assert(d.actualizados >= 1, 'Producto existente actualizado correctamente', 'No se actualizó el producto');
  }
}

// ============================================================================
// PASO 3: RECEPCIÓN #1 - Remisión grande
// ============================================================================

let entradaGrande_opId = null;
const CAJAS_ENTRADA_1 = {
  caja1: `CJ-${uid()}1`,
  caja2: `CJ-${uid()}2`,
  caja3: `CJ-${uid()}3`,
  caja4: `CJ-${uid()}4`,
  caja5: `CJ-${uid()}5`,
  caja6: `CJ-${uid()}6`,
};
const DOC_ENTRADA_1 = `REM-${uid()}`;

async function paso3_entradaGrande() {
  log.section('3. RECEPCIÓN #1 - Remisión grande (4 SKUs, 6 cajas)');

  const entradaData = {
    nit: NIT_CLIENTE_1,
    documento_origen: DOC_ENTRADA_1,
    fecha_ingreso: new Date().toISOString(),
    tipo_documento: 'Remisión',
    observaciones: 'Despacho planta Funza - Ruta AM01',
    detalles: [
      // SKU 1: Balde dulce de leche - 2 cajas
      {
        producto: '9400605',
        descripcion: 'BALDE CON TAPA DULCE DE LECHE 5KG',
        cantidad: 120,
        caja: CAJAS_ENTRADA_1.caja1,
        lote: `${todayLote}-A`,
        ubicacion: 'A1-E3-N2',
        peso: 108.5,
        unidad_medida: 'UND',
      },
      {
        producto: '9400605',
        descripcion: '9400605', // WMS a veces envía SKU como descripción
        cantidad: 80,
        caja: CAJAS_ENTRADA_1.caja2,
        lote: `${todayLote}-A`,
        ubicacion: 'A1-E3-N3',
        peso: 72.0,
        unidad_medida: 'UND',
      },
      // SKU 2: Leche condensada - 1 caja
      {
        producto: '9400320',
        // Sin descripción: el CRM debe buscarla en el maestro
        cantidad: 48,
        caja: CAJAS_ENTRADA_1.caja3,
        lote: `${todayLote}-B`,
        lote_externo: '15/03/2026',
        ubicacion: 'A2-E1-N1',
        peso: 57.6,
        unidad_medida: 'PAQ',
        fecha_vencimiento: '2027-03-15',
      },
      // SKU 3: Crema de leche - 2 cajas
      {
        producto: '9400118',
        cantidad: 36,
        caja: CAJAS_ENTRADA_1.caja4,
        lote: `${todayLote}-C`,
        ubicacion: 'B1-E2-N1',
        peso: 43.2,
        unidad_medida: 'CJA',
        fecha_vencimiento: '2026-09-20',
      },
      {
        producto: '9400118',
        cantidad: 24,
        caja: CAJAS_ENTRADA_1.caja5,
        lote: `${todayLote}-C`,
        ubicacion: 'B1-E2-N2',
        peso: 28.8,
        unidad_medida: 'CJA',
        fecha_vencimiento: '2026-09-20',
      },
      // SKU 4: Queso doble crema - 1 caja sin número (auto-genera CJ-XXXXXX)
      {
        producto: '9400750',
        cantidad: 40,
        lote: `${todayLote}-D`,
        ubicacion: 'C1-E1-N1',
        peso: 100.0,
        unidad_medida: 'UND',
        // Sin campo caja → el CRM debe auto-generar CJ-XXXXXX
      },
    ],
  };

  log.info(`Documento: ${DOC_ENTRADA_1}`);
  log.info(`Detalles: ${entradaData.detalles.length} líneas, ${entradaData.detalles.reduce((s, d) => s + d.cantidad, 0)} unidades totales`);

  const res = await wmsCall('POST', '/entradas', entradaData);

  if (res.ok) {
    const d = res.data?.data || res.data;
    entradaGrande_opId = d.operacion_id;

    log.ok(`Entrada creada: ${d.numero_operacion} (ID: ${d.operacion_id})`);
    assert(d.total_lineas === 6, `Total líneas: ${d.total_lineas} (esperado: 6)`, `Total líneas incorrecto: ${d.total_lineas}`);
    assert(d.total_unidades === 348, `Total unidades: ${d.total_unidades} (esperado: 348)`, `Total unidades incorrecto: ${d.total_unidades}`);
    assert(d.estado === 'pendiente', `Estado: ${d.estado}`, `Estado incorrecto: ${d.estado}`);

    log.info('Verificaciones esperadas en CRM:');
    log.detail(`• 6 CajaInventario creadas (5 con número, 1 auto-generada)`);
    log.detail(`• SKU 9400605 → stock +200 (120+80)`);
    log.detail(`• SKU 9400320 → stock +48`);
    log.detail(`• SKU 9400118 → stock +60 (36+24)`);
    log.detail(`• SKU 9400750 → stock +40`);
    log.detail(`• Descripción de caja2 (9400605) corregida del maestro, no el SKU`);
  } else {
    log.fail(`Error creando entrada: ${res.data?.message || res.error}`);
    return false;
  }
  return true;
}

// ============================================================================
// PASO 4: RECEPCIÓN #2 - Devolución de cliente
// ============================================================================

const DOC_ENTRADA_2 = `DEV-${uid()}`;
const CAJA_DEVOLUCION = `CJ-DEV-${uid()}`;

async function paso4_devolucion() {
  log.section('4. RECEPCIÓN #2 - Devolución de cliente (1 caja)');

  const devolucionData = {
    nit: NIT_CLIENTE_1,
    documento_origen: DOC_ENTRADA_2,
    fecha_ingreso: new Date().toISOString(),
    tipo_documento: 'Devolución',
    observaciones: 'Devolución por producto cercano a vencimiento - Tienda Chapinero',
    detalles: [
      {
        producto: '9400890',
        descripcion: 'YOGURT FRESA BOLSA 150G X30',
        cantidad: 15,
        caja: CAJA_DEVOLUCION,
        lote: 'L-240115-Y',
        ubicacion: 'DEV-01',
        peso: 9.0,
        unidad_medida: 'CJA',
        fecha_vencimiento: '2026-04-01',
        documento_asociado: 'NC-10234',
      },
    ],
  };

  log.info(`Documento: ${DOC_ENTRADA_2} (Devolución)`);

  const res = await wmsCall('POST', '/entradas', devolucionData);

  if (res.ok) {
    const d = res.data?.data || res.data;
    log.ok(`Devolución registrada: ${d.numero_operacion}`);
    assert(d.total_unidades === 15, `Unidades: ${d.total_unidades}`, `Unidades incorrectas: ${d.total_unidades}`);
  } else {
    log.fail(`Error en devolución: ${res.data?.message || res.error}`);
  }
}

// ============================================================================
// PASO 5: PICKING #1 - Despacho a sucursal
// ============================================================================

const PICKING_1 = `PICK-${uid()}`;
const DOC_SALIDA_1 = `FAC-${uid()}`;

async function paso5_despachoSucursal() {
  log.section('5. PICKING #1 - Despacho a sucursal (2 SKUs, 3 cajas)');

  const salidaData = {
    nit: NIT_CLIENTE_1,
    numero_picking: PICKING_1,
    documento_wms: DOC_SALIDA_1,
    sucursal_entrega: 'ÉXITO COUNTRY (C/C COUNTRY PLAZA)',
    ciudad_destino: 'BOGOTÁ',
    observaciones: 'Despacho rutero D-14 / Turno mañana',
    detalles: [
      // Despachar 1 caja de dulce de leche (la caja1)
      {
        producto: '9400605',
        cantidad: 120,
        caja: CAJAS_ENTRADA_1.caja1,
        lote_interno: `${todayLote}-A`,
        pedido: 'PED-45021',
        unidad_medida: 'UND',
      },
      // Despachar 1 caja de leche condensada
      {
        producto: '9400320',
        cantidad: 48,
        caja: CAJAS_ENTRADA_1.caja3,
        lote_interno: `${todayLote}-B`,
        lote_externo: '15/03/2026',
        pedido: 'PED-45021',
        unidad_medida: 'PAQ',
      },
      // Despachar 1 caja de crema de leche (la caja4)
      {
        producto: '9400118',
        cantidad: 36,
        caja: CAJAS_ENTRADA_1.caja4,
        lote_interno: `${todayLote}-C`,
        pedido: 'PED-45022',
        unidad_medida: 'CJA',
      },
    ],
  };

  log.info(`Picking: ${PICKING_1} → ${salidaData.sucursal_entrega}`);
  log.info(`${salidaData.detalles.length} líneas, ${salidaData.detalles.reduce((s, d) => s + d.cantidad, 0)} unidades`);

  const res = await wmsCall('POST', '/salidas', salidaData);

  if (res.ok) {
    const d = res.data?.data || res.data;
    log.ok(`Despacho creado: ${d.numero_operacion} (Picking: ${d.numero_picking})`);
    assert(d.total_lineas === 3, `Líneas: ${d.total_lineas}`, `Líneas incorrectas: ${d.total_lineas}`);
    assert(d.total_unidades === 204, `Unidades despachadas: ${d.total_unidades}`, `Unidades incorrectas: ${d.total_unidades}`);

    log.info('Stock esperado después del despacho:');
    log.detail(`• 9400605 (Dulce de leche): 200 - 120 = 80 UND | Caja ${CAJAS_ENTRADA_1.caja1} → despachada`);
    log.detail(`• 9400320 (Leche condensada): 48 - 48 = 0 PAQ | Caja ${CAJAS_ENTRADA_1.caja3} → despachada`);
    log.detail(`• 9400118 (Crema de leche): 60 - 36 = 24 CJA | Caja ${CAJAS_ENTRADA_1.caja4} → despachada, caja5 sigue disponible`);
    log.detail(`• 9400750 (Queso): 40 UND sin cambios`);
  } else {
    log.fail(`Error en despacho: ${res.data?.message || res.error}`);
  }
}

// ============================================================================
// PASO 6: PICKING #2 - Pedido urgente
// ============================================================================

const PICKING_2 = `PICK-${uid()}U`;
const DOC_SALIDA_2 = `FAC-${uid()}U`;

async function paso6_pedidoUrgente() {
  log.section('6. PICKING #2 - Pedido urgente (1 caja específica)');

  const salidaData = {
    nit: NIT_CLIENTE_1,
    numero_picking: PICKING_2,
    documento_wms: DOC_SALIDA_2,
    sucursal_entrega: 'JUMBO CALLE 80',
    ciudad_destino: 'BOGOTÁ',
    observaciones: 'URGENTE - Solicitud directa del cliente',
    detalles: [
      {
        producto: '9400605',
        cantidad: 80,
        caja: CAJAS_ENTRADA_1.caja2, // La segunda caja de dulce de leche
        lote_interno: `${todayLote}-A`,
        pedido: 'PED-URGENTE-001',
        unidad_medida: 'UND',
      },
    ],
  };

  log.info(`Picking URGENTE: ${PICKING_2} → ${salidaData.sucursal_entrega}`);

  const res = await wmsCall('POST', '/salidas', salidaData);

  if (res.ok) {
    const d = res.data?.data || res.data;
    log.ok(`Pedido urgente despachado: ${d.numero_operacion}`);

    log.info('Stock final esperado SKU 9400605:');
    log.detail(`• Ingreso: +200 (120+80)`);
    log.detail(`• Picking #1: -120`);
    log.detail(`• Picking #2: -80`);
    log.detail(`• Saldo: 0 UND | Ambas cajas DESPACHADAS`);
  } else {
    log.fail(`Error en pedido urgente: ${res.data?.message || res.error}`);
  }
}

// ============================================================================
// PASO 7: VERIFICAR AUDITORÍA (numero_caja en respuesta)
// ============================================================================

async function paso7_verificarAuditoria() {
  log.section('7. VERIFICAR AUDITORÍA - Validar numero_caja en respuesta API');

  if (!entradaGrande_opId) {
    log.warn('No se puede verificar auditoría: la entrada grande no se creó');
    return;
  }

  // Paso 7a: Login para obtener JWT
  log.info('Autenticando para acceder al API de auditorías...');
  const loginRes = await crmCall('POST', '/auth/login', {
    email: JWT_USER,
    password: JWT_PASS,
  });

  if (!loginRes.ok || !loginRes.data?.data?.token) {
    log.warn(`No se pudo autenticar (${loginRes.status}). Saltando verificación de auditoría.`);
    log.detail(`Verifique las credenciales: ${JWT_USER}`);
    return;
  }

  jwtToken = loginRes.data.data.token;
  log.ok('Autenticación exitosa');

  // Paso 7b: Obtener detalle de la entrada
  log.info(`Consultando auditoría de entrada ID: ${entradaGrande_opId}...`);
  const audRes = await crmCall('GET', `/auditorias/entradas/${entradaGrande_opId}`);

  if (!audRes.ok) {
    log.fail(`Error al consultar auditoría: ${audRes.data?.message || audRes.status}`);
    return;
  }

  const audData = audRes.data?.data;

  if (!audData?.lineas || audData.lineas.length === 0) {
    log.fail('La auditoría no tiene líneas');
    return;
  }

  log.ok(`Auditoría obtenida: ${audData.documento} - ${audData.lineas.length} líneas`);

  // Verificar que cada línea tiene el campo "caja"
  let lineasConCaja = 0;
  let lineasSinCaja = 0;

  console.log('');
  console.log('     ┌────┬──────────┬──────────────────────────────────────┬──────┬──────────────┐');
  console.log('     │ #  │ SKU      │ Producto                             │ Cant │ Caja         │');
  console.log('     ├────┼──────────┼──────────────────────────────────────┼──────┼──────────────┤');

  audData.lineas.forEach((linea, idx) => {
    const num = String(idx + 1).padStart(2);
    const sku = (linea.sku || '').padEnd(8);
    const prod = (linea.producto || '').substring(0, 36).padEnd(36);
    const cant = String(linea.cantidad_esperada || '').padStart(4);
    const caja = (linea.caja || '(vacío)').padEnd(12);

    console.log(`     │ ${num} │ ${sku} │ ${prod} │ ${cant} │ ${caja} │`);

    if (linea.caja && linea.caja !== '') {
      lineasConCaja++;
    } else {
      lineasSinCaja++;
    }
  });

  console.log('     └────┴──────────┴──────────────────────────────────────┴──────┴──────────────┘');
  console.log('');

  // Esperamos 5 con caja (las que enviamos con número) y 1 auto-generada
  assert(
    lineasConCaja >= 5,
    `${lineasConCaja} de ${audData.lineas.length} líneas tienen numero_caja mapeado`,
    `Solo ${lineasConCaja} de ${audData.lineas.length} líneas tienen caja. ¿Se ejecutó 'alter: true'? Reiniciar servidor.`
  );

  if (lineasSinCaja > 0 && lineasConCaja === 0) {
    log.fail('NINGUNA línea tiene numero_caja. La columna posiblemente no existe en la BD.');
    log.info('Ejecute: node scripts/fix-db-schema.js  o reinicie el servidor en modo desarrollo');
  }

  // Verificar que la descripción fue corregida del maestro (caja2 enviaba SKU como descripción)
  const lineaCaja2 = audData.lineas.find(l => l.caja === CAJAS_ENTRADA_1.caja2);
  if (lineaCaja2) {
    assert(
      lineaCaja2.producto !== '9400605',
      `Descripción corregida del maestro: "${lineaCaja2.producto}"`,
      `Descripción NO corregida, sigue siendo el SKU: "${lineaCaja2.producto}"`
    );
  }
}

// ============================================================================
// PASO 8: PRUEBA DE DUPLICADOS
// ============================================================================

async function paso8_duplicados() {
  log.section('8. PRUEBA DE DUPLICADOS - Re-envío debe ser rechazado');

  // Re-enviar la misma entrada
  log.info(`Re-enviando documento: ${DOC_ENTRADA_1}...`);
  const res = await wmsCall('POST', '/entradas', {
    nit: NIT_CLIENTE_1,
    documento_origen: DOC_ENTRADA_1,
    fecha_ingreso: new Date().toISOString(),
    tipo_documento: 'Remisión',
    detalles: [{ producto: '9400605', cantidad: 10, caja: 'TEST-DUP' }],
  });

  assert(
    !res.ok && res.status === 400,
    `Entrada duplicada rechazada (${res.status}): ${res.data?.message || ''}`,
    `Entrada duplicada NO rechazada (${res.status})`
  );

  // Re-enviar el mismo picking
  log.info(`Re-enviando picking: ${PICKING_1}...`);
  const res2 = await wmsCall('POST', '/salidas', {
    nit: NIT_CLIENTE_1,
    numero_picking: PICKING_1,
    documento_wms: `FAC-DUP-${uid()}`,
    detalles: [{ producto: '9400605', cantidad: 5 }],
  });

  assert(
    !res2.ok && res2.status === 400,
    `Picking duplicado rechazado (${res2.status}): ${res2.data?.message || ''}`,
    `Picking duplicado NO rechazado (${res2.status})`
  );
}

// ============================================================================
// PASO 9: PRUEBAS DE ERROR
// ============================================================================

async function paso9_errores() {
  log.section('9. PRUEBAS DE ERROR - Validaciones del API');

  // 9a. NIT inexistente
  log.info('Probando NIT inexistente...');
  const r1 = await wmsCall('POST', '/productos', {
    nit: '999999999-0',
    productos: [{ codigo: 'TEST', descripcion: 'Test' }],
  });
  assert(!r1.ok, `NIT inexistente rechazado (${r1.status})`, 'NIT inexistente NO fue rechazado');

  // 9b. Entrada sin detalles
  log.info('Probando entrada sin detalles...');
  const r2 = await wmsCall('POST', '/entradas', {
    nit: NIT_CLIENTE_1,
    documento_origen: `EMPTY-${uid()}`,
    detalles: [],
  });
  assert(!r2.ok, `Entrada vacía rechazada (${r2.status})`, 'Entrada vacía NO fue rechazada');

  // 9c. Entrada sin documento_origen
  log.info('Probando entrada sin documento_origen...');
  const r3 = await wmsCall('POST', '/entradas', {
    nit: NIT_CLIENTE_1,
    detalles: [{ producto: '9400605', cantidad: 10 }],
  });
  assert(!r3.ok, `Entrada sin documento rechazada (${r3.status})`, 'Entrada sin documento NO fue rechazada');

  // 9d. Sin API Key
  log.info('Probando request sin API Key...');
  const r4 = await fetch(`${API_URL}/wms/sync/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nit: NIT_CLIENTE_1, productos: [] }),
  }).then(r => ({ ok: r.ok, status: r.status })).catch(() => ({ ok: false, status: 0 }));
  assert(!r4.ok && r4.status === 401, `Sin API Key rechazado (${r4.status})`, `Sin API Key NO rechazado (${r4.status})`);

  // 9e. Producto sin código
  log.info('Probando producto sin código...');
  const r5 = await wmsCall('POST', '/productos', {
    nit: NIT_CLIENTE_1,
    productos: [{ descripcion: 'Producto sin código' }],
  });
  if (r5.ok) {
    const d = r5.data?.data || r5.data;
    assert(d.errores?.length >= 1, `Producto sin código registrado como error`, 'Producto sin código no dio error');
  }
}

// ============================================================================
// REPORTE FINAL
// ============================================================================

function reporteFinal() {
  const duracion = ((Date.now() - startTime) / 1000).toFixed(1);

  log.title('REPORTE FINAL');

  console.log(`
  📊 Resultados:
     Total tests:  ${totalTests}
     Exitosos:     ${passed} ✅
     Fallidos:     ${failed} ❌
     Advertencias: ${warnings} ⚠️

  ⏱  Duración: ${duracion}s

  📋 Datos creados en esta ejecución:
     • Catálogo: 8 productos (5 + 3)
     • Entrada #1: ${DOC_ENTRADA_1} (6 líneas, 348 UND)
     • Entrada #2: ${DOC_ENTRADA_2} (devolución, 15 UND)
     • Salida #1: ${PICKING_1} → Éxito Country (3 líneas, 204 UND)
     • Salida #2: ${PICKING_2} → Jumbo Calle 80 (1 línea, 80 UND)
  `);

  if (failed > 0) {
    console.log(`  🔴 ${failed} test(s) fallaron. Revise los errores arriba.`);
  } else {
    console.log(`  🟢 Todos los tests pasaron correctamente.`);
  }

  console.log(`\n  Valide en el CRM:
     1. Inventario → Buscar SKU 9400605 → Tab Cajas (debe mostrar cajas despachadas)
     2. Auditorías → Entradas → Buscar ${DOC_ENTRADA_1} → Verificar que cada línea muestra número de caja
     3. Auditorías → Salidas → Buscar ${PICKING_1} → Verificar destino y cajas
     4. Dashboard → Verificar KPIs actualizados
  `);

  console.log('═'.repeat(64) + '\n');
}

// ============================================================================
// FLUJO PRINCIPAL
// ============================================================================

let startTime;

async function main() {
  startTime = Date.now();

  log.title(`ISTHO CRM - SIMULACIÓN DÍA TÍPICO WMS (modo: ${MODO})`);
  console.log(`  📅 ${new Date().toLocaleString('es-CO')}`);
  console.log(`  🏢 Cliente 1: ${NIT_CLIENTE_1}`);
  console.log(`  🏢 Cliente 2: ${NIT_CLIENTE_2}`);
  console.log(`  🌐 API: ${API_URL}`);
  console.log(`  🔑 API Key: ${API_KEY.slice(0, 8)}...`);

  // Health check (siempre)
  const serverOk = await paso1_healthCheck();
  if (!serverOk) {
    console.log('\n  🛑 No se puede continuar sin conexión al servidor.\n');
    process.exit(1);
  }

  // Catálogo (siempre)
  await paso2_catalogo();
  if (MODO === 'solo-catalogo') { reporteFinal(); return; }

  // Entradas
  const entradaOk = await paso3_entradaGrande();
  if (!entradaOk) {
    log.warn('Abortando: la entrada principal falló');
    reporteFinal();
    return;
  }
  await paso4_devolucion();
  if (MODO === 'solo-entradas') { reporteFinal(); return; }

  // Salidas
  await paso5_despachoSucursal();
  await paso6_pedidoUrgente();
  if (MODO === 'solo-salidas') { reporteFinal(); return; }

  // Verificaciones
  await paso7_verificarAuditoria();
  await paso8_duplicados();

  if (MODO === 'completo' || MODO === 'con-errores') {
    await paso9_errores();
  }

  reporteFinal();
}

main().catch(err => {
  console.error('\n🚫 Error fatal:', err);
  process.exit(1);
});