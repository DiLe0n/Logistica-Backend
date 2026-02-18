const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RegistroService {
  async crearRegistro(data) {
    try {
      const resultado_final = data.resultado_final || data;

      // Parsear fecha
      const fechaHora = this.parsearFecha(resultado_final.fecha_hora);

      // Buscar tracto en inventario por ECO
      let tracto = null;
      if (resultado_final.eco_tracto) {
        tracto = await prisma.inventario.findUnique({
          where: { eco: resultado_final.eco_tracto }
        });
      }

      // Crear el registro principal
      const registro = await prisma.registro.create({
        data: {
          fechaHora,
          tractoId: tracto?.id,
          ecoTracto: resultado_final.eco_tracto,
          placaTracto: resultado_final.placa_tracto,
          operacion: resultado_final.operacion,
          operador: resultado_final.operador,
          destino: resultado_final.destino,
          cartasPorte: resultado_final.cartas_porte,
          estatus: resultado_final.estatus,
          dollySistema: resultado_final.dolly_sistema,
          generador: resultado_final.generador,
          observaciones: resultado_final.observaciones,
          jsonCompleto: data
        }
      });

      // Procesar equipos
      if (resultado_final.equipo && Array.isArray(resultado_final.equipo)) {
        for (const equipoData of resultado_final.equipo) {
          // Buscar chasis en inventario por ECO
          let chasis = null;
          if (equipoData.chasis) {
            chasis = await prisma.inventario.findUnique({
              where: { eco: equipoData.chasis }
            });
          }

          // Crear equipo
          const equipo = await prisma.equipo.create({
            data: {
              contenedor: equipoData.contenedor,
              chasisId: chasis?.id,
              tipo: equipoData.tipo_bd,
              placa: equipoData.placas_bd
            }
          });

          // Relacionar registro con equipo
          await prisma.registroEquipo.create({
            data: {
              registroId: registro.id,
              equipoId: equipo.id
            }
          });
        }
      }

      return await this.obtenerRegistroCompleto(registro.id);
    } catch (error) {
      console.error('Error al crear registro:', error);
      throw error;
    }
  }

  async obtenerRegistroCompleto(id) {
    return await prisma.registro.findUnique({
      where: { id },
      include: {
        tracto: true,
        equipos: {
          include: {
            equipo: {
              include: {
                chasis: true
              }
            }
          }
        }
      }
    });
  }

  parsearFecha(fechaString) {
    // Formato: "16/2/2026, 10:52:00" (día/mes/año)
    const [fecha, hora] = fechaString.split(', ');
    const [dia, mes, año] = fecha.split('/');
    return new Date(`${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${hora}`);
  }

  async listarRegistros(filtros = {}) {
    const { page = 1, limit = 50, operacion, operador, fechaInicio, fechaFin } = filtros;
    
    const where = {};
    if (operacion) where.operacion = { contains: operacion, mode: 'insensitive' };
    if (operador) where.operador = { contains: operador, mode: 'insensitive' };
    if (fechaInicio || fechaFin) {
      where.fechaHora = {};
      if (fechaInicio) where.fechaHora.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaHora.lte = new Date(fechaFin);
    }

    const [registros, total] = await Promise.all([
      prisma.registro.findMany({
        where,
        include: {
          tracto: true,
          equipos: {
            include: {
              equipo: {
                include: { chasis: true }
              }
            }
          }
        },
        orderBy: { fechaHora: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.registro.count({ where })
    ]);

    return {
      registros,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new RegistroService();