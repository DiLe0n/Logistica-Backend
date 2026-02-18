const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
  }

  async authenticate() {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SHEETS_CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    this.auth = await auth.getClient();
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async sincronizarInventario() {
    try {
      if (!this.sheets) await this.authenticate();

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: process.env.GOOGLE_SHEETS_RANGE // Ej: "Hoja1!A2:F"
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('No se encontraron datos en Google Sheets');
        return { success: false, count: 0 };
      }

      let sincronizados = 0;
      let errores = 0;

      // Estructura: ECO | TIPO | Placas | MARCA | MODELO | TIPO
      for (const row of rows) {
        try {
          const [eco, tipo, placas, marca, modelo, tipoDetalle] = row;

          // Validar que al menos tenga ECO y TIPO
          if (!eco || !tipo) {
            console.warn(`Fila omitida - faltan datos obligatorios: ${JSON.stringify(row)}`);
            errores++;
            continue;
          }

          await prisma.inventario.upsert({
            where: { eco: eco.trim() },
            update: {
              tipo: tipo.trim(),
              placas: placas?.trim() || null,
              marca: marca?.trim() || null,
              modelo: modelo?.trim() || null,
              tipoDetalle: tipoDetalle?.trim() || null,
              googleSheetsSync: true,
              updatedAt: new Date()
            },
            create: {
              eco: eco.trim(),
              tipo: tipo.trim(),
              placas: placas?.trim() || null,
              marca: marca?.trim() || null,
              modelo: modelo?.trim() || null,
              tipoDetalle: tipoDetalle?.trim() || null,
              googleSheetsSync: true
            }
          });

          sincronizados++;
        } catch (error) {
          console.error(`Error procesando fila: ${JSON.stringify(row)}`, error);
          errores++;
        }
      }

      console.log(`✅ Sincronización completada: ${sincronizados} registros exitosos, ${errores} errores`);
      return { 
        success: true, 
        sincronizados, 
        errores,
        total: rows.length 
      };
    } catch (error) {
      console.error('Error al sincronizar Google Sheets:', error);
      throw error;
    }
  }

  // Método para sincronización manual desde un endpoint
  async forzarSincronizacion() {
    return await this.sincronizarInventario();
  }

  // Método para obtener datos sin sincronizar (solo lectura)
  async obtenerDatosSheets() {
    try {
      if (!this.sheets) await this.authenticate();

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: process.env.GOOGLE_SHEETS_RANGE
      });

      return response.data.values;
    } catch (error) {
      console.error('Error al leer Google Sheets:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();