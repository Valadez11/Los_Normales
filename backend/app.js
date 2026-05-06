const express = require('express');
const cors = require('cors');
const { initDB, db } = require('./database/db'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDB(); 

app.get('/', (req, res) => {
  res.send('API del Punto de Venta funcionando');
});

// 1. RUTA DE PRUEBA (Modificada para evitar errores de duplicado)
app.get('/probar-db', (req, res) => {
  try {
    // Usamos INSERT OR IGNORE para que no truene si el código 123456 ya existe
    const insert = db.prepare('INSERT OR IGNORE INTO Producto (codigo_barras, nombre, precio_venta, existencia) VALUES (?, ?, ?, ?)');
    insert.run('123456', 'Refresco de Cola', 15.50, 100);
    
    const productos = db.prepare('SELECT * FROM Producto').all();
    res.json({ mensaje: "¡Motor listo!", productos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AQUÍ EMPIEZAN LOS CAMBIOS NUEVOS ---

// 2. RUTA DE BÚSQUEDA (Para el lector de barras)
app.get('/productos/:codigo', (req, res) => {
    const { codigo } = req.params;
    try {
        const producto = db.prepare('SELECT * FROM Producto WHERE codigo_barras = ?').get(codigo);
        if (producto) {
            res.json(producto);
        } else {
            res.status(404).json({ error: "Producto no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. RUTA PARA AGREGAR O ACTUALIZAR PRODUCTOS
app.post('/productos', (req, res) => {
    const { codigo_barras, nombre, precio_venta, existencia } = req.body;

    try {
        const stmt = db.prepare(`
            INSERT INTO Producto (codigo_barras, nombre, precio_venta, existencia)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(codigo_barras) DO UPDATE SET
                nombre = excluded.nombre,
                precio_venta = excluded.precio_venta,
                existencia = Producto.existencia + excluded.existencia
        `);
        
        stmt.run(codigo_barras, nombre, precio_venta, existencia);
        res.json({ mensaje: "Producto registrado/actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/ventas', (req, res) => {
    const { producto_id, cantidad, precio_unitario } = req.body;

    const crearVenta = db.transaction(() => {
        // A. Registrar la cabecera
        const total = cantidad * precio_unitario;
        const infoVenta = db.prepare('INSERT INTO Ventas (total) VALUES (?)').run(total);
        const ventaId = infoVenta.lastInsertRowid;

        // B. Registrar detalle (Esto dispara el descuento de stock automático)
        const stmtDetalle = db.prepare(`
            INSERT INTO Detalle_Ventas (venta_id, producto_id, cantidad, precio_unitario)
            VALUES (?, ?, ?, ?)
        `);
        stmtDetalle.run(ventaId, producto_id, cantidad, precio_unitario);

        return ventaId;
    });

    try {
        const idGenerado = crearVenta();
        res.json({ mensaje: "Venta registrada con éxito", venta_id: idGenerado });
    } catch (error) {
        res.status(500).json({ error: "Error en la venta: " + error.message });
    }
});

// --- FIN DE LOS CAMBIOS ---

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});