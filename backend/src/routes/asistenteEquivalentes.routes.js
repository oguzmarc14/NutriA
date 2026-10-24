const express = require('express')
const mongoose = require('mongoose')
const Alimento = require('../models/Alimento')
const Pacientes = require('../models/Pacientes')
const Calculo = require('../models/CalculoNutricional')
const Expediente = require('../models/ExpedienteClinico')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')

const router = express.Router()
router.use(requireAuth, allowRoles('nutritionist'))

// No se infieren equivalentes SMAE a partir de calorías ni de porciones genéricas.
// Solo se presentan alimentos con equivalencia y procedencia explícitamente verificadas.
router.get('/:pacienteId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.pacienteId)) {
      return res.status(400).json({ message: 'Paciente inválido' })
    }
    const paciente = await Pacientes.findOne({
      _id: req.params.pacienteId, nutritionist: req.user.id, active: true,
    }).select('_id name').lean()
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' })
    const [calculo, expediente, grupos, alimentos] = await Promise.all([
      Calculo.findOne({ paciente: paciente._id, nutritionist: req.user.id }).sort({ createdAt: -1 }).lean(),
      Expediente.findOne({ paciente: paciente._id, nutritionist: req.user.id }).lean(),
      Alimento.distinct('grupo', { activo: true, revisado: true, 'fuentes.tipoDato': 'equivalencia' }),
      Alimento.find({
        activo: true, revisado: true, equivalentes: { $gt: 0 },
        'fuentes.tipoDato': 'equivalencia',
        'fuentes.nombre': { $exists: true, $ne: '' },
      }).select('nombre grupo subgrupo porcion equivalentes nutrimentos fuentes fechaRevision')
        .sort({ grupo: 1, nombre: 1 }).limit(150).lean(),
    ])
    const seguros = alimentos.filter(a => a.fuentes.some(f => f.tipoDato === 'equivalencia' && f.nombre?.trim() && (f.edicion?.trim() || f.referencia?.trim() || f.identificador?.trim())))
    return res.json({
      paciente, calculoId: calculo?._id || null, metas: calculo?.resultado || null,
      objetivos: expediente?.nutricion?.objetivos || [],
      restricciones: {
        alergias: expediente?.alergias || '',
        intolerancias: expediente?.nutricion?.intoleranciasAlimentarias || '',
      },
      gruposDisponibles: grupos,
      alimentosVerificados: seguros,
      versionCatalogo: 'catalogo-revisado-v1',
      advertencia: 'Los equivalentes y sustituciones requieren revisión profesional. El sistema no prescribe cantidades automáticamente.',
    })
  } catch (error) { next(error) }
})
module.exports = router
