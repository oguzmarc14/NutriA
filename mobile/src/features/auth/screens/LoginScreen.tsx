import { useRef, useState } from 'react'
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GoogleSignin, GoogleSigninButton, isSuccessResponse } from '@react-native-google-signin/google-signin'
import { useAuth } from '@/features/auth/AuthProvider'
import { googleLoginError } from '@/features/auth/googleLoginError'


export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState<'google' | 'patient' | null>(null)
  const busy = pending !== null
  const lock = useRef(false)
  const passwordField = useRef<TextInput>(null)
  const [focused, setFocused] = useState<'email' | 'password' | null>(null)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length >= 8
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<{ target: 'google' | 'patient' | 'links'; message: string } | null>(null)

  async function submit(google: boolean) {
    if (lock.current || (!google && !valid)) return
    lock.current = true
    const target = google ? 'google' : 'patient'
    setPending(target)
    setError(null)
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
      setError({ target, message: google ? googleLoginError(cause) : cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.' })
    } finally {
      lock.current = false
      setPending(null)
    }
  }

  function open(path: string) {
    void Linking.openURL('https://nutri-a-six.vercel.app/' + path)
      .catch(() => setError({ target: 'links', message: 'No se pudo abrir la página. Intenta nuevamente.' }))
  }

  return <SafeAreaView style={s.safe}>
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
        <View style={s.panel}>
          <View style={s.header}>
            <Image source={require('../../../../assets/nutria-icon.png')} accessibilityLabel="NutriA"
              resizeMode="contain" style={s.logo} />
            <Text style={s.welcome}>BIENVENIDO A NUTRIA</Text>
            <Text accessibilityRole="header" style={s.title}>Inicia sesión</Text>
            <Text style={s.intro}>Selecciona el acceso correspondiente a tu cuenta.</Text>
          </View>

          <View style={[s.card, s.staffCard]}>
            <AccessHeading staff />
            <View style={s.googleFrame}>
              {pending === 'google' ? <View style={s.googleLoading} accessibilityLiveRegion="polite">
                <ActivityIndicator color="#246b55" />
                <Text style={s.intro}>Conectando con Google…</Text>
              </View> : <GoogleSigninButton size={GoogleSigninButton.Size.Wide} color="light"
                accessibilityLabel="Iniciar sesión con Google" disabled={busy}
                onPress={() => void submit(true)} style={s.googleButton} />}
            </View>
            <View style={s.authorized}>
              <Ionicons name="lock-closed-outline" size={13} color="#526b5d" />
              <Text style={s.authorizedText}>Solo cuentas previamente autorizadas</Text>
            </View>
            {error?.target === 'google' && <Text accessibilityRole="alert" style={s.error}>{error.message}</Text>}
          </View>

          <View style={s.separator} accessible={false}>
            <View style={s.rule} />
            <Text style={s.or}>o</Text>
            <View style={s.rule} />
          </View>

          <View style={[s.card, s.patientCard]}>
            <AccessHeading />
            <View style={s.field}>
              <Text style={s.label}>Correo electrónico</Text>
              <TextInput accessibilityLabel="Correo electrónico" placeholder="paciente@correo.com"
                placeholderTextColor="#687a72" autoCapitalize="none" autoCorrect={false}
                keyboardType="email-address" autoComplete="email" returnKeyType="next"
                onSubmitEditing={() => passwordField.current?.focus()}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                editable={!busy} style={[s.inputBox, s.input, focused === 'email' && s.focus]}
                value={email} onChangeText={setEmail} />
            </View>
            <View style={s.field}>
              <Text style={s.label}>Contraseña</Text>
              <View style={[s.inputBox, s.passwordBox, focused === 'password' && s.focus]}>
                <TextInput ref={passwordField} accessibilityLabel="Contraseña" placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#687a72" autoComplete="current-password" autoCapitalize="none"
                  autoCorrect={false} secureTextEntry={!showPassword} editable={!busy} returnKeyType="go"
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  onSubmitEditing={() => void submit(false)} style={[s.input, s.passwordInput]}
                  value={password} onChangeText={setPassword} />
                <Pressable accessibilityRole="button" disabled={busy}
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onPress={() => setShowPassword(value => !value)} style={s.eye}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#526b5d" />
                </Pressable>
              </View>
            </View>
            <Pressable accessibilityRole="link" disabled={busy} onPress={() => open('recuperar-contrasena')} style={s.recovery}>
              <Text style={s.link}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
            {error?.target === 'patient' && <Text accessibilityRole="alert" style={s.error}>{error.message}</Text>}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !valid, busy: pending === 'patient' }}
              onPress={() => void submit(false)} disabled={busy || !valid}
              style={({ pressed }) => [s.submit, (busy || !valid || pressed) && s.dim]}>
              {pending === 'patient' && <ActivityIndicator color="white" />}
              <Text style={s.submitText}>{pending === 'patient' ? 'Iniciando sesión…' : 'Iniciar sesión'}</Text>
            </Pressable>
          </View>

          <View style={s.footer}>
            <Text style={s.caption}>NutriA · Plataforma de seguimiento nutricional</Text>
            <View style={s.legal}>
              <Pressable accessibilityRole="link" style={s.legalLink} onPress={() => open('privacidad')}><Text style={s.link}>Privacidad</Text></Pressable>
              <Pressable accessibilityRole="link" style={s.legalLink} onPress={() => open('terminos')}><Text style={s.link}>Términos de uso</Text></Pressable>
              <Pressable accessibilityRole="link" style={s.legalLink} onPress={() => open('fuentes-nutricionales')}><Text style={s.link}>Fuentes nutricionales</Text></Pressable>
            </View>
            {error?.target === 'links' && <Text accessibilityRole="alert" style={s.error}>{error.message}</Text>}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
}

function AccessHeading({ staff = false }: { staff?: boolean }) {
  return <View style={s.heading}>
    <View style={[s.badge, staff ? s.staffBadge : s.patientBadge]}>
      <Ionicons name={staff ? 'shield-checkmark-outline' : 'person-outline'} size={21} color="#285c45" />
    </View>
    <View style={s.headingText}>
      <Text accessibilityRole="header" style={s.sectionTitle}>{staff ? 'Personal de NutriA' : 'Paciente'}</Text>
      <Text style={s.sectionCaption}>{staff ? 'Administradores y nutriólogos' : 'Accede con tu correo y contraseña'}</Text>
    </View>
  </View>
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#fbfaf5' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  panel: { width: '100%', maxWidth: 490 },
  header: { alignItems: 'center', gap: 5, paddingBottom: 16 },
  logo: { width: 130, height: 105 },
  welcome: { color: '#566f3c', fontWeight: '800', fontSize: 10, letterSpacing: 2.2 },
  title: { color: '#163f34', fontSize: 30, fontWeight: '900', letterSpacing: -0.7, textAlign: 'center' },
  intro: { color: '#53635c', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  card: { padding: 14, gap: 10, borderWidth: 1, borderRadius: 20, shadowColor: '#23493a',
    shadowOpacity: 0.09, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  staffCard: { backgroundColor: '#edf3e8', borderColor: '#ccd9c6' },
  patientCard: { backgroundColor: '#f7f1e6', borderColor: '#dfd7c7' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headingText: { flex: 1, gap: 2 },
  badge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  staffBadge: { backgroundColor: '#d3e4c9' },
  patientBadge: { backgroundColor: '#e9dec6' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#173f34' },
  sectionCaption: { fontSize: 12, color: '#55665b' },
  googleFrame: { backgroundColor: 'white', borderWidth: 1, borderColor: '#c7d4ce', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, minHeight: 52, overflow: 'hidden' },
  googleButton: { width: '100%', maxWidth: 312, height: 48 },
  googleLoading: { minHeight: 50, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  authorized: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  authorizedText: { color: '#526b5d', fontSize: 11, flexShrink: 1, textAlign: 'center' },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 12 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#bbc9c0' },
  or: { minWidth: 24, minHeight: 24, borderWidth: 1, borderColor: '#cdd8d0', borderRadius: 20,
    textAlign: 'center', textAlignVertical: 'center', color: '#607368', fontSize: 11 },
  field: { gap: 5 },
  label: { color: '#2d4c42', fontSize: 12, fontWeight: '700' },
  inputBox: { backgroundColor: '#fffefa', borderWidth: 1, borderRadius: 12, borderColor: '#c9d2cd' },
  input: { minHeight: 48, paddingHorizontal: 13, fontSize: 15, color: '#173f34' },
  passwordBox: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  focus: { borderColor: '#337458' },
  eye: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  recovery: { minHeight: 44, alignSelf: 'flex-end', justifyContent: 'center', marginTop: -6, marginBottom: -5 },
  link: { fontWeight: '700', fontSize: 12, color: '#246b55' },
  submit: { minHeight: 48, padding: 11, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, backgroundColor: '#246b55' },
  dim: { opacity: 0.68 },
  submitText: { color: 'white', fontWeight: '700', fontSize: 15, textAlign: 'center' },
  error: { padding: 10, borderRadius: 10, backgroundColor: '#fff1ef', color: '#8e302d', fontSize: 13 },
  footer: { marginTop: 18, alignItems: 'center', gap: 2 },
  caption: { color: '#596d62', fontSize: 11, textAlign: 'center' },
  legal: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', columnGap: 16 },
  legalLink: { minHeight: 44, justifyContent: 'center' },
})
