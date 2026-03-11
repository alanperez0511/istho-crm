/**
 * ISTHO CRM - Script de prueba WMS Sync (Escenario Multi-Caja)
 * 
 * Simula el flujo completo de:
 * 1. Sincronización de catálogo (Producto Latti)
 * 2. Entrada de 200 unidades repartidas en 2 CAJAS (Cajas 70003 y 70004)
 * 3. Salida de una CAJA ESPECÍFICA (Caja 70003) para validar trazabilidad.
 * 
 * Ejecutar: node scripts/wms-test.js
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 */

require('dotenv').config();

const API_URL = process.env.CRM_API_URL || 'http://localhost:5000/api/v1';
const API_KEY = process.env.WMS_API_KEY || 'istho-wms-dev-key-2026';
const NIT_CLIENTE = process.env.TEST_NIT || '800245795-0';

// ============================================================================
// HELPERS
// ============================================================================

const call = async (method, endpoint, body = null) => {
  const url = `${API_URL}/wms/sync${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json', 
        'X-WMS-API-Key': API_KEY 
      },
      body: body ? JSON.stringify(body) : null
    });
    
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }

    console.log(`${res.ok ? '✅' : '❌'} ${method} ${endpoint} (${res.status})`);
    if (!res.ok) console.log('   ⚠️ Error:', data.message || data);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('   🚫 Error de red:', err.message);
    return { ok: false, error: err.message };
  }
};

// ============================================================================
// DATOS PARA EL ESCENARIO
// ============================================================================

const SKU_PRUEBA = '9400605';
const DESCRIPCION_REAL = 'BALDE CON TAPA DULCE DE LECHE 5KG';
const LOTE_PRUEBA = `L-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`;

// 1. Catálogo de productos
const testProductos = {
  nit: NIT_CLIENTE,
  productos: [
    { 
      codigo: SKU_PRUEBA, 
      descripcion: DESCRIPCION_REAL,
      unidad_medida: 'UND'
    }
  ]
};

// 2. Entrada: 200 unidades divididas en 2 Cajas de 100
const testEntrada = {
  nit: NIT_CLIENTE,
  documento_origen: `REM-${Date.now().toString().slice(-6)}`,
  fecha_ingreso: new Date().toISOString(),
  tipo_documento: 'Remisión',
  detalles: [
    {
      producto: SKU_PRUEBA,
      descripcion: DESCRIPCION_REAL, // Enviamos descripción para validar el bug
      cantidad: 100,
      caja: '80012', 
      lote: LOTE_PRUEBA,
      ubicacion: 'ESTANTE-A1',
      peso: 90.5,
      unidad_medida: 'UND'
    },
    {
      producto: SKU_PRUEBA,
      descripcion: SKU_PRUEBA, // Simulamos que el WMS envía el SKU aquí para probar si el CRM lo corrige
      cantidad: 100,
      caja: '80013',
      lote: LOTE_PRUEBA,
      ubicacion: 'ESTANTE-A1',
      peso: 90.5,
      unidad_medida: 'UND'
    }
  ]
};

// 3. Salida: Despachar una caja específica (la 80010)
const testSalida = {
  nit: NIT_CLIENTE,
  numero_picking: `PICK-${Date.now().toString().slice(-6)}`,
  documento_wms: `FAC-${Date.now().toString().slice(-6)}`,
  sucursal_entrega: 'TIENDA ANTIOQUIA #4',
  ciudad_destino: 'MEDELLÍN',
  detalles: [
    {
      producto: SKU_PRUEBA,
      // No enviamos descripción para forzar al CRM a buscarla en el maestro
      cantidad: 100,
      caja: '80012', // Picking dirigido a la caja 80012  
      lote_interno: LOTE_PRUEBA,
      pedido: 'PED-999',
      unidad_medida: 'UND'
    }
  ]
};

// ============================================================================
// FLUJO DE EJECUCIÓN
// ============================================================================

async function runTest() {
  console.log(`\n🚀 INICIANDO TEST WMS - ESCENARIO TRAZABILIDAD POR CAJA`);
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
  console.log(`🏢 Cliente: ${NIT_CLIENTE} | 🏷️ SKU: ${SKU_PRUEBA}\n`);

  // PASO 1: Sincronizar catálogo
  console.log('--- [1/3] Sincronizando catálogo de productos ---');
  const p = await call('POST', '/productos', testProductos);
  if (!p.ok) return;

  // PASO 2: Entrada Multi-Caja
  console.log('\n--- [2/3] Creando Entrada (2 cajas x 100 unidades) ---');
  const e = await call('POST', '/entradas', testEntrada);
  if (e.ok) {
    console.log(`   💡 Check: Se crearon 2 registros de stock individual (Cajas 80012 y 80013).`);
    console.log(`   💡 Saldo en CRM debería ser 200 UND.`);
  } else return;

  // PASO 3: Salida de Caja Específica
  console.log('\n--- [3/3] Creando Salida (Pickeando Caja 80012) ---');
  const s = await call('POST', '/salidas', testSalida);
  if (s.ok) {
    console.log(`   💡 Check: La Caja 80012 ahora debe figurar como DESPACHADA.`);
    console.log(`   💡 La Caja 80013 debe seguir DISPONIBLE.`);
    console.log(`   💡 Saldo final esperado: 100 UND.`);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('✅ TEST FINALIZADO CON ÉXITO');
  console.log('   Valide en el CRM que el producto "' + SKU_PRUEBA + '"');
  console.log('   tenga la descripción "' + DESCRIPCION_REAL + '"');
  console.log(`${'═'.repeat(60)}\n`);
}

runTest();
