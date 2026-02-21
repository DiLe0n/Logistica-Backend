const express = require('express');
const router = express.Router();
const registroController = require('../controllers/registroController');
const { authenticateToken } = require('../middleware/auth');

// Ruta pública para n8n
router.post('/webhook', registroController.crearRegistro);

// Rutas protegidas
router.get('/', authenticateToken, registroController.listarRegistros);
router.get('/:id', authenticateToken, registroController.obtenerRegistro);
router.put('/:id', authenticateToken, registroController.actualizarRegistro);
router.delete('/:id', authenticateToken, registroController.eliminarRegistro);

module.exports = router;