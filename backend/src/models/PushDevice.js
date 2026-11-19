const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  platform: { type: String, enum: ['android', 'ios'], required: true },
}, { timestamps: true })
module.exports = mongoose.model('PushDevice', schema)
