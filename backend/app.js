// RASTREADOR DE ERRORES SILENCIOSOS
process.on('uncaughtException', (err) => {
    console.error('💥 ¡OCURRIÓ UN ERROR CRÍTICO SILENCIOSO! DETALLES EN ROJO ABAJO:');
    console.error(err.stack);
});

const express = require('express');
const cors = require('cors');
const { initDB, db } = require('./database/db'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Inicializar la base de datos
initDB(); 

app.get('/', (req, res) => {
  res.send('API del Punto de Venta funcionando');
});

// 1. RUTA DE PRUEBA: SIEMBRA MASIVA REPARADA
app.get('/probar-db', (req, res) => {
    try {
        // Limpiamos en orden para evitar errores de Foreign Key
        db.prepare('DELETE FROM Detalle_Ventas').run();
        db.prepare('DELETE FROM Ventas').run();
        db.prepare('DELETE FROM Producto').run();
        
        const stmt = db.prepare(`
            INSERT INTO Producto (id, codigo_barras, nombre, precio_venta, existencia)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(1, '123456', 'Coca Cola 355ml', 1.25, 48);
        stmt.run(2, '123457', 'Pepsi 355ml', 1.25, 36);
        stmt.run(3, '123458', 'Agua Ciel 600ml', 0.75, 60);
        stmt.run(4, '123459', 'Jugo Del Valle 500ml', 1.10, 30);
        stmt.run(5, '123460', 'Galletas Oreo 117g', 1.30, 25);
        stmt.run(6, '123461', 'Papas Lays 42g', 1.00, 40);
        stmt.run(7, '123462', 'Chocolate Snickers 50g', 1.15, 50);
        stmt.run(8, '123463', 'Yogurt Danone 125g', 0.65, 35);
        stmt.run(9, '123464', 'Detergente Ariel 1kg', 3.75, 15);
        stmt.run(10, '123465', 'Shampoo H&S 400ml', 4.50, 20);
        stmt.run(11, '123466', 'Papel Higiénico Scott', 2.80, 18);
        stmt.run(12, '123467', 'Pan Bimbo Blanco', 2.25, 22);

        const todosLosProductos = db.prepare('SELECT * FROM Producto').all();

        res.json({
            mensaje: "¡Base de datos limpia y sincronizada con el Frontend!",
            total_productos: todosLosProductos.length
        });
    } catch (err) {
        res.status(500).json({ error: "Error al sembrar el inventario: " + err.message });
    }
});

// ==========================================
// RUTA DE LOGIN
// ==========================================
app.post('/login', (req, res) => {
    const { pin } = req.body;
    try {
        const usuario = db.prepare('SELECT nombre, rol FROM Usuarios WHERE pin = ?').get(pin);
        
        if (usuario) {
            res.json({ mensaje: "Acceso concedido", usuario: usuario.nombre, rol: usuario.rol });
        } else {
            res.status(401).json({ error: "PIN no válido" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

// 3. RUTA PARA AGREGAR O ACTUALIZAR PRODUCTOS
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


// 4. RUTA DE VENTAS MEJORADA DESDE EL BACKEND
app.post('/ventas', (req, res) => {
    const { productos, total } = req.body; 

    console.log("📦 CONTENIDO DEL CARRITO RECIBIDO:", productos);

    if (!productos || productos.length === 0) {
        return res.status(400).json({ error: "El carrito está vacío" });
    }

    try {
        const transaccionVenta = db.transaction(() => {
            // 1. Insertar la cabecera de la venta
            const infoVenta = db.prepare('INSERT INTO Ventas (total) VALUES (?)').run(total);
            const ventaId = infoVenta.lastInsertRowid;

            // Consultas listas para el ciclo
            const buscarDetalle = db.prepare('SELECT cantidad FROM Detalle_Ventas WHERE venta_id = ? AND producto_id = ?');
            const actualizarDetalle = db.prepare('UPDATE Detalle_Ventas SET cantidad = cantidad + ? WHERE venta_id = ? AND producto_id = ?');
            const insertarDetalle = db.prepare('INSERT INTO Detalle_Ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)');

            // 2. Recorrer el carrito
            for (const prod of productos) {
                const cantidadReal = prod.cantidad || 1; // Parche por si viene vacío
                const precioReal = prod.precio || 0.0;
                
                // Comprobamos si el producto ya se metió previamente en esta misma venta
                const filaExiste = buscarDetalle.get(ventaId, prod.id);

                if (filaExiste) {
                    // Si ya existe en la venta actual, sólo sumamos la cantidad
                    actualizarDetalle.run(cantidadReal, ventaId, prod.id);
                } else {
                    // Si es la primera vez que aparece en esta venta, lo insertamos normal
                    insertarDetalle.run(ventaId, prod.id, cantidadReal, precioReal);
                }
            }

            return ventaId;
        });

        const idGenerado = transaccionVenta();
        res.json({ mensaje: "Venta registrada con éxito", venta_id: idGenerado });

    } catch (error) {
        console.error("❌ Error controlado en venta:", error.message);
        res.status(500).json({ 
            error: "La venta no se pudo procesar. Detalle: " + error.message 
        });
    }
});
// MODIFICACIÓN PARA IMPRIMIR EL PUERTO REAL
app.listen(PORT, '127.0.0.1', () => {
    console.log(`==================================================`);
    console.log(`🚀 SERVIDOR DESPIERTO Y ESCUCHANDO REALMENTE EN:`);
    console.log(`👉 http://127.0.0.1:${PORT}`);
    console.log(`==================================================`);
});

