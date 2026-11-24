const { modeloPaciente } = require('../config/datosPacientes')
const mongoose = require('mongoose')
const id = mongoose.Schema.Types.ObjectId
const sellerSchema = new mongoose.Schema({
  nutritionist: { type: id, required: true, unique: true },
  merchant: { type: String, required: true, unique: true },
  publicKey: { type: String, required: true },
  credentials: { type: String, required: true, select: false },
  expiresAt: Date,
})
const bookingSchema = new mongoose.Schema({
  _id: String,
  nutritionist: { type: id, required: true },
  patient: { type: id, ref: 'Patient', required: true },
  buyer: { type: id, required: true },
  merchant: { type: String, required: true },
  inicio: Date, fin: Date, zonaHoraria: String, tipo: String, montoCentavos: Number,
  expiresAt: Date,
  nextCheckAt: Date,
  challengeUrl: String,
  challengeRequest: String,
  notifyAt: Date,
  paymentId: { type: String, unique: true, sparse: true },
  cita: id,
  status: { type: String, enum: ['reserved', 'processing', 'confirmed', 'review', 'rejected'], default: 'reserved' },
  changeReason: String,
}, { timestamps: true })
bookingSchema.index({ nutritionist: 1, status: 1, expiresAt: 1, inicio: 1 })
bookingSchema.index({ status: 1, nextCheckAt: 1 })
bookingSchema.index({ notifyAt: 1 }, { sparse: true })
module.exports = {
  Seller: mongoose.model('MercadoPagoSeller', sellerSchema),
  Booking: modeloPaciente('AgendaCheckout', bookingSchema),
}
