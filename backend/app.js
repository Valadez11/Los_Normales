const express = require('express');
const cors = require('cors');
const { initDB, db } = require('./database/db'); // 1. Importas la conexión

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDB(); 

app.get('/', (req, res) => {
  res.send('API del Punto de Venta funcionando');
});


// Ruta para probar que el motor funciona
app.get('/probar-db', (req, res) => {
  try {
    // Intentamos insertar un producto de prueba
    const insert = db.prepare('INSERT INTO Producto (codigo_barras, nombre, precio_venta, existencia) VALUES (?, ?, ?, ?)');
    insert.run('123456', 'Refresco de Cola', 15.50, 100);
    
    // Consultamos para ver si se guardó
    const productos = db.prepare('SELECT * FROM Producto').all();
    res.json({ mensaje: "¡Conexión exitosa!", productos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
