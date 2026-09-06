const cors = require('cors')
const express = require('express')
const authRoutes = require('./routes/auth.routes')
const pacientesRoutes = require('./routes/pacientes.routes')
const expedienteClinicoRoutes = require('./routes/expedienteClinico.routes')
const medicionesRoutes = require('./routes/mediciones.routes')

const app = express()

app.disable('x-powered-by')
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ service: 'NutriA API', status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/pacientes', pacientesRoutes)
app.use('/api/expedientes', expedienteClinicoRoutes)
app.use('/api/mediciones', medicionesRoutes)

app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Ocurrió un error interno' })
})

module.exports = app
