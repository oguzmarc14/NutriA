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