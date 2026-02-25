const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', equipoController.listarEquipos);
router.get('/:id', equipoController.obtenerEquipo);
router.post('/', equipoController.crearEquipo);
router.put('/:id', equipoController.actualizarEquipo);
router.delete('/:id', equipoController.eliminarEquipo);

module.exports = router;
