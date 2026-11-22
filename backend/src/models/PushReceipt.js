const mongoose = require('mongoose')
const schema = new mongoose.Schema({
  ticket: { type: String, required: true, unique: true },
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'PushDevice', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  nextCheckAt: { type: Date, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true })
module.exports = mongoose.model('PushReceipt', schema)
