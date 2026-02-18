const registroService = require('../services/registroService');

exports.crearRegistro = async (req, res) => {
  try {
    const registro = await registroService.crearRegistro(req.body);
    res.status(201).json({
      success: true,
      data: registro
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.listarRegistros = async (req, res) => {
  try {
    const resultado = await registroService.listarRegistros(req.query);
    res.json({
      success: true,
      ...resultado
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.obtenerRegistro = async (req, res) => {
  try {
    const registro = await registroService.obtenerRegistroCompleto(parseInt(req.params.id));
    if (!registro) {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado'
      });
    }
    res.json({
      success: true,
      data: registro
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};