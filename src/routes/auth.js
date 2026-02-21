const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.get('/perfil', authenticateToken, authController.perfil);

// CRUD de usuarios (solo para admins)
router.get('/usuarios', authenticateToken, authController.listarUsuarios);
router.get('/usuarios/:id', authenticateToken, authController.obtenerUsuario);
router.put('/usuarios/:id', authenticateToken, authController.actualizarUsuario);
router.delete('/usuarios/:id', authenticateToken, authController.eliminarUsuario);

module.exports = router;