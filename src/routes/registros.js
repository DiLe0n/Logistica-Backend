const express = require('express');
const router = express.Router();
const registroController = require('../controllers/registroController');
const { authenticateToken } = require('../middleware/auth');

// Ruta pública para n8n (considera usar un API key)
router.post('/webhook', registroController.crearRegistro);

// Rutas protegidas
router.get('/', authenticateToken, registroController.listarRegistros);
router.get('/:id', authenticateToken, registroController.obtenerRegistro);

module.exports = router;