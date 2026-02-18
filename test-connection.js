const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a PostgreSQL exitosa');
    
    // Probar una consulta
    const count = await prisma.usuario.count();
    console.log(`📊 Usuarios en la BD: ${count}`);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();