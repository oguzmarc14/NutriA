import { useState } from 'react'
import { Image, Linking, Platform, Pressable, Text, TextInput, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin'
import { useAuth } from '@/features/auth/AuthProvider'
import { googleLoginError } from '@/features/auth/googleLoginError'
import { Button, Page, styles } from '@/shared/ui/primitives'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  async function submit(google: boolean) {
    if (busy) return
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
        if (!result.data.idToken) throw new Error('Google no devolvió un ID token.')
        await signIn('google', { credential: result.data.idToken })
      } else {
        await signIn('paciente/login', { email: email.trim(), password })
      }
    } catch (cause) {
      setError(google ? googleLoginError(cause) : cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  function open(path: string) {
    void Linking.openURL('https://nutri-a-six.vercel.app/' + path)
      .catch(() => setError('No se pudo abrir la página. Intenta nuevamente.'))
  }

  return <Page bottomInset contentStyle={{ backgroundColor: '#faf8f1', width: '100%', maxWidth: 510, alignSelf: 'center', paddingTop: 30 }}>
    <View style={{ alignItems: 'center', gap: 7 }}>
      <Image source={require('../../../../assets/nutria-icon.png')} accessibilityLabel="NutriA" resizeMode="contain" style={{ width: 112, height: 112 }} />
      <Text accessibilityRole="header" style={[styles.title, { textAlign: 'center' }]}>Inicia sesión</Text>
      <Text style={[styles.body, { textAlign: 'center', fontSize: 14 }]}>Elige el acceso de tu cuenta.</Text>
    </View>
    {!!error && <Text accessibilityRole="alert" style={[styles.error, { padding: 12, borderRadius: 12, backgroundColor: '#fff0ec' }]}>{error}</Text>}
    <View style={[styles.card, { backgroundColor: '#eaf2e5', borderWidth: 1, borderColor: '#cadbc5' }]}>
      <View style={[styles.row, { alignItems: 'center' }]}>
        <Ionicons name="shield-checkmark-outline" size={24} color="#176344" />
        <View><Text style={styles.cardTitle}>Personal de NutriA</Text><Text style={styles.body}>Administradores y nutriólogos</Text></View>
      </View>
      <Button label={busy ? 'Conectando…' : 'Continuar con Google'} selected={false} disabled={busy} onPress={() => void submit(true)} />
    </View>
    <View style={[styles.card, { backgroundColor: '#f5efe2', borderWidth: 1, borderColor: '#e2d8c3' }]}>
      <View style={[styles.row, { alignItems: 'center' }]}>
        <Ionicons name="person-outline" size={24} color="#176344" />
        <View><Text style={styles.cardTitle}>Paciente</Text><Text style={styles.body}>Accede con tu correo y contraseña</Text></View>
      </View>
      <Text style={styles.body}>Correo electrónico</Text>
      <TextInput accessibilityLabel="Correo electrónico" placeholder="paciente@correo.com" autoCapitalize="none"
        keyboardType="email-address" autoComplete="email" editable={!busy} style={styles.input} value={email} onChangeText={setEmail} />
      <Text style={styles.body}>Contraseña</Text>
      <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}>
        <TextInput accessibilityLabel="Contraseña" placeholder="Mínimo 8 caracteres" autoComplete="current-password"
          secureTextEntry={!showPassword} editable={!busy} style={{ flex: 1, minHeight: 48, color: '#173f34' }}
          value={password} onChangeText={setPassword} />
        <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onPress={() => setShowPassword(value => !value)} style={{ padding: 10 }}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#176344" />
        </Pressable>
      </View>
      <Button selected={false} label="¿Olvidaste tu contraseña?" disabled={busy} onPress={() => open('recuperar-contrasena')} />
      <Button label={busy ? 'Conectando…' : 'Iniciar sesión'} onPress={() => void submit(false)}
        disabled={busy || !email.trim() || password.length < 8} />
    </View>
    <View style={styles.row}><Button expand selected={false} label="Privacidad" onPress={() => open('privacidad')} />
      <Button expand selected={false} label="Términos de uso" onPress={() => open('terminos')} /></View>
  </Page>
}
