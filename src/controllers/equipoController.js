const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.listarEquipos = async (req, res) => {
  try {
    const { registroId } = req.query;
    
    const where = {};
    if (registroId) {
      where.registros = {
        some: { registroId: parseInt(registroId) }
      };
    }

    const equipos = await prisma.equipo.findMany({
      where,
      include: {
        chasis: true,
        registros: {
          include: {
            registro: {
              select: {
                id: true,
                fechaHora: true,
                operacion: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: equipos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.obtenerEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const equipo = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
      include: {
        chasis: true,
        registros: {
          include: {
            registro: true
          }
        }
      }
    });

    if (!equipo) {
      return res.status(404).json({
        success: false,
        error: 'Equipo no encontrado'
      });
    }

    res.json({
      success: true,
      data: equipo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.crearEquipo = async (req, res) => {
  try {
    const { contenedor, chasisEco, tipo, placa, registroId } = req.body;

    if (!contenedor) {
      return res.status(400).json({
        success: false,
        error: 'El contenedor es requerido'
      });
    }

    // Buscar chasis por ECO si se proporciona
    let chasisId = null;
    if (chasisEco) {
      const chasis = await prisma.inventario.findUnique({
        where: { eco: chasisEco }
      });
      chasisId = chasis?.id;
    }

    const equipo = await prisma.equipo.create({
      data: {
        contenedor,
        chasisId,
        tipo,
        placa
      }
    });

    // Si se proporciona registroId, crear la relación
    if (registroId) {
      await prisma.registroEquipo.create({
        data: {
          registroId: parseInt(registroId),
          equipoId: equipo.id
        }
      });
    }

    const equipoCompleto = await prisma.equipo.findUnique({
      where: { id: equipo.id },
      include: { chasis: true }
    });

    res.status(201).json({
      success: true,
      data: equipoCompleto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.actualizarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenedor, chasisEco, tipo, placa } = req.body;

    const equipoExistente = await prisma.equipo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!equipoExistente) {
      return res.status(404).json({
        success: false,
        error: 'Equipo no encontrado'
      });
    }

    // Buscar chasis por ECO si se proporciona
    let chasisId = equipoExistente.chasisId;
    if (chasisEco !== undefined) {
      if (chasisEco) {
        const chasis = await prisma.inventario.findUnique({
          where: { eco: chasisEco }
        });
        chasisId = chasis?.id || null;
      } else {
        chasisId = null;
      }
    }

    const equipo = await prisma.equipo.update({
      where: { id: parseInt(id) },
      data: {
        contenedor: contenedor !== undefined ? contenedor : equipoExistente.contenedor,
        chasisId,
        tipo: tipo !== undefined ? tipo : equipoExistente.tipo,
        placa: placa !== undefined ? placa : equipoExistente.placa
      },
      include: { chasis: true }
    });

    res.json({
      success: true,
      data: equipo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const equipoExistente = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
      include: { registros: true }
    });

    if (!equipoExistente) {
      return res.status(404).json({
        success: false,
        error: 'Equipo no encontrado'
      });
    }

    // Las relaciones en registros_equipos se eliminan automáticamente por onDelete: Cascade
    await prisma.equipo.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Equipo eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
