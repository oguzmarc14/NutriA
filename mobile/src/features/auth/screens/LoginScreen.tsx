import { useState } from 'react'
import { Platform, Text, TextInput } from 'react-native'
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button, Page, styles } from '@/shared/ui/primitives'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(google: boolean) {
    setBusy(true)
    setError('')
    try {
      if (google) {
        const webClientId = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '664061363853-nt772bl1bh9o9q032cf679pjuhadta46.apps.googleusercontent.com')
        const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
        if (!webClientId || (Platform.OS === 'ios' && !iosClientId)) {
          throw new Error('El acceso con Google requiere configurar los clientes OAuth.')
        }
        GoogleSignin.configure({ webClientId, iosClientId })
        if (Platform.OS === 'android') {
          try { await GoogleSignin.hasPlayServices() }
          catch { throw new Error('Este dispositivo necesita Servicios de Google Play para el acceso nativo de personal. Puedes entrar desde nutri-a-six.vercel.app en tu navegador.') }
        }
        const result = await GoogleSignin.signIn()
        if (!isSuccessResponse(result)) return
        if (!result.data.idToken) throw new Error('Google no devolviÃ³ un ID token.')
        await signIn('google', { credential: result.data.idToken })
      } else {
        await signIn('paciente/login', { email: email.trim(), password })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesiÃ³n.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page title="NutriA">
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Text style={styles.cardTitle}>Acceso de pacientes</Text>
      <TextInput accessibilityLabel="Correo electrÃ³nico" placeholder="Correo electrÃ³nico"
        autoCapitalize="none" keyboardType="email-address" autoComplete="email"
        editable={!busy} style={styles.input} value={email} onChangeText={setEmail} />
      <TextInput accessibilityLabel="ContraseÃ±a" placeholder="ContraseÃ±a" autoComplete="current-password"
        secureTextEntry editable={!busy} style={styles.input} value={password} onChangeText={setPassword} />
      <Button label={busy ? 'Conectandoâ€¦' : 'Iniciar sesiÃ³n'} onPress={() => void submit(false)}
        disabled={busy || !email.trim() || password.length < 8} />
      <Text style={styles.cardTitle}>Administradores y nutriÃ³logos</Text>
      <Button label="Continuar con Google" disabled={busy} onPress={() => void submit(true)} />
    </Page>
  )
}
