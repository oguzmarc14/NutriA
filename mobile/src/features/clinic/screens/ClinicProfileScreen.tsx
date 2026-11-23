import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { request } from '@/core/api/client'
import { useResource } from '@/shared/hooks/useResource'
import { Page, colors, styles } from '@/shared/ui/primitives'

type Clinic = { nombre: string; nombreProfesional: string; logo: string }
const initial: Clinic = { nombre: '', nombreProfesional: '', logo: '' }

export default function ClinicProfileScreen() {
  const { session } = useAuth()
  const resource = useResource<{ clinica: Partial<Clinic> }>('/clinica')
  const [form, setForm] = useState<Clinic>(initial)
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!resource.data) return
    const item = resource.data.clinica || {}
    setForm({
      nombre: item.nombre || '',
      nombreProfesional: item.nombreProfesional || session?.user.name || '',
      logo: item.logo || '',
    })
  }, [resource.data, session?.user.name])

  async function pickLogo() {
    if (picking || saving) return
    setPicking(true)
    setError('')
    setMessage('')
    try {
      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1],
        quality: 0.55, base64: true,
      })
      if (selection.canceled || !selection.assets[0]) return
      const asset = selection.assets[0]
      if (!asset.base64) {
        setError('No se pudo leer la imagen. Selecciona una foto diferente.')
        return
      }
      // El backend usa un Data URI, con límite de 950000 caracteres.
      // Se convierte a JPEG para admitir fotos de la galería sin subir binarios.
      const photo = 'data:image/jpeg;base64,' + asset.base64
      if (photo.length > 900000) {
        setError('La imagen es muy grande. Elige una foto más pequeña (menos de 650 KB).')
        return
      }
      setForm(current => ({ ...current, logo: photo }))
    } catch {
      setError('No fue posible abrir las fotos del dispositivo.')
    } finally {
      setPicking(false)
    }
  }

  async function saveClinic() {
    if (saving || !session?.token) return
    const nombre = form.nombre.trim()
    const nombreProfesional = form.nombreProfesional.trim()
    if (!nombre || nombre.length > 80) {
      setError('Escribe el nombre del consultorio (máximo 80 caracteres).')
      return
    }
    if (nombreProfesional.length > 100) {
      setError('El nombre profesional debe tener 100 caracteres o menos.')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const result = await request<{ clinica: Clinic }>('/clinica', {
        token: session.token, method: 'PUT',
        body: { nombre, nombreProfesional, logo: form.logo },
      })
      setForm(result.clinica)
      setMessage('Los cambios de tu clínica se guardaron correctamente.')
      resource.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  return <Page bottomInset>
    <View style={s.heading}>
      <Text style={s.eyebrow}>PERSONALIZA TU ESPACIO</Text>
      <Text accessibilityRole="header" style={s.title}>Mi clínica</Text>
      <Text style={s.caption}>Tu nombre profesional y logotipo, en un solo lugar.</Text>
    </View>
    {resource.loading && <Text style={styles.body}>Cargando información…</Text>}
    {!!resource.error && <View style={s.warning}>
      <Text accessibilityRole="alert" style={styles.error}>{resource.error}</Text>
      <Pressable accessibilityRole="button" onPress={resource.reload}><Text style={s.link}>Reintentar</Text></Pressable>
    </View>}
    <Pressable accessibilityRole="button" onPress={() => router.push('/horarios')}
      style={({ pressed }) => [s.card, { flexDirection: 'row', alignItems: 'center' }, pressed && styles.pressed]}>
      <Ionicons name="calendar-outline" size={24} color={colors.green} />
      <View style={{flex:1,gap:4}}>
        <Text style={s.logoTitle}>Horarios y días no laborables</Text>
        <Text style={s.caption}>Jornada semanal, vacaciones y disponibilidad de citas</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.green} />
    </Pressable>
    {resource.data && <>
      <View style={s.card}>
        <Text style={s.label}>Identidad del consultorio</Text>
        <View style={s.logoRow}>
          <View style={s.preview}>
            {form.logo ? <Image source={{ uri: form.logo }} resizeMode="contain" style={s.photo} accessibilityLabel="Logo del consultorio" /> :
              <Ionicons name="leaf-outline" size={39} color={colors.green} />}
          </View>
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={s.logoTitle}>Logotipo o fotografía</Text>
            <Text style={s.caption}>JPG, PNG o WebP · hasta 650 KB</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Seleccionar foto de la galería"
              disabled={saving || picking} onPress={() => void pickLogo()}
              style={({ pressed }) => [s.photoButton, pressed && styles.pressed]}>
              <Ionicons name="images-outline" size={18} color={colors.green} />
              <Text style={s.photoText}>{picking ? 'Abriendo galería…' : 'Cambiar imagen'}</Text>
            </Pressable>
            {!!form.logo && <Pressable accessibilityRole="button" disabled={saving}
              onPress={() => setForm(value => ({ ...value, logo: '' }))} style={{ paddingVertical: 3 }}>
              <Text style={s.remove}>Quitar imagen</Text>
            </Pressable>}
          </View>
        </View>
        <View style={s.line} />
        <Text style={s.label}>Nombre del consultorio *</Text>
        <TextInput style={s.input} accessibilityLabel="Nombre del consultorio" placeholder="Nombre de tu clínica"
          placeholderTextColor="#82978a" value={form.nombre} maxLength={80}
          editable={!saving} onChangeText={nombre => { setForm(value => ({ ...value, nombre })); setMessage('') }} />
        <Text style={s.label}>Nombre profesional</Text>
        <TextInput style={s.input} accessibilityLabel="Nombre profesional"
          placeholder={session?.user.name || 'Nombre del nutriólogo'}
          placeholderTextColor="#82978a" value={form.nombreProfesional} maxLength={100}
          editable={!saving} onChangeText={nombreProfesional => { setForm(value => ({ ...value, nombreProfesional })); setMessage('') }} />
        <Text style={s.hint}>El nombre profesional se muestra en la clínica; no cambia tu cuenta de acceso.</Text>
      </View>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {!!message && <View style={s.success}><Ionicons name="checkmark-circle" size={20} color={colors.green} />
        <Text accessibilityLiveRegion="polite" style={s.successText}>{message}</Text></View>}
      <Pressable accessibilityRole="button" disabled={saving || picking} onPress={() => void saveClinic()}
        style={({ pressed }) => [s.save, pressed && styles.pressed, (saving || picking) && styles.disabled]}>
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={s.saveText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
      </Pressable>
    </>}
  </Page>
}

const s = StyleSheet.create({
  heading: { gap: 4 },
  eyebrow: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: '#f9fcf9', padding: 19, borderRadius: 23, borderWidth: 1, borderColor: '#d1e3d7', gap: 13 },
  label: { fontSize: 13, fontWeight: '800', color: '#33634b' },
  logoRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  preview: { backgroundColor: '#e5f2e9', borderRadius: 20, width: 104, height: 104, borderWidth: 1, borderColor: '#c9dfce', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  logoTitle: { fontWeight: '800', fontSize: 15, color: colors.ink },
  photoButton: { padding: 10, borderWidth: 1, borderColor: '#bcd8c5', borderRadius: 12, backgroundColor: '#edf6ef', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoText: { fontWeight: '700', fontSize: 12, color: colors.green },
  remove: { fontSize: 12, fontWeight: '700', color: '#9b4e41' },
  line: { height: 1, backgroundColor: '#e0ebe3', marginVertical: 3 },
  input: { fontSize: 15, color: colors.ink, backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: '#cbded2', paddingHorizontal: 13, minHeight: 49 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  save: { minHeight: 52, borderRadius: 15, backgroundColor: '#236a53', flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  warning: { backgroundColor: '#fff2eb', borderRadius: 14, padding: 13 },
  error: { color: '#9c3030', backgroundColor: '#fff2ef', padding: 13, fontSize: 13, borderRadius: 13, lineHeight: 19 },
  link: { color: colors.green, fontWeight: '700', paddingTop: 8 },
  success: { backgroundColor: '#e7f3e8', borderRadius: 13, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'center' },
  successText: { flex: 1, color: '#235c44', fontSize: 13, fontWeight: '700' },
})
