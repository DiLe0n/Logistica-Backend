const { PrismaClient } = require('@prisma/client');
const googleSheetsService = require('../services/googleSheetsService');
const prisma = new PrismaClient();

exports.listarInventario = async (req, res) => {
  try {
    const { tipo, eco, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (tipo) where.tipo = { contains: tipo, mode: 'insensitive' };
    if (eco) where.eco = { contains: eco, mode: 'insensitive' };

    const [inventario, total] = await Promise.all([
      prisma.inventario.findMany({
        where,
        orderBy: { eco: 'asc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.inventario.count({ where })
    ]);

    res.json({
      success: true,
      data: inventario,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.sincronizarGoogleSheets = async (req, res) => {
  try {
    const resultado = await googleSheetsService.sincronizarInventario();
    res.json({
      success: true,
      mensaje: 'Sincronización completada',
      ...resultado
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.obtenerPorEco = async (req, res) => {
  try {
    const { eco } = req.params;
    const unidad = await prisma.inventario.findUnique({
      where: { eco }
    });

    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    res.json({
      success: true,
      data: unidad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};