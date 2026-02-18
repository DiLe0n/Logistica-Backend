const express = require('express');
const cors = require('cors');
require('dotenv').config();

const registrosRoutes = require('./routes/registros');
const authRoutes = require('./routes/auth');
const inventarioRoutes = require('./routes/inventario');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/registros', registrosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventario', inventarioRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;