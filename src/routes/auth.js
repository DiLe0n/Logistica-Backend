const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.get('/perfil', authenticateToken, authController.perfil);

module.exports = router;