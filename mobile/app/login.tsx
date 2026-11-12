import { useState } from 'react'
import { Platform, Text, TextInput } from 'react-native'
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin'
import { useAuth } from '../src/auth'
import { Button, Page, styles } from '../src/ui'

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
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
        const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
        if (!webClientId || (Platform.OS === 'ios' && !iosClientId)) {
          throw new Error('El acceso con Google requiere configurar los clientes OAuth.')
        }
        GoogleSignin.configure({ webClientId, iosClientId })
        if (Platform.OS === 'android') await GoogleSignin.hasPlayServices()
        const result = await GoogleSignin.signIn()
        if (!isSuccessResponse(result)) return
        if (!result.data.idToken) throw new Error('Google no devolvió un ID token.')
        await signIn('google', { credential: result.data.idToken })
      } else {
        await signIn('paciente/login', { email: email.trim(), password })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page title="NutriA">
      <Text style={styles.cardTitle}>Acceso de pacientes</Text>
      <TextInput accessibilityLabel="Correo electrónico" placeholder="Correo electrónico"
        autoCapitalize="none" keyboardType="email-address" autoComplete="email"
        editable={!busy} style={styles.input} value={email} onChangeText={setEmail} />
      <TextInput accessibilityLabel="Contraseña" placeholder="Contraseña" autoComplete="current-password"
        secureTextEntry editable={!busy} style={styles.input} value={password} onChangeText={setPassword} />
      <Button label={busy ? 'Conectando…' : 'Iniciar sesión'} onPress={() => void submit(false)}
        disabled={busy || !email.trim() || password.length < 8} />
      <Text style={styles.cardTitle}>Administradores y nutriólogos</Text>
      <Button label="Continuar con Google" disabled={busy} onPress={() => void submit(true)} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </Page>
  )
}
