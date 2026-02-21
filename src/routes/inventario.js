const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', inventarioController.listarInventario);
router.get('/:eco', inventarioController.obtenerPorEco);
router.post('/', inventarioController.crearInventario);
router.put('/:id', inventarioController.actualizarInventario);
router.delete('/:id', inventarioController.eliminarInventario);
router.post('/sincronizar', inventarioController.sincronizarGoogleSheets);

module.exports = router;