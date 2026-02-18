const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.registro = async (req, res) => {
  try {
    const { username, password, numeroCelular, numeroTrabajador } = req.body;

    // Validar campos requeridos
    if (!username || !password || !numeroTrabajador) {
      return res.status(400).json({
        success: false,
        error: 'Username, password y número de trabajador son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { username }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya existe'
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        username,
        passwordHash,
        numeroCelular: numeroCelular || null,
        numeroTrabajador
      },
      select: {
        id: true,
        username: true,
        numeroCelular: true,
        numeroTrabajador: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username y password son requeridos'
      });
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { username }
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        username: usuario.username,
        numeroTrabajador: usuario.numeroTrabajador
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        usuario: {
          id: usuario.id,
          username: usuario.username,
          numeroCelular: usuario.numeroCelular,
          numeroTrabajador: usuario.numeroTrabajador
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.perfil = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        username: true,
        numeroCelular: true,
        numeroTrabajador: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};