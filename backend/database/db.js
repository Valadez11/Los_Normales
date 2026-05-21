const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'pos_system.db'));
db.pragma('foreign_keys = ON');

const initDB = () => {
  const schema = `
    -- 1. TABLAS
    CREATE TABLE IF NOT EXISTS Producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_barras TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      precio_venta REAL NOT NULL,
      existencia REAL DEFAULT 0
    );

    -- ⚠️ ¡ESTA ES LA TABLA QUE TE FALTABA!
    CREATE TABLE IF NOT EXISTS Usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      pin TEXT UNIQUE NOT NULL,
      rol TEXT CHECK(rol IN ('ADMIN', 'CAJERO')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Detalle_Ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      FOREIGN KEY (venta_id) REFERENCES Ventas(id),
      FOREIGN KEY (producto_id) REFERENCES Producto(id)
    );

    CREATE TABLE IF NOT EXISTS Movimiento_Inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      tipo TEXT CHECK(tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
      cantidad REAL NOT NULL,
      motivo TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producto_id) REFERENCES Producto(id)
    );

    -- 2. TRIGGERS (DISPARADORES)
    CREATE TRIGGER IF NOT EXISTS actualizar_stock_post_venta
    AFTER INSERT ON Detalle_Ventas
    BEGIN
        UPDATE Producto 
        SET existencia = existencia - NEW.cantidad
        WHERE id = NEW.producto_id;
    END;

    CREATE TRIGGER IF NOT EXISTS registrar_movimiento_venta
    AFTER INSERT ON Detalle_Ventas
    BEGIN
        INSERT INTO Movimiento_Inventario (producto_id, tipo, cantidad, motivo)
        VALUES (NEW.producto_id, 'SALIDA', NEW.cantidad, 'Venta registrada');
    END;

    CREATE TABLE IF NOT EXISTS Usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    pin TEXT UNIQUE NOT NULL,
    rol TEXT DEFAULT 'CAJERO'
);
  `;

  try {
    db.exec(schema);
    console.log("✅ Base de datos, Tablas y Triggers configurados con éxito.");
  } catch (err) {
    console.error("❌ Error al inicializar la base de datos:", err.message);
  }

  // Migración: columnas adicionales en Ventas (se ignoran si ya existen)
  const migracionesVentas = [
    'ALTER TABLE Ventas ADD COLUMN subtotal REAL',
    'ALTER TABLE Ventas ADD COLUMN impuestos REAL',
    'ALTER TABLE Ventas ADD COLUMN efectivo_recibido REAL',
    'ALTER TABLE Ventas ADD COLUMN cambio REAL',
  ];
  for (const sql of migracionesVentas) {
    try { db.exec(sql); } catch (_) { /* columna ya existe — ignorar */ }
  }
};

module.exports = { db, initDB };