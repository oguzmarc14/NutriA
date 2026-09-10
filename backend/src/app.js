const cors = require('cors')
const express = require('express')

const authRoutes = require('./routes/auth.routes')
const pacientesRoutes = require('./routes/pacientes.routes')
const expedienteClinicoRoutes = require('./routes/expedienteClinico.routes')
const medicionesRoutes = require('./routes/mediciones.routes')
const planAlimenticioRoutes = require('./routes/planAlimenticio.routes')
const usuariosRoutes = require('./routes/usuarios.routes')
const alimentosRoutes = require('./routes/alimentos.routes')

const app = express()

app.disable('x-powered-by')

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      'http://localhost:5173',
    credentials: true,
  }),
)

app.use(
  express.json({
    limit: '1mb',
  }),
)

/*
 * ----------------------------------------------------
 * HEALTH
 * ----------------------------------------------------
 */

app.get(
  '/api/health',
  (_req, res) => {
    res.json({
      service: 'NutriA API',
      status: 'ok',
    })
  },
)

/*
 * ----------------------------------------------------
 * RUTAS
 * ----------------------------------------------------
 */

app.use(
  '/api/auth',
  authRoutes,
)

app.use(
  '/api/pacientes',
  pacientesRoutes,
)

app.use(
  '/api/expedientes',
  expedienteClinicoRoutes,
)

app.use(
  '/api/mediciones',
  medicionesRoutes,
)

app.use(
  '/api/planes',
  planAlimenticioRoutes,
)

app.use(
  '/api/usuarios',
  usuariosRoutes,
)

/*
 * ----------------------------------------------------
 * CATÁLOGO DE ALIMENTOS
 * ----------------------------------------------------
 *
 * En este MVP el catálogo únicamente puede ser
 * consultado por el nutriólogo.
 *
 * La administración del catálogo quedará para
 * una versión posterior.
 */

app.use(
  '/api/alimentos',
  alimentosRoutes,
)

/*
 * ----------------------------------------------------
 * RUTA NO ENCONTRADA
 * ----------------------------------------------------
 */

app.use(
  (_req, res) => {
    res.status(404).json({
      message:
        'Ruta no encontrada',
    })
  },
)

/*
 * ----------------------------------------------------
 * MANEJO GLOBAL DE ERRORES
 * ----------------------------------------------------
 */

app.use(
  (
    error,
    _req,
    res,
    _next,
  ) => {
    console.error(error)

    res.status(500).json({
      message:
        'Ocurrió un error interno',
    })
  },
)

module.exports = app