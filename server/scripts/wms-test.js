/**
 * ISTHO CRM - Script de prueba WMS Sync
 *
 * Simula el WMS Copérnico enviando datos al CRM.
 * Ejecutar: node scripts/wms-test.js
 *
 * Requiere:
 * - Servidor CRM corriendo en localhost:5000
 * - Variable WMS_API_KEY configurada (o usa default de prueba)
 * - Al menos un cliente con NIT existente en la BD
 *
 * @author Coordinación TI - ISTHO S.A.S.
 */

const API_URL = process.env.CRM_API_URL || 'http://localhost:5000/api/v1';
const API_KEY = process.env.WMS_API_KEY || 'istho-wms-dev-key-2026';

// NIT del cliente de prueba (debe existir en la BD del CRM)
const NIT_CLIENTE = process.env.TEST_NIT || '900797309';

// ============================================================================
// HELPERS
// ============================================================================

const call = async (method, endpoint, body = null) => {
  const url = `${API_URL}/wms/sync${endpoint}`;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${method} ${url}`);
  console.log(`${'═'.repeat(60)}`);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-WMS-API-Key': API_KEY,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
    console.log('Body:', JSON.stringify(body, null, 2).substring(0, 500));
  }

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    console.log(`\nStatus: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('Error:', err.message);
    return null;
  }
};

// ============================================================================
// TEST DATA - Estructura real del WMS Copérnico
// ============================================================================

const testProductos = {
  nit: NIT_CLIENTE,
  productos: [
    { codigo: '656355', descripcion: 'PLACA ST 12.7 1220 2440 BR (86)' },
    { codigo: '656360', descripcion: 'PLACA ST 9.5 1220 2440 BR (110)' },
    { codigo: '656370', descripcion: 'PLACA RH 12.7 1220 2440 (72)' },
    { codigo: '700100', descripcion: 'PERFIL OMEGA 38MM X 3M CAL 26' },
    { codigo: '700200', descripcion: 'ANGULO 25X25MM X 3M CAL 26' },
  ],
};

const testEntrada = {
  nit: NIT_CLIENTE,
  documento_origen: `ENT-${Date.now().toString().slice(-6)}`,
  fecha_ingreso: new Date().toISOString().split('T')[0],
  tipo_documento: 'Remisión',
  detalles: [
    {
      producto: '656355',
      descripcion: 'PLACA ST 12.7 1220 2440 BR (86)',
      cantidad: 200,
      unidad_medida: 'UND',
      documento_asociado: 'REM-2026-001',
    },
    {
      producto: '656360',
      descripcion: 'PLACA ST 9.5 1220 2440 BR (110)',
      cantidad: 150,
      unidad_medida: 'UND',
      documento_asociado: 'REM-2026-001',
    },
    {
      producto: '700100',
      descripcion: 'PERFIL OMEGA 38MM X 3M CAL 26',
      cantidad: 500,
      unidad_medida: 'UND',
      lote: 'L-2026-MAR-01',
      fecha_vencimiento: null,
      documento_asociado: 'REM-2026-002',
    },
  ],
};

const testSalida = {
  nit: NIT_CLIENTE,
  numero_picking: `${34921 + Math.floor(Math.random() * 1000)}`,
  sucursal_entrega: 'Sucursal Centro Medellín',
  ciudad_destino: 'Medellín',
  detalles: [
    {
      producto: '656355',
      descripcion: 'PLACA ST 12.7 1220 2440 BR (86)',
      caja: 198697,
      cantidad: 86,
      pedido: 'KDC9059',
      lote_externo: '15/02/2026',
      lote_interno: null,
      fecha_vencimiento: '2036-02-19',
      peso: null,
    },
    {
      producto: '656355',
      descripcion: 'PLACA ST 12.7 1220 2440 BR (86)',
      caja: 198698,
      cantidad: 86,
      pedido: 'KDC9059',
      lote_externo: '15/02/2026',
      lote_interno: null,
      fecha_vencimiento: '2036-02-19',
      peso: null,
    },
    {
      producto: '656360',
      descripcion: 'PLACA ST 9.5 1220 2440 BR (110)',
      caja: 198700,
      cantidad: 50,
      pedido: 'KDC9060',
      lote_externo: '20/02/2026',
      lote_interno: null,
      fecha_vencimiento: '2036-02-25',
      peso: null,
    },
  ],
};

// ============================================================================
// EJECUTAR TESTS
// ============================================================================

const main = async () => {
  console.log('\n🏭 ISTHO CRM - WMS Sync Test');
  console.log(`📡 API: ${API_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`🏢 NIT Cliente: ${NIT_CLIENTE}`);

  // 1. Status check
  console.log('\n\n📋 TEST 1: Status Check');
  await call('GET', '/status');

  // 2. Sync productos
  console.log('\n\n📦 TEST 2: Sincronizar Productos');
  await call('POST', '/productos', testProductos);

  // 3. Sync entrada
  console.log('\n\n📥 TEST 3: Sincronizar Entrada');
  await call('POST', '/entradas', testEntrada);

  // 4. Sync salida
  console.log('\n\n📤 TEST 4: Sincronizar Salida (Picking)');
  await call('POST', '/salidas', testSalida);

  console.log('\n\n✅ Tests completados');
};

main().catch(console.error);
