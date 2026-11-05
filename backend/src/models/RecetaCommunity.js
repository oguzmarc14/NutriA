const mongoose = require('mongoose')

const ingredienteSchema = new mongoose.Schema({
  alimento: { type: mongoose.Schema.Types.ObjectId, ref: 'Alimento', default: null },
  nombre: { type: String, required: true, trim: true, maxlength: 120 },
  cantidad: { type: Number, required: true, min: 0.01 },
  unidad: { type: String, required: true, trim: true, maxlength: 40 },
  gramos: { type: Number, min: 0, default: null },
}, { _id: false })

const recetaSchema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  titulo: { type: String, required: true, trim: true, maxlength: 120 },
  descripcion: { type: String, trim: true, maxlength: 1200, default: '' },
  instrucciones: { type: [String], default: [] },
  ingredientes: { type: [ingredienteSchema], default: [] },
  porciones: { type: Number, required: true, min: 1, max: 100 },
  nutrimentosPorPorcion: {
    kcal: { type: Number, min: 0, default: null },
    proteina: { type: Number, min: 0, default: null },
    carbohidratos: { type: Number, min: 0, default: null },
    grasas: { type: Number, min: 0, default: null },
  },
  etiquetas: { type: [String], default: [] },
  estado: {
    type: String,
    enum: ['privada', 'pendiente', 'publicada', 'rechazada', 'retirada'],
    default: 'privada',
    index: true,
  },
  origen: { type: String, enum: ['comunidad', 'oficial'], default: 'comunidad' },
  revision: {
    revisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fecha: { type: Date, default: null },
    motivo: { type: String, trim: true, maxlength: 500, default: '' },
  },
  publicadaEn: { type: Date, default: null },
}, { timestamps: true })

recetaSchema.index({ estado: 1, publicadaEn: -1 })
recetaSchema.index({ titulo: 'text', descripcion: 'text', etiquetas: 'text' })

module.exports = mongoose.model('RecetaCommunity', recetaSchema)
