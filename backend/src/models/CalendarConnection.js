const mongoose = require('mongoose')
const schema = new mongoose.Schema({
  nutritionist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  refreshTokenEncrypted: { type: String, required: true, select: false },
  connectedAt: { type: Date, default: Date.now },
}, { timestamps: true })
module.exports = mongoose.model('CalendarConnection', schema)
