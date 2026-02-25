const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RegistroService {
  async crearRegistro(data) {
    try {
      const resultado_final = data.resultado_final || data.registro_final || data.registro || data;

      // Parsear fecha
      const fechaHora = this.parsearFecha(resultado_final.fecha_hora);

      // Determinar si es entrada o salida
      const operacion = resultado_final.operacion || '';
      const esEntrada = operacion.toUpperCase().includes('ENTRADA');
      const esSalida = operacion.toUpperCase().includes('SALIDA');
      const nuevoEstadoPatio = esEntrada ? true : (esSalida ? false : null);

      // Buscar tracto en inventario por ECO
      let tracto = null;
      if (resultado_final.eco_tracto) {
        tracto = await prisma.inventario.findUnique({
          where: { eco: resultado_final.eco_tracto }
        });

        // Actualizar estado del tracto si corresponde
        if (tracto && nuevoEstadoPatio !== null) {
          await prisma.inventario.update({
            where: { id: tracto.id },
            data: { enPatio: nuevoEstadoPatio }
          });
        }

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

            // Actualizar estado del chasis si corresponde
            if (chasis && nuevoEstadoPatio !== null) {
              await prisma.inventario.update({
                where: { id: chasis.id },
                data: { enPatio: nuevoEstadoPatio }
              });
            }
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

      // Actualizar dolly si existe
      if (resultado_final.dolly_sistema && resultado_final.dolly_sistema !== 'N/A' && nuevoEstadoPatio !== null) {
        const dolly = await prisma.inventario.findUnique({
          where: { eco: resultado_final.dolly_sistema }
        });

        if (dolly) {
          await prisma.inventario.update({
            where: { id: dolly.id },
            data: { enPatio: nuevoEstadoPatio }
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
   if (!fechaString) {
     return new Date(); // Si no viene fecha, usa fecha actual
   }
  
   try {
     // Formato: "16/2/2026, 10:52:00" (día/mes/año)
     const [fecha, hora] = fechaString.split(', ');
     const [dia, mes, año] = fecha.split('/');
     return new Date(`${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${hora}`);
   } catch (error) {
     console.error('Error parseando fecha:', fechaString, error);
     return new Date(); // Fallback a fecha actual
   }
 }

  async listarRegistros(filtros = {}) {
    const { page, limit, operacion, operador, fechaInicio, fechaFin } = filtros;
    
    const where = {};
    if (operacion) where.operacion = { contains: operacion, mode: 'insensitive' };
    if (operador) where.operador = { contains: operador, mode: 'insensitive' };
    if (fechaInicio || fechaFin) {
      where.fechaHora = {};
      if (fechaInicio) where.fechaHora.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaHora.lte = new Date(fechaFin);
    }

const queryOptions = {
    where,
    include: {
      tracto: true,
      equipos: {
        include: {
          equipo: { include: { chasis: true } }
        }
      }
    },
    orderBy: { fechaHora: 'desc' }
  };

  // Solo agregar paginación si se especifica
  if (limit) {
    queryOptions.skip = page ? (page - 1) * limit : 0;
    queryOptions.take = parseInt(limit);
  }

    const [registros, total] = await Promise.all([
      prisma.registro.findMany(queryOptions),
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

  async actualizarRegistro(id, data) {
  try {
    // Verificar si existe
    const registroExistente = await prisma.registro.findUnique({
      where: { id }
    });

    if (!registroExistente) {
      return null;
    }

    // Actualizar campos básicos
    const registroActualizado = await prisma.registro.update({
      where: { id },
      data: {
	fechaHora: data.fechaHora ? new Date(data.fechaHora) : registroExistente.fechaHora,
	ecoTracto: data.ecoTracto,
	placaTracto: data.placaTracto,
        operacion: data.operacion,
        operador: data.operador,
        destino: data.destino,
        cartasPorte: data.cartasPorte,
        estatus: data.estatus,
        dollySistema: data.dollySistema,
        generador: data.generador,
        observaciones: data.observaciones,
        updatedAt: new Date()
      }
    });

    return await this.obtenerRegistroCompleto(id);
  } catch (error) {
    console.error('Error al actualizar registro:', error);
    throw error;
  }
}

async eliminarRegistro(id) {
  try {
    const registroExistente = await prisma.registro.findUnique({
      where: { id }
    });

    if (!registroExistente) {
      return null;
    }

    // Prisma automáticamente elimina las relaciones en registros_equipos por onDelete: Cascade
    await prisma.registro.delete({
      where: { id }
    });

    return true;
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    throw error;
  }
}
}



module.exports = new RegistroService();

