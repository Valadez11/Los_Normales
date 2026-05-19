const express = require('express');
const cors = require('cors');
const { initDB, db } = require('./database/db');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Modo WAL: mejora la concurrencia para 2 dispositivos (PBI-001 / RNF)
db.pragma('journal_mode = WAL');

initDB();

// ─────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('✔ API del Punto de Venta SOFT POS® funcionando');
});

// ─────────────────────────────────────────────────────────────────
// PRUEBA DE BD — Alfonso
// ─────────────────────────────────────────────────────────────────
app.get('/probar-db', (req, res) => {
  try {
    const insertProd = db.prepare('INSERT OR IGNORE INTO Producto (codigo_barras, nombre, precio_venta, existencia) VALUES (?, ?, ?, ?)');
    insertProd.run('123456', 'Refresco de Cola', 15.50, 100);

    const insertUsuario = db.prepare('INSERT OR IGNORE INTO Usuarios (nombre, pin, rol) VALUES (?, ?, ?)');
    insertUsuario.run('Admin', '1234', 'ADMIN');

    const productos = db.prepare('SELECT * FROM Producto').all();
    const usuarios  = db.prepare('SELECT nombre, rol FROM Usuarios').all();
    res.json({ mensaje: '¡Motor listo!', productos, usuarios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// LOGIN — Alfonso (PBI-002 autenticación real)
// POST /login  { pin }  →  { usuario, rol }
// ─────────────────────────────────────────────────────────────────
app.post('/login', (req, res) => {
  const { pin } = req.body;
  try {
    const usuario = db.prepare('SELECT nombre, rol FROM Usuarios WHERE pin = ?').get(pin);
    if (usuario) {
      res.json({ mensaje: 'Acceso concedido', usuario: usuario.nombre, rol: usuario.rol });
    } else {
      res.status(401).json({ error: 'PIN no válido' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/productos/:codigo — PBI-006
// Busca por EAN-13. Devuelve campos normalizados para ventas.html.
// ─────────────────────────────────────────────────────────────────
app.get('/api/productos/:codigo', (req, res) => {
  try {
    const { codigo } = req.params;
    const producto = db.prepare(
      'SELECT id, codigo_barras, nombre, precio_venta, existencia FROM Producto WHERE codigo_barras = ?'
    ).get(codigo);

    if (!producto) {
      return res.status(404).json({ mensaje: `Código [${codigo}] no registrado en la base de datos.` });
    }

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
// GET /productos/:codigo — Alfonso (versión raw, compatible)
// ─────────────────────────────────────────────────────────────────
app.get('/productos/:codigo', (req, res) => {
  const { codigo } = req.params;
  try {
    const producto = db.prepare('SELECT * FROM Producto WHERE codigo_barras = ?').get(codigo);
    if (producto) {
      res.json(producto);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /productos — Alfonso (alta / actualización de producto)
// ─────────────────────────────────────────────────────────────────
app.post('/productos', (req, res) => {
  const { codigo_barras, nombre, precio_venta, existencia } = req.body;
  try {
    db.prepare(`
      INSERT INTO Producto (codigo_barras, nombre, precio_venta, existencia)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(codigo_barras) DO UPDATE SET
        nombre       = excluded.nombre,
        precio_venta = excluded.precio_venta,
        existencia   = Producto.existencia + excluded.existencia
    `).run(codigo_barras, nombre, precio_venta, existencia);
    res.json({ mensaje: 'Producto registrado/actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/ventas — PBI-021
// Transacción ACID completa con validación de stock.
// Los TRIGGERS de SQLite manejan: descuento de existencia + Movimiento_Inventario.
//
// Body: { total, pago, cambio, cajero,
//         productos: [{ codigo, cantidad, precio_unitario }] }
// ─────────────────────────────────────────────────────────────────
app.post('/api/ventas', (req, res) => {
  const { total, pago, cambio, cajero, productos } = req.body;

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ mensaje: 'El carrito no puede estar vacío.' });
  }
  if (typeof total !== 'number' || total <= 0) {
    return res.status(400).json({ mensaje: 'El total recibido no es válido.' });
  }

  const subtotal  = parseFloat((total / 1.13).toFixed(2));
  const impuestos = parseFloat((total - subtotal).toFixed(2));

  // Pre-validación de stock (antes de abrir transacción)
  const sinStock = [];
  for (const item of productos) {
    const prod = db.prepare(
      `SELECT id, nombre, existencia FROM Producto
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
      });
    }
  }

  if (sinStock.length > 0) {
    return res.status(400).json({
      tipo:               'STOCK_INSUFICIENTE',
      mensaje:            'Uno o más productos no tienen suficiente existencia.',
      productos_sin_stock: sinStock,
    });
  }

  // Transacción ACID
  const ejecutarVenta = db.transaction(() => {
    const { lastInsertRowid: id_venta } = db.prepare(
      `INSERT INTO Ventas (fecha, subtotal, impuestos, total, efectivo_recibido, cambio)
       VALUES (datetime('now','localtime'), @subtotal, @impuestos, @total, @pago, @cambio)`
    ).run({ subtotal, impuestos, total, pago: pago || 0, cambio: cambio || 0 });

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

  try {
    const id_venta = ejecutarVenta();
    console.log(`✔ Venta #${id_venta} | Total: $${total.toFixed(2)} | Cajero: ${cajero || 'N/A'}`);
    return res.status(200).json({ mensaje: 'Venta registrada exitosamente.', id_venta });
  } catch (err) {
    console.error('[POST /api/ventas] Rollback:', err.message);
    return res.status(500).json({
      mensaje: 'Error interno. La transacción fue revertida.',
      detalle: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// INICIO DEL SERVIDOR
// ─────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✔ Servidor SOFT POS® en http://localhost:${PORT}`);
  console.log(`  Endpoints:`);
  console.log(`    GET  /api/productos/:codigo  (PBI-006)`);
  console.log(`    POST /api/ventas             (PBI-021)`);
  console.log(`    POST /login                  (autenticación)\n`);
});
