const { verificarSeparacion } = require('./datosPacientes')
const mongoose = require('mongoose')

async function connectDatabase() {
  const { MONGODB_URI } = process.env

  if (!MONGODB_URI) {
    throw new Error('Falta configurar MONGODB_URI en backend/.env')
  }

  await mongoose.connect(MONGODB_URI)
  await verificarSeparacion()
  console.log('MongoDB Atlas conectado')
}

module.exports = { connectDatabase }
