const cors = require('cors')
const express = require('express')

const authRoutes = require('./routes/auth.routes')
const pacientesRoutes = require('./routes/pacientes.routes')
const expedienteClinicoRoutes = require('./routes/expedienteClinico.routes')
const medicionesRoutes = require('./routes/mediciones.routes')
const planAlimenticioRoutes = require('./routes/planAlimenticio.routes')
const usuariosRoutes = require('./routes/usuarios.routes')
const alimentosRoutes = require('./routes/alimentos.routes')
const perfilPacienteRoutes = require('./routes/perfilPaciente.routes')
const seguimientoComidaRoutes = require('./routes/seguimientoComida.routes')
const gamificacionRoutes = require('./routes/gamificacion.routes')
const pagosRoutes = require('./routes/pagos.routes')

const clinicaRoutes = require('./routes/clinica.routes')
const calculoNutricionalRoutes = require('./routes/calculoNutricional.routes')
const asistenteEquivalentesRoutes = require('./routes/asistenteEquivalentes.routes')

const communityRoutes = require('./routes/community.routes')
const citasRoutes = require('./routes/citas.routes')
const horarioRoutes = require('./routes/horario.routes')
const agendaCheckoutRoutes = require('./routes/agendaCheckout.routes')
const agendaPublicaRoutes = require('./routes/agendaPublica.routes')
const calendarRoutes = require('./routes/calendar.routes')
const recordatoriosRoutes = require('./routes/recordatorios.routes')

const app = express()
app.locals.checkoutAgenda = require('./services/agendaCheckout.service')
app.locals.mercadoPagoHabilitado = require('./services/mercadoPago.service').configured
app.locals.notificarCita = require('./services/push.service').notificarCita
app.locals.notificarReceta = require('./services/push.service').notificarReceta
app.locals.notificarDietaAsignada = require('./services/push.service').notificarDietaAsignada
app.locals.notificarDietaAceptada = require('./services/push.service').notificarDietaAceptada

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
      mobileApiVersion: 2,
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

app.use('/api/clinica', clinicaRoutes)
app.use('/api/calculo-nutricional', calculoNutricionalRoutes)
app.use('/api/asistente-equivalentes', asistenteEquivalentesRoutes)

app.use(
  '/api/usuarios',
  usuariosRoutes,
)

app.use(
  '/api/mi-perfil',
  perfilPacienteRoutes,
)

app.use(
  '/api/seguimiento-comidas',
  seguimientoComidaRoutes,
)

app.use('/api/gamificacion', gamificacionRoutes)
app.use('/api/pagos', pagosRoutes)

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

app.use('/api/community', communityRoutes)
app.use('/api/citas', citasRoutes)
app.use('/api/horario', horarioRoutes)
app.use('/api/agenda-publica', agendaPublicaRoutes)
app.use('/api/agenda-cobros', agendaCheckoutRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/recordatorios', recordatoriosRoutes)
app.use('/api/push', require('./routes/push.routes'))

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

    res.status(error.statusCode || 500).json({
      message:
        error.publicMessage ||
        'Ocurrió un error interno',
    })
  },
)

module.exports = app
