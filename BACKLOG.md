# Product Backlog: Punto de Venta TRUE RESPONSIVE[cite: 4]
**Fecha:** 6 de mayo de 2026[cite: 4]
**Elaborado por:** Luis Diego Morales & Alfonso Valadez[cite: 4]
**Materia:** Ingeniería de Software[cite: 4]

## 1. Resumen Ejecutivo[cite: 4]
Se plantea el desarrollo de una webapp TRUE RESPONSIVE para punto de venta, diseñada para operar estrictamente bajo una red local conectada.[cite: 4] Esta decisión arquitectónica prioriza la estabilidad de los datos y la velocidad de entrega del MVP, dejando la capacidad offline (PWA con sincronización) como una iniciativa de escalabilidad futura.[cite: 4] El producto permitirá registrar ventas ágiles utilizando la cámara del celular para escanear códigos EAN-13, pero la interfaz estará preparada para soportar escáneres físicos (lectores de código de barras USB/Bluetooth) en el futuro, optimizando la operación en caja física.[cite: 4]

## 2. Supuestos y Aclaraciones[cite: 4]
* **Arquitectura (Red Local):** El sistema dependerá de que los dispositivos (móviles y PC) estén conectados a la misma red WiFi/LAN donde se ejecuta el servidor Node.js y la base de datos SQLite.[cite: 4]
* **Hardware Preparado:** Se asume que el escaneo manual actuará como puente tecnológico.[cite: 4] Al mantener el campo de captura siempre activo (auto-focus), se garantiza compatibilidad inmediata con pistolas láser sin reprogramar código.[cite: 4]
* **Ticket no fiscal:** El comprobante de venta generado servirá única y exclusivamente para control interno y entrega al cliente.[cite: 4] No tendrá validez fiscal (CFDI).[cite: 4]

## 3. Alcance del Producto[cite: 4]
* **Alcance Incluido (MVP):** API REST local, cliente web responsive, escaneo de EAN-13 por cámara, alta rápida de productos, validación de inventarios con override de supervisor, e impresión USB.[cite: 4]
* **Alcance Excluido:** Facturación Electrónica, pasarelas de pago (Stripe/Clip), aplicaciones nativas, sincronización en la nube.[cite: 4]
* **Alcance Condicionado (Futuro):** La operación offline mediante PWA/IndexedDB pasa a ser una iniciativa de escalabilidad futura (PBI-041).[cite: 4]

## 4. Stakeholders, Usuarios y Roles[cite: 4]
* **Cajero:** Objetivo: Procesar la fila de clientes rápido.[cite: 4] Permisos: Escaneo EAN-13, cobro, impresión de ticket.[cite: 4] Restricciones: No puede vender si el stock es cero o menor a cero.[cite: 4]
* **Supervisor / Gerente:** Objetivo: Mantener la continuidad del negocio.[cite: 4] Permisos: Todos los del cajero, más la capacidad de autorizar ventas en negativo, realizar ajustes de inventario manuales y consultar reportes.[cite: 4]

## 5. Product Backlog Detallado (Prioridad y Flujo de Trabajo)[cite: 4]
*Nota: Los ítems marcados como MUST conforman el Sprint 1 y Sprint 2 (El MVP).*[cite: 4]

### ÉPICA 1: Base Técnica y Arquitectura[cite: 4]

**PBI-001 | Arquitectura Cliente-Servidor en Red Local**[cite: 4]
* **Nivel:** Enabler | **Prioridad:** MUST | **Actor:** Desarrollador Backend[cite: 4]
* **Descripción:** Configurar servidor Node.js/Express conectado a SQLite existente, exponiendo API REST transaccional en tiempo real dentro de la red local.[cite: 4]
* **Criterios de Aceptación:** Cliente web se comunica con API usando IP local.[cite: 4] Lecturas y escrituras son directas.[cite: 4]

**PBI-002 | Interfaz de Layout TRUE RESPONSIVE**[cite: 4]
* **Nivel:** Historia | **Prioridad:** MUST | **Actor:** Cajero[cite: 4]
* **Descripción:** Interfaz que se adapte automáticamente al celular (vista vertical a una mano) y a la computadora de la caja.[cite: 4]
* **Criterios de Aceptación:** Vista móvil prioriza escáner y carrito.[cite: 4] No hay desbordamiento horizontal.[cite: 4]

### ÉPICA 2: Escaneo e Ingreso de Datos[cite: 4]

**PBI-005 | Módulo de Escáner EAN-13 por Cámara**[cite: 4]
* **Nivel:** Historia | **Prioridad:** MUST | **Actor:** Cajero[cite: 4]
* **Descripción:** Abrir cámara de dispositivo móvil desde navegador para leer códigos EAN-13 y detectar productos.[cite: 4]
* **Criterios de Aceptación:** Solicitud de permisos correcta.[cite: 4] Validación exclusiva EAN-13.[cite: 4] Disparo automático a la API.[cite: 4]

**PBI-008 | Ingreso Manual y Soporte para Escáner Físico (Auto-focus)**[cite: 4]
* **Nivel:** Historia | **Prioridad:** MUST | **Actor:** Cajero / Sistema[cite: 4]
* **Descripción:** Campo de texto siempre activo para escribir código manual o inyectar código de pistola USB.[cite: 4]
* **Criterios de Aceptación:** Campo recupera foco tras cada venta.[cite: 4] Al recibir 'Enter', procesa el código.[cite: 4]

### ÉPICA 3: Catálogo y Búsqueda[cite: 4]

**PBI-006 | Búsqueda Automática de Producto**[cite: 4]
* **Nivel:** Historia | **Prioridad:** MUST | **Actor:** Sistema[cite: 4]
* **Descripción:** Consultar SQLite al recibir código EAN-13 y devolver precio, nombre y stock.[cite: 4]
* **Criterios de Aceptación:** Respuesta de API < 500ms.[cite: 4] Si existe, va al carrito.[cite: 4]

**PBI-007 | Alta Rápida de Producto no Registrado**[cite: 4]
* **Nivel:** Historia | **Prioridad:** SHOULD | **Actor:** Supervisor[cite: 4]
* **Descripción:** Si el código no existe, abrir modal precargado para registrar nombre, precio y stock.[cite: 4]
* **Criterios de Aceptación:** Solo visible para Supervisor.[cite: 4] Añade al carrito tras guardar.[cite: 4]

### ÉPICA 4: Venta POS y Comprobante[cite: 4]

**PBI-013 | Carrito de Venta Activo y Totales**[cite: 4]
* **Nivel:** Historia | **Prioridad:** MUST | **Actor:** Cajero[cite: 4]
* **Descripción:** Ver lista de productos, sumar/restar cantidades y ver cálculo en tiempo real.[cite: 4]
* **Criterios de Aceptación:** Modificar cantidad recalcula suma.[cite: 4] Botón "Cobrar" visible.[cite: 4]

**PBI-021 | Deducción de Inventario y Override de Supervisor**[cite: 4]
* **Nivel:** Historia | **Prioridad:** MUST | **Actor:** Sistema / Supervisor[cite: 4]
* **Descripción:** Registrar en Movimiento_Inventario y descontar stock.[cite: 4] Supervisor puede autorizar venta en negativo.[cite: 4]
* **Criterios de Aceptación:** Si stock >= 0, completa venta.[cite: 4] Si stock < 0 (Cajero): bloquea cobro.[cite: 4] Si stock < 0 (Supervisor): pide confirmación y permite venta.[cite: 4]

**PBI-018 | Generación de Comprobante USB (58mm/80mm)**[cite: 4]
* **Nivel:** Historia | **Prioridad:** MUST | **Actor:** Cajero[cite: 4]
* **Descripción:** Generar vista B/N y disparar diálogo de impresión a ticketera USB.[cite: 4]
* **Criterios de Aceptación:** Formato CSS para @media print.[cite: 4] Sin márgenes ni navegación.[cite: 4]

## 6. Definition of Ready y Definition of Done[cite: 4]
* **DoR:** El PBI tiene diseño de UI claro y tablas de SQLite definidas.[cite: 4]
* **DoD:** Código fusionado en main de GitHub, probado en celular y PC en mismo WiFi local, actualizando DB correctamente.[cite: 4]