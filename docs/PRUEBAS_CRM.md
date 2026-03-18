# ISTHO CRM - Entorno de Pruebas Disponible

**Fecha:** 18 de marzo de 2026
**Estado:** Listo para pruebas

---

Equipo, les informamos que el **entorno de pruebas del CRM ISTHO** ya se encuentra disponible para comenzar a realizar las validaciones correspondientes de cada módulo del sistema.

**URL de acceso:** *https://istho-crm-six.vercel.app/login*

---

## Credenciales por Rol

| Rol | Usuario | Correo | Contraseña |
|-----|---------|--------|------------|
| **Administrador** | admin | admin@istho.com.co | Admin2026* |
| **Supervisor** | supervisor | supervisor@istho.com.co | Supervisor2026* |
| **Financiera** | financiera | financiera@istho.com.co | Financiera2026! |
| **Operador** | operador | operador@istho.com.co | Operador2026* |
| **Conductor** | conductor | practicanteds@istho.com.co | Conductor2026* |
| **Cliente Portal** | osman | osmandavidgallego@gmail.com | Da071206$ |

> Se puede iniciar sesión con el **usuario** o con el **correo electrónico**.

---

## Descripción de Roles

### Administrador (Nivel 100)
Acceso total al sistema. Gestiona usuarios, roles, permisos, configuración general, plantillas de email y tiene visibilidad completa de todos los módulos. Es el único que puede crear/eliminar usuarios y modificar la configuración del sistema.

### Supervisor (Nivel 75)
Gestión operativa completa. Supervisa entradas, salidas, inventario, despachos, auditorías y el módulo de viajes completo (vehículos, cajas menores, viajes, movimientos). Puede aprobar gastos y cerrar cajas menores. No puede administrar usuarios ni configuración del sistema.

### Financiera (Nivel 70)
Enfocada en la gestión financiera del módulo de viajes. Crea y administra cajas menores, revisa y aprueba/rechaza gastos de los conductores, genera reportes financieros y tiene acceso al dashboard financiero con KPIs de gastos y aprobaciones pendientes.

### Operador (Nivel 50)
Operaciones diarias de bodega. Gestiona entradas, salidas, auditorías de operaciones (WMS), despachos e inventario. No tiene acceso al módulo de viajes ni a la administración del sistema.

### Conductor (Nivel 30)
Interfaz optimizada para dispositivos móviles. Registra viajes, sube soportes de gastos (facturas, recibos), consulta su caja menor activa y sus movimientos. Solo tiene acceso al Dashboard y al módulo de Viajes. No puede aprobar gastos ni cerrar cajas.

### Cliente Portal (Nivel 10)
Acceso limitado al portal de cliente. Visualiza el inventario de sus productos, operaciones asociadas, despachos, reportes y auditorías de su cuenta. Todo lo que ve está filtrado por su empresa.

---

## Módulos del Sistema y Flujos de Prueba

### 1. Autenticación y Perfil

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Login con correo | Ingresar correo + contraseña → Iniciar Sesión | Redirige al Dashboard del rol correspondiente |
| Login con usuario | Ingresar nombre de usuario + contraseña → Iniciar Sesión | Redirige al Dashboard del rol correspondiente |
| Cambiar contraseña | Perfil → Cambiar Contraseña → Ingresar actual y nueva | Mensaje de éxito, próximo login usa nueva contraseña |
| Subir foto de perfil | Perfil → Click en icono de cámara → Seleccionar imagen | La foto se muestra inmediatamente sin recargar |
| Editar perfil | Perfil → Editar Perfil → Modificar datos → Guardar | Datos actualizados en el perfil |

---

### 2. Dashboard

| Rol | Qué debe ver |
|-----|-------------|
| **Admin/Supervisor** | Dashboard general con estadísticas de inventario, operaciones recientes, alertas |
| **Financiera** | Dashboard financiero: KPIs de cajas abiertas, gastos pendientes, tabla de aprobaciones, alertas de vehículos |
| **Conductor** | Dashboard móvil: caja menor activa con saldo, acciones rápidas (2x2), últimos viajes y gastos |
| **Operador** | Dashboard general con operaciones |
| **Cliente** | Dashboard de su inventario |

---

### 3. Clientes (Admin, Supervisor)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Crear cliente | Clientes → Crear → Llenar datos (razón social, NIT, ciudad, etc.) → Guardar | Cliente aparece en la lista con código CLI-XXXX |
| Editar cliente | Click en cliente → Editar → Modificar datos → Guardar | Datos actualizados |
| Ver total productos | Revisar columna "Productos" en la tabla | Muestra cantidad de productos registrados por cliente |
| Exportar PDF | Reportes → Clientes → Exportar PDF | PDF con tabla de clientes, columna de productos, totales |
| Exportar Excel | Reportes → Clientes → Exportar Excel | Excel con todos los datos de clientes |

---

### 4. Inventario (Admin, Supervisor, Operador)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Ver inventario | Inventario → Productos | Lista de productos con stock, cliente, SKU |
| Crear producto manual | Inventario → Crear → Datos del producto → Guardar | Producto creado (solo si no es de WMS) |
| Restricción WMS | Intentar editar/eliminar producto con código WMS | Botones ocultos o deshabilitados, no permite modificar |
| Buscar por documento WMS | Inventario → Buscar por número de documento | Filtra productos por documento de origen |

---

### 5. Operaciones - Entradas, Salidas, Kardex (Admin, Supervisor, Operador)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Ver entradas | Inventario → Entradas | Lista paginada con filtros por estado, cliente |
| Ver detalle entrada | Click en una entrada | Detalle con líneas de operación, progreso de auditoría |
| Cerrar auditoría | En detalle → Verificar líneas → Cerrar | Estado cambia a "Cerrado", se envía email al cliente |
| Paginación | Navegar entre páginas de resultados | Carga correctamente cada página |
| Exportar auditoría Excel | Botón Excel en lista de entradas | Descarga archivo .xlsx con datos filtrados |
| Exportar auditoría CSV | Botón CSV en lista de entradas | Descarga archivo .csv |

---

### 6. Despachos (Admin, Supervisor, Operador)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Ver despachos | Inventario → Despachos | Lista de despachos con estado |
| Crear despacho | Crear → Seleccionar cliente, productos, cantidades → Guardar | Despacho creado con número único |
| Subir cumplido | En detalle del despacho → Subir documento cumplido | Archivo se asocia al despacho |

---

### 7. Módulo de Viajes

#### 7.1 Vehículos (Admin, Supervisor, Financiera lectura, Conductor lectura)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Crear vehículo | Viajes → Vehículos → Nuevo → Datos (placa, tipo, SOAT, tecnicomecánica) → Guardar | Vehículo creado, placa en mayúsculas |
| Asignar conductor | Editar vehículo → Tab Asignación → Seleccionar conductor → Guardar | Conductor aparece en la tabla |
| Alertas vencimiento | Crear vehículo con SOAT próximo a vencer (< 30 días) | Badge amarillo "Por vencer" con días restantes |
| Ver detalle (conductor) | Iniciar sesión como conductor → Vehículos → Ver detalle | Se ve la información pero NO aparece botón Guardar |
| Capacidad en toneladas | Verificar columna de capacidad | Muestra "XX.XX Ton" (no KG) |

#### 7.2 Cajas Menores (Financiera, Admin, Supervisor)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Crear caja menor | Viajes → Cajas Menores → Nueva → Asignar conductor + saldo inicial → Crear | Caja creada con número CM-XXXX, estado "Abierta" |
| Trasladar saldo | Al crear, seleccionar caja anterior cerrada | Muestra saldo a trasladar, suma al saldo inicial |
| Ver detalle | Click en una caja | Tabs: Viajes asociados, Movimientos, Información |
| Cerrar caja | En detalle → Cerrar Caja → Confirmar | Estado cambia a "Cerrada", saldo queda congelado |
| KPIs | Verificar tarjetas superiores | Abiertas (verde), En Revisión (amarillo), Cerradas (gris) |

#### 7.3 Viajes (Conductor, Admin, Supervisor, Financiera lectura)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Crear viaje | Viajes → Viajes → Nuevo Viaje → Llenar datos → Guardar | Viaje creado con número correlativo |
| Auto-fill conductor | Al seleccionar vehículo con conductor asignado | Campo Conductor se llena automáticamente |
| Seleccionar cliente CRM | En campo Cliente → Seleccionar de lista | Cliente se selecciona, documento queda vacío para llenar manualmente |
| Ver detalle | Click en viaje | Cards de info + datos básicos + facturación + gastos asociados |
| Peso en toneladas | Verificar campo peso | Label dice "Peso (Ton)", no KG |

#### 7.4 Movimientos / Gastos (Conductor crea, Financiera aprueba)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Crear gasto (egreso) | Movimientos → Nuevo → Tipo: Egreso, Concepto: ACPM, Valor → Registrar | Movimiento creado con estado "Pendiente" (no rechazado) |
| Crear ingreso | Nuevo → Tipo: Ingreso, Concepto: Ingreso Adicional, Valor → Registrar | Movimiento creado como Pendiente |
| Concepto "Otros" | Seleccionar concepto "Otros" | Aparece campo "Especifique el Concepto" obligatorio |
| Subir soporte | Tab "Soporte y Descripción" → Elegir archivo (PDF/imagen) | Archivo adjunto al movimiento |
| Aprobar gasto (Financiera) | Login como Financiera → Movimientos → Click en menú → Aprobar | Dialog de aprobación con valor editable y observaciones |
| Aprobar masivamente | Seleccionar varios gastos pendientes → Aprobar todos | Todos cambian a estado "Aprobado" |
| Rechazar gasto | En dialog de aprobación → Rechazar | Estado cambia a "Rechazado" con observaciones |
| Formato moneda | Verificar valores en tabla y formularios | Formato colombiano: $1.000.000 |

---

### 8. Reportes (Admin, Supervisor, Financiera parcial)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Reporte Inventario | Reportes → Inventario → Ver gráficos | Gráficos de distribución por cliente, stock |
| Reporte Clientes | Reportes → Clientes → Ver | Tabla con total de productos por cliente |
| Exportar PDF | Click en botón PDF | Descarga PDF con formato corporativo |
| Exportar Excel | Click en botón Excel | Descarga Excel con datos completos |
| Enviar por email | Botón email → Destinatarios → Formato (Excel, PDF o ambos) → Enviar | Email recibido con adjuntos seleccionados |
| Reporte comparativo | Ver sección de tendencias | Gráfico de 6 meses con variación % |

---

### 9. Reportes Programados (Admin, Supervisor)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Crear programado | Reportes → Programados → Nuevo → Tipo, frecuencia, destinatarios, formato → Guardar | Reporte aparece en lista con estado "Activo" |
| Ejecutar manualmente | Click en botón de ejecución | Se envía email inmediatamente con adjuntos |
| Formato ambos | Seleccionar "Excel + PDF" → Guardar | Badge muestra ambos formatos |
| Pausar/Reactivar | Click en toggle de estado | Cambia entre Activo/Pausado |

---

### 10. Notificaciones en Tiempo Real

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Badge en header | Realizar una acción que genere notificación | El contador de la campana se actualiza sin recargar |
| Toast en escritorio | Crear una operación, cerrar auditoría, etc. | Aparece notificación toast en esquina inferior |
| Toast en móvil | Misma prueba desde celular | Toast visible en parte inferior, ancho completo |
| Panel de notificaciones | Click en campana | Lista de notificaciones con marca de leída/no leída |

---

### 11. Plantillas de Email (Admin)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Ver plantillas | Administración → Plantillas Email | Lista de plantillas (bienvenida, reseteo, cierre, alerta, general) |
| Subir logo firma | En editor → Subir logo → Guardar | Logo aparece en header y firma de todos los emails |
| Previsualizar | Click en vista previa | Muestra email con logo, colores corporativos, footer |

---

### 12. Administración de Usuarios (Admin)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Crear usuario | Admin → Usuarios → Crear → Datos + Rol → Guardar | Usuario creado, puede iniciar sesión |
| Resetear contraseña | En usuario → Resetear Contraseña → Marcar "Enviar correo" → Resetear | Contraseña cambiada, email enviado si tiene correo |
| Cambio obligatorio | Tras reseteo, iniciar sesión con usuario reseteado | Aparece modal obligando cambiar contraseña |
| Ver permisos | En perfil → Tab Permisos | Muestra permisos reales del rol (no hardcodeados) |

---

### 13. Búsqueda Global (Todos los roles)

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Abrir búsqueda | Ctrl+K (o Cmd+K en Mac) | Se abre modal de búsqueda |
| Buscar cliente | Escribir nombre de cliente | Resultados filtrados cross-módulo |
| Navegar resultado | Click en resultado | Redirige al módulo correspondiente |

---

### 14. Portal Cliente

| Prueba | Pasos | Resultado Esperado |
|--------|-------|--------------------|
| Ver inventario propio | Login como cliente → Inventario | Solo ve productos de su empresa |
| Ver operaciones | Operaciones → Entradas/Salidas | Solo ve operaciones de su empresa |
| Dashboard | Dashboard | Estadísticas filtradas por su cuenta |

---

## Notas Importantes

1. **Navegador recomendado:** Chrome o Edge (última versión)
2. **Modo oscuro:** Se puede activar con el icono de sol/luna en el header
3. **Vista móvil:** El sistema es responsive. El rol Conductor está optimizado para celular
4. **Los datos son de prueba** - pueden crearse, editarse y eliminarse libremente
5. **Cualquier error o comportamiento inesperado**, reportarlo indicando: rol, módulo, pasos realizados y captura de pantalla

---

**Gracias por su colaboración en esta fase de pruebas.**
