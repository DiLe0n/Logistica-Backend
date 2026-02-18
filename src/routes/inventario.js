const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', inventarioController.listarInventario);
router.get('/:eco', inventarioController.obtenerPorEco);
router.post('/sincronizar', inventarioController.sincronizarGoogleSheets);

module.exports = router;