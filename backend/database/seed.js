// =============================================================================
// SEEDER — Productos de catálogo inicial
// Sincronizado con initialProducts de ventas.html
// Uso: node backend/database/seed.js
// =============================================================================
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'pos_system.db'));

// Los IDs numéricos deben coincidir con los item.id del frontend (1–12)
// Los codigos_barras son EAN-13 reales de cada producto
const productos = [
  { id: 1,  codigo_barras: '7501055300427', nombre: 'Coca Cola 355ml',       precio_venta: 1.25, existencia: 48 },
  { id: 2,  codigo_barras: '7501005102220', nombre: 'Pepsi 355ml',            precio_venta: 1.25, existencia: 36 },
  { id: 3,  codigo_barras: '7501055901513', nombre: 'Agua Ciel 600ml',        precio_venta: 0.75, existencia: 60 },
  { id: 4,  codigo_barras: '7500435118224', nombre: 'Jugo Del Valle 500ml',   precio_venta: 1.10, existencia: 30 },
  { id: 5,  codigo_barras: '7622210100054', nombre: 'Galletas Oreo 117g',     precio_venta: 1.30, existencia: 25 },
  { id: 6,  codigo_barras: '7501014204803', nombre: 'Papas Lays 42g',         precio_venta: 1.00, existencia: 40 },
  { id: 7,  codigo_barras: '0040000022602', nombre: 'Chocolate Snickers 50g', precio_venta: 1.15, existencia: 50 },
  { id: 8,  codigo_barras: '7501055912007', nombre: 'Yogurt Danone 125g',     precio_venta: 0.65, existencia: 35 },
  { id: 9,  codigo_barras: '7500435018265', nombre: 'Detergente Ariel 1kg',   precio_venta: 3.75, existencia: 15 },
  { id: 10, codigo_barras: '7506339310027', nombre: 'Shampoo H&S 400ml',      precio_venta: 4.50, existencia: 20 },
  { id: 11, codigo_barras: '7501039038523', nombre: 'Papel Higiénico Scott',  precio_venta: 2.80, existencia: 18 },
  { id: 12, codigo_barras: '7441029500073', nombre: 'Pan Bimbo Blanco',       precio_venta: 2.25, existencia: 22 },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO Producto (id, codigo_barras, nombre, precio_venta, existencia)
  VALUES (@id, @codigo_barras, @nombre, @precio_venta, @existencia)
`);

const seedAll = db.transaction((prods) => {
  for (const p of prods) insert.run(p);
});

seedAll(productos);

const { total } = db.prepare('SELECT COUNT(*) as total FROM Producto').get();
console.log(`\n✔ Seeder completado. Productos en base de datos: ${total}`);
console.log('  Catálogo listo para procesar ventas.\n');

db.close();
