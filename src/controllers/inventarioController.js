const { PrismaClient } = require('@prisma/client');
const googleSheetsService = require('../services/googleSheetsService');
const prisma = new PrismaClient();

exports.listarInventario = async (req, res) => {
  try {
    const { tipo, eco, page, limit } = req.query;
    
    const where = {};
    if (tipo) where.tipo = { contains: tipo, mode: 'insensitive' };
    if (eco) where.eco = { contains: eco, mode: 'insensitive' };

const queryOptions = {
      where,
      orderBy: { eco: 'asc' }
    };

    if (limit) {
     const parsedLimit = parseInt(limit);
     const parsedPage = parseInt(page) || 1;
     queryOptions.skip = (parsedPage - 1) * parsedLimit;
     queryOptions.take = parsedLimit;
    }

    const [inventario, total] = await Promise.all([
      prisma.inventario.findMany(queryOptions),
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

exports.crearInventario = async (req, res) => {
  try {
    const { eco, tipo, placas, marca, modelo, tipoDetalle, enPatio } = req.body;

    if (!eco || !tipo) {
      return res.status(400).json({
        success: false,
        error: 'ECO y TIPO son campos requeridos'
      });
    }

    const inventario = await prisma.inventario.create({
      data: {
        eco,
        tipo,
        placas: placas || null,
        marca: marca || null,
        modelo: modelo || null,
        tipoDetalle: tipoDetalle || null,
        enPatio: enPatio !== undefined ? enPatio : true
      }
    });

    res.status(201).json({
      success: true,
      data: inventario
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'El ECO ya existe en el inventario'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.actualizarInventario = async (req, res) => {
  try {
    const { id } = req.params;
    const { eco, tipo, placas, marca, modelo, tipoDetalle, enPatio } = req.body;

    const inventarioExistente = await prisma.inventario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!inventarioExistente) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    const inventario = await prisma.inventario.update({
      where: { id: parseInt(id) },
      data: {
        eco: eco || inventarioExistente.eco,
        tipo: tipo || inventarioExistente.tipo,
        placas: placas !== undefined ? placas : inventarioExistente.placas,
        marca: marca !== undefined ? marca : inventarioExistente.marca,
        modelo: modelo !== undefined ? modelo : inventarioExistente.modelo,
        tipoDetalle: tipoDetalle !== undefined ? tipoDetalle : inventarioExistente.tipoDetalle,
        enPatio: enPatio !== undefined ? enPatio : inventarioExistente.enPatio,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: inventario
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'El ECO ya existe en el inventario'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.eliminarInventario = async (req, res) => {
  try {
    const { id } = req.params;

    const inventarioExistente = await prisma.inventario.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipos: true,
        registros: true
      }
    });

    if (!inventarioExistente) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Verificar si tiene relaciones
    if (inventarioExistente.equipos.length > 0 || inventarioExistente.registros.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar esta unidad porque tiene registros asociados'
      });
    }

    await prisma.inventario.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Unidad eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};