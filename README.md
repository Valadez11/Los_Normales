<div align="center">

# SOFT POS®
### Sistema de Punto de Venta TRUE RESPONSIVE

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![React](https://img.shields.io/badge/React-18%20CDN-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Puerto](https://img.shields.io/badge/Puerto-5000-1A56A0?style=for-the-badge)

**Ingeniería de Software — UAZ**  
Luis D. Morales · Alfonso Valadez · Mayo 2026

</div>

---

## Resumen Ejecutivo

Webapp de punto de venta diseñada para operar en red local (LAN). Permite registrar ventas ágiles usando la cámara del celular para escanear códigos EAN-13, con soporte para escáneres físicos USB. El sistema incluye autenticación por PIN, gestión de inventario con transacciones ACID, override de supervisor y generación de comprobante térmico.

<div align="center">

| 8 / 8 | 4 / 4 | 1 | 5000 |
|:---:|:---:|:---:|:---:|
| **PBIs MUST completados** | **Épicas cubiertas** | **PBI SHOULD pendiente** | **Puerto API** |
| ![](https://img.shields.io/badge/-COMPLETO-1A7A4A?style=flat-square) | ![](https://img.shields.io/badge/-COMPLETO-1A56A0?style=flat-square) | ![](https://img.shields.io/badge/-SHOULD-D35400?style=flat-square) | ![](https://img.shields.io/badge/-activo-2E86AB?style=flat-square) |

</div>

---

## Estado de Épicas y PBIs

> ✅ **Todas las épicas del MVP están completas.** Las 4 épicas del backlog tienen todos sus PBIs MUST implementados y commiteados.
> 
> ⚠️ **PBI-007 pendiente — prioridad SHOULD, no MUST.** No bloquea la entrega del MVP.

| PBI | Nombre | Épica | Prioridad | Estado | Notas |
|-----|--------|-------|:---------:|:------:|-------|
| **PBI-001** | Arquitectura Cliente-Servidor LAN | Ep.1: Base Técnica | ![](https://img.shields.io/badge/MUST-1A56A0?style=flat-square&logoColor=white) | ![](https://img.shields.io/badge/COMPLETO-1A7A4A?style=flat-square&logoColor=white) | Node/Express + SQLite WAL. API en `:5000` |
| **PBI-002** | Layout TRUE RESPONSIVE | Ep.1: Base Técnica | ![](https://img.shields.io/badge/MUST-1A56A0?style=flat-square&logoColor=white) | ![](https://img.shields.io/badge/COMPLETO-1A7A4A?style=flat-square&logoColor=white) | Login React + ventas CSS Grid 3 columnas |
| **PBI-005** | Escáner EAN-13 por Cámara | Ep.2: Escaneo | ![](https://img.shields.io/badge/MUST-1A56A0?style=flat-square&logoColor=white) | ![](https://img.shields.io/badge/COMPLETO-1A7A4A?style=flat-square&logoColor=white) | `html5-qrcode`. Permisos y disparo a API |
| **PBI-008** | Ingreso Manual / Auto-focus | Ep.2: Escaneo | ![](https://img.shields.io/badge/MUST-1A56A0?style=flat-square&logoColor=white) | ![](https://img.shields.io/badge/COMPLETO-1A7A4A?style=flat-square&logoColor=white) | Campo siempre activo, `Enter` procesa código |
| **PBI-006** | Búsqueda Automática de Producto | Ep.3: Catálogo | ![](https://img.shields.io/badge/MUST-1A56A0?style=flat-square&logoColor=white) | ![](https://img.shields.io/badge/COMPLETO-1A7A4A?style=flat-square&logoColor=white) | `GET /api/productos/:codigo` < 500ms |
| **PBI-007** | Alta Rápida de Producto | Ep.3: Catálogo | ![](https://img.shields.io/badge/SHOULD-D35400?style=flat-square&logoColor=white) | ![](https://img.shields.io/badge/PENDIENTE-C0392B?style=flat-square&logoColor=white) | Modal supervisor. No bloquea MVP |
| **PBI-013** | Carrito de Venta y Totales | Ep.4: Venta POS | ![](https://img.shields.io/badge/MUST-1A56A0?style=flat-square&logoColor=white) | ![](https://img.shields.io/badge/COMPLETO-1A7A4A?style=flat-square&logoColor=white) | React state. Cantidades, subtotal, IVA 13% |
| **PBI-021** | Deducción Inventario + Override | Ep.4: Venta POS | ![](https://img.shields.io/badge/MUST-1A56A0?style=flat-square&logoColor=white) | ![](https://img.shields.io/badge/COMPLETO-1A7A4A?style=flat-square&logoColor=white) | Transacción ACID + `override_supervisor` |
| **PBI-018** | Comprobante Térmico USB 80mm | Ep.4: Venta POS | ![](https://img.shields.io/badge/MUST-1A56A0?style=flat-square&logoColor=white) | ![](https://img.shields.io/badge/COMPLETO-1A7A4A?style=flat-square&logoColor=white) | `@media print` CSS. `window.print()` post-éxito |

---

## Instalación y Arranque

### Requisitos
- Node.js v18+
- Git

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Valadez11/Los_Normales.git
cd Los_Normales/backend
npm install
```

### 2. Sembrar la base de datos (primera vez)

```bash
node database/seed.js
```

### 3. Iniciar el servidor

```bash
npm start
# ✔ Servidor SOFT POS® en http://localhost:5000
```

### 4. Abrir el frontend

Abre `frontend/index.html` en el navegador. Para servir desde red local:

```bash
npx serve frontend -p 3000
# Acceder desde celular: http://<IP-local>:3000
```

> **Nota:** El servidor escucha en `0.0.0.0` — todos los dispositivos en la misma red WiFi pueden acceder usando la IP local de la PC.

---

## Arranque Automático con PM2

Para que el servidor inicie solo al encender la PC (PowerShell como Administrador):

```powershell
# Instalación (una sola vez)
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install

# Registrar el servidor
cd E:\POS-Soft\Los_Normales\backend
pm2 start app.js --name "softpos-api"
pm2 save
```

| Comando | Qué hace |
|---------|----------|
| `pm2 list` | Ver estado de todos los procesos |
| `pm2 logs softpos-api` | Logs en tiempo real |
| `pm2 restart softpos-api` | Reiniciar tras cambios en `app.js` |
| `pm2 stop softpos-api` | Detener sin desregistrar |
| `pm2 monit` | Panel visual de CPU, RAM y logs |

---

## Estructura del Proyecto

```
Los_Normales/
├── backend/
│   ├── database/
│   │   ├── db.js          # Esquema SQLite: 5 tablas + 2 TRIGGERS
│   │   └── seed.js        # 12 productos con EAN-13 reales
│   ├── app.js             # API REST Express — 7 endpoints
│   └── package.json
├── frontend/
│   ├── assets/
│   │   └── SoftPos.png
│   ├── index.html         # Login con PIN real (POST /login)
│   └── ventas.html        # POS completo (carrito, escáner, cobro)
├── docs/
│   ├── BACKLOG.md
│   └── Product Backlog.pdf
├── scripts/
│   └── fix-merge.ps1
├── .gitignore
└── README.md
```

---

## API REST

Base URL: `http://localhost:5000`

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | `GET` | Health check |
| `/api/productos/:codigo` | `GET` | Busca por EAN-13 o ID. Devuelve `{ id, codigo, nombre, precio, stock }` |
| `/api/ventas` | `POST` | Transacción ACID. Pre-validación de stock. Soporta `override_supervisor` |
| `/login` | `POST` | Auth por PIN → `{ usuario, rol }` |
| `/productos` | `POST` | Alta/actualización con upsert `ON CONFLICT` |
| `/productos/:codigo` | `GET` | Ruta raw compatible |

### Ejemplo POST /api/ventas

```json
{
  "total": 14.13,
  "pago": 20.00,
  "cambio": 5.87,
  "cajero": "Admin",
  "override_supervisor": false,
  "productos": [
    { "codigo": "7501055300427", "cantidad": 2, "precio_unitario": 1.25 }
  ]
}
```

---

## Roles del Sistema

| Rol | Permisos |
|-----|----------|
| **CAJERO** | Escanear, cobrar, imprimir ticket. Bloqueado si stock < 0 |
| **SUPERVISOR** | Todo lo del Cajero + autorizar ventas en negativo (override) |
| **ADMIN** | Todos los permisos |

Los usuarios y PINs se gestionan en la tabla `Usuarios` de SQLite.

---

## Modelo de Datos

```
Producto          Ventas              Detalle_Ventas
─────────         ──────              ──────────────
id (PK)           id (PK)             id (PK)
codigo_barras     fecha               venta_id ──→ Ventas
nombre            subtotal            producto_id ──→ Producto
precio_venta      impuestos           cantidad
existencia        total               precio_unitario
                  efectivo_recibido
                  cambio

Usuarios          Movimiento_Inventario
────────          ─────────────────────
id (PK)           id (PK)
nombre            producto_id ──→ Producto
pin (UNIQUE)      tipo (ENTRADA|SALIDA|AJUSTE)
rol               cantidad · motivo · fecha
```

**TRIGGERS automáticos al registrar venta:**
- `actualizar_stock_post_venta` — descuenta `existencia` en `Producto`
- `registrar_movimiento_venta` — inserta registro en `Movimiento_Inventario`

---

## Próximos Pasos

| PBI | Tarea | Prioridad |
|-----|-------|:---------:|
| PBI-007 | Alta Rápida de Producto (modal supervisor) | ![](https://img.shields.io/badge/SHOULD-D35400?style=flat-square&logoColor=white) |
| — | Catálogo dinámico desde BD (reemplazar `initialProducts`) | ![](https://img.shields.io/badge/SHOULD-D35400?style=flat-square&logoColor=white) |
| — | Métricas dinámicas (`GET /api/metricas`) | ![](https://img.shields.io/badge/COULD-64748B?style=flat-square&logoColor=white) |
| PBI-041 | PWA / Modo offline con IndexedDB | ![](https://img.shields.io/badge/COULD-64748B?style=flat-square&logoColor=white) |

---

<div align="center">

**SOFT POS® — MVP completado. Sistema listo para operación en red local.**  
Ingeniería de Software · UAZ · Luis D. Morales & Alfonso Valadez · Mayo 2026

</div>
