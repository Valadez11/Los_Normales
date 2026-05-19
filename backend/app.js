const express = require('express');
const cors    = require('cors');
const { initDB, db } = require('./database/db');

const app  = express();
const PORT = process.env.PORT || 5000; // Unificado con el frontend (ventas.html)

app.use(cors());
app.use(express.json());

// Modo WAL: mejora la concurrencia para 2 dispositivos simultáneos (PBI-001 / RNF)
db.pragma('journal_mode = WAL');

initDB();

// ─────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('✔ API del Punto de Venta SOFT POS® funcionando');
});


// ─────────────────────────────────────────────────────────────────
// GET /api/productos/:codigo  —  PBI-006
// Busca un producto por su código de barras EAN-13.
// Devuelve los campos en el formato exacto que espera ventas.html.
// ─────────────────────────────────────────────────────────────────
app.get('/api/productos/:codigo', (req, res) => {
  try {
    const { codigo } = req.params;

    const producto = db.prepare(
      'SELECT id, codigo_barras, nombre, precio_venta, existencia FROM Producto WHERE codigo_barras = ?'
    ).get(codigo);

    if (!producto) {
      return res.status(404).json({
        mensaje: `Código [${codigo}] no registrado en la base de datos.`
      });
    }

    // Normalizar nombres de campo para el frontend
    res.json({
      id:     producto.id,
      codigo: producto.codigo_barras,
      nombre: producto.nombre,
      precio: producto.precio_venta,
      stock:  producto.existencia,
    });

  } catch (err) {
    console.error('[GET /api/productos]', err.message);
    res.status(500).json({ mensaje: 'Error al consultar producto.', detalle: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────
// POST /api/ventas  —  PBI-021
//
// Recibe del frontend:
//   { total, pago, cambio, cajero,
//     productos: [{ codigo, cantidad, precio_unitario, subtotal }] }
//
// Flujo de la transacción:
//   1. Pre-validación de stock
//   2. BEGIN (automático via better-sqlite3 .transaction())
//   3. INSERT en Ventas
//   4. INSERT en Detalle_Ventas (los TRIGGERS hacen el resto:
//        · actualizar_stock_post_venta  → descuenta existencia en Producto
//        · registrar_movimiento_venta   → inserta en Movimiento_Inventario)
//   5. COMMIT / ROLLBACK automático
// ─────────────────────────────────────────────────────────────────
app.post('/api/ventas', (req, res) => {
  const { total, pago, cambio, cajero, productos } = req.body;

  // ── 1. Validación básica del payload ──────────────────────────
  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ mensaje: 'El carrito no puede estar vacío.' });
  }
  if (typeof total !== 'number' || total <= 0) {
    return res.status(400).json({ mensaje: 'El total recibido no es válido.' });
  }

  // Derivar subtotal e impuestos a partir del total (IVA 13%)
  const subtotal  = parseFloat((total / 1.13).toFixed(2));
  const impuestos = parseFloat((total - subtotal).toFixed(2));

  // ── 2. Pre-validación de stock ────────────────────────────────
  // Se realiza ANTES de abrir la transacción para poder devolver
  // una respuesta descriptiva sin necesidad de un ROLLBACK.
  const sinStock = [];

  for (const item of productos) {
    // Buscar por código de barras; si falla, buscar por id numérico
    // (compatibilidad con productos del mockup de la UI)
    const prod = db.prepare(
      `SELECT id, nombre, existencia
       FROM Producto
       WHERE codigo_barras = ? OR CAST(id AS TEXT) = ?`
    ).get(String(item.codigo), String(item.codigo));

    if (!prod) {
      return res.status(400).json({
        tipo:    'PRODUCTO_NO_ENCONTRADO',
        mensaje: `Producto con código "${item.codigo}" no existe en la base de datos.`,
      });
    }

    if (prod.existencia - item.cantidad < 0) {
      sinStock.push({
        codigo:           item.codigo,
        nombre:           prod.nombre,
        stock_disponible: prod.existencia,
        cantidad_pedida:  item.cantidad,
        deficit:          item.cantidad - prod.existencia,
      });
    }
  }

  // Bloqueo de stock — cajero no puede vender en negativo (PBI-021 regla de negocio)
  if (sinStock.length > 0) {
    return res.status(400).json({
      tipo:               'STOCK_INSUFICIENTE',
      mensaje:            'Uno o más productos no tienen suficiente existencia.',
      productos_sin_stock: sinStock,
    });
  }

  // ── 3. Transacción ACID ───────────────────────────────────────
  const ejecutarVenta = db.transaction(() => {

    // 3a. INSERT en Ventas
    const { lastInsertRowid: id_venta } = db.prepare(
      `INSERT INTO Ventas (fecha, subtotal, impuestos, total, efectivo_recibido, cambio)
       VALUES (datetime('now','localtime'), @subtotal, @impuestos, @total, @pago, @cambio)`
    ).run({ subtotal, impuestos, total, pago: pago || 0, cambio: cambio || 0 });

    // 3b. INSERT en Detalle_Ventas — los TRIGGERS manejan el resto
    const stmtDetalle = db.prepare(
      `INSERT INTO Detalle_Ventas (venta_id, producto_id, cantidad, precio_unitario)
       VALUES (@venta_id, @producto_id, @cantidad, @precio_unitario)`
    );

    for (const item of productos) {
      const prod = db.prepare(
        `SELECT id FROM Producto WHERE codigo_barras = ? OR CAST(id AS TEXT) = ?`
      ).get(String(item.codigo), String(item.codigo));

      stmtDetalle.run({
        venta_id:        id_venta,
        producto_id:     prod.id,
        cantidad:        item.cantidad,
        precio_unitario: item.precio_unitario,
      });
    }

    return id_venta;
  });

  // ── 4. Ejecutar y responder ───────────────────────────────────
  try {
    const id_venta = ejecutarVenta();
    console.log(`✔ Venta #${id_venta} registrada. Total: $${total.toFixed(2)} | Cajero: ${cajero || 'N/A'}`);
    return res.status(200).json({
      mensaje:  'Venta registrada exitosamente.',
      id_venta: id_venta,
    });

  } catch (err) {
    // better-sqlite3 hace ROLLBACK automático al lanzar la excepción
    console.error('[POST /api/ventas] Rollback ejecutado:', err.message);
    return res.status(500).json({
      mensaje: 'Error interno. La transacción fue revertida automáticamente.',
      detalle: err.message,
    });
  }
});


// ─────────────────────────────────────────────────────────────────
// INICIO DEL SERVIDOR
// ─────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✔ Servidor SOFT POS® corriendo en http://localhost:${PORT}`);
  console.log(`  Acceso desde la LAN: http://<TU_IP_LOCAL>:${PORT}`);
  console.log(`  Endpoints activos:`);
  console.log(`    GET  /api/productos/:codigo`);
  console.log(`    POST /api/ventas\n`);
});
