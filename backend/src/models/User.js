const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    /*
     * Solo los pacientes utilizarán contraseña.
     *
     * Admin y nutriólogos iniciarán sesión con Google,
     * por lo que no necesitan una contraseña almacenada.
     */
    password: {
      type: String,
      minlength: 8,
      select: false,
    },

    communityTrusted: { type: Boolean, default: false, select: false },

    role: {
      type: String,
      enum: ['admin', 'nutritionist', 'patient'],
      required: true,
    },

    /*
     * Método de autenticación de la cuenta.
     *
     * google   → admin / nutritionist
     * password → patient
     */
    authProvider: {
      type: String,
      enum: ['google', 'password'],
      required: true,
    },

    /*
     * Identificador único entregado por Google.
     *
     * No usamos únicamente el correo como identificador
     * permanente de una cuenta Google.
     */
    googleSub: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },

    /*
     * Si este User representa a un paciente,
     * apunta al registro clínico Patient correspondiente.
     *
     * Para admin y nutritionist queda vacío.
     */
    clinica: {
      nombre: { type: String, default: '', maxlength: 80 },
      nombreProfesional: { type: String, default: '', maxlength: 100 },
      logo: { type: String, default: '' },
    },

    horarioLaboral: {
      configurado: { type: Boolean, default: false },
      dias: { type: [Number], default: [1, 2, 3, 4, 5] },
      inicio: { type: String, default: '09:00' },
      fin: { type: String, default: '18:00' },
      zonaHoraria: { type: String, default: 'America/Mexico_City' },
      // Excepciones por fecha local del consultorio (festivos, vacaciones o cierres).
      diasNoLaborables: {
        type: [{
          _id: false,
          fecha: { type: String, required: true },
          motivo: { type: String, default: '', maxlength: 80 },
        }],
        default: [],
      },
    },

    // Horarios específicos de citas. Son independientes de la jornada laboral:
    // pueden ofrecer únicamente algunos bloques y ocultar descansos.
    horarioCitas: {
      configurado: { type: Boolean, default: false },
      publicado: { type: Boolean, default: false },
      anticipacionHoras: { type: Number, default: 2, min: 0, max: 72 },
      franjas: {
        type: [{
          _id: false,
          dia: { type: Number, min: 0, max: 6, required: true },
          inicio: { type: String, required: true },
          fin: { type: String, required: true },
        }],
        default: [],
      },
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
    },

    /*
     * Estado general de acceso.
     *
     * Permite desactivar una cuenta sin eliminarla.
     */
    active: {
      type: Boolean,
      default: true,
    },

    /*
     * Estado de activación.
     *
     * Los pacientes comienzan como "pending" hasta que
     * abren el correo de activación y crean su contraseña.
     *
     * Admin/nutriólogo normalmente estarán "active".
     */
    accountStatus: {
      type: String,
      enum: ['pending', 'active'],
      default: 'active',
    },

    /*
     * Token para activar la cuenta del paciente.
     *
     * Guardaremos el HASH del token, nunca el token real.
     */
    activationToken: {
      type: String,
      select: false,
      default: null,
    },

    activationTokenExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

/*
 * Hashea la contraseña únicamente cuando existe
 * y fue creada/modificada.
 */
userSchema.pre('save', async function encryptPassword() {
  if (!this.password || !this.isModified('password')) {
    return
  }

  this.password = await bcrypt.hash(this.password, 12)
})

/*
 * Comparación utilizada solamente para cuentas
 * que inician sesión mediante contraseña.
 */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) {
    return false
  }

  return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', userSchema)