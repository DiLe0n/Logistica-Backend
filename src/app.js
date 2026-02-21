const express = require('express');
const cors = require('cors');
require('dotenv').config();

const registrosRoutes = require('./routes/registros');
const authRoutes = require('./routes/auth');
const inventarioRoutes = require('./routes/inventario');

const app = express();

// CORS - permite requests desde tu frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // En producción especifica la URL de tu front
  credentials: true
}));

app.use(express.json());

// Rutas
app.use('/api/registros', registrosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventario', inventarioRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { // Escucha en todas las interfaces
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;