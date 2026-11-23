import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Alert, Share, Text, View } from 'react-native'
import { router } from 'expo-router'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { Button, colors, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'

type Preferences = { permitidaPorNutriologo: boolean; participa: boolean; activa: boolean }
type Badge = { id: string; titulo: string; descripcion: string; icono: string }
type Summary = {
  diasConRegistro: number
  diasUltimos14: number
  actividadReciente?: { fecha: string; conRegistro: boolean }[]
  rachas?: { actual: number; maxima: number; ultimoRegistro: string | null; registroHoy: boolean }
  reconocimientos: Badge[]
  mensaje: string
}
type Data = { preferencias: Preferences; resumen: Summary | null }
const activityDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' })
const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  sprout: 'leaf-outline', heart: 'heart-outline', message: 'chatbubble-ellipses-outline',
  sun: 'sunny-outline', flower: 'flower-outline', flame: 'flame-outline',
  calendar: 'calendar-outline',
}

export function GamificationPanel() {
  const { session } = useAuth()
  const resource = useResource<Data>('/gamificacion/mi-resumen')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const data = resource.data
  async function toggle() {
    if (!session || !data?.preferencias.permitidaPorNutriologo || saving) return
    const participa = !data.preferencias.participa
    setSaving(true); setError('')
    try {
      await request('/gamificacion/mi-preferencia', {
        token: session.token, method: 'PATCH', body: { participa },
      })
      resource.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos guardar tu preferencia.')
    } finally { setSaving(false) }
  }
  function confirmToggle() {
    if (!data) return
    if (!data.preferencias.participa) {
      Alert.alert('Participar es opcional',
        'Se reconocerán tus registros de seguimiento, no tu peso, tus calorías ni qué tanto comiste. Puedes pausarlo cuando quieras.', [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Activar', onPress: () => void toggle() },
        ])
    } else void toggle()
  }
  return <View style={[styles.card, { gap: 14, borderWidth: 1, borderColor: '#bfddc9', backgroundColor: '#edf6e9' }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ionicons name="leaf-outline" size={29} color={colors.green} />
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Mi camino en NutriA</Text>
        <Text style={[styles.body, { fontSize: 13 }]}>Reconocimientos y bienestar a tu ritmo</Text>
      </View>
    </View>
    <Text style={[styles.body, { fontSize: 14, lineHeight: 21 }]}>
      Aquí no hay competencias, castigos ni días perfectos. Tú decides si participar.
    </Text>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {data && (!data.preferencias.permitidaPorNutriologo ?
      <Text style={styles.body}>Este espacio está pausado por tu nutriólogo. Tu seguimiento y tus datos no cambian.</Text> :
      <>
        <Text style={[styles.body, { fontWeight: '600', fontSize: 14 }]}>
          {data.preferencias.activa ? 'Tus reconocimientos están activos.' : 'Puedes activar tus reconocimientos cuando quieras.'}
        </Text>
        <Button disabled={saving} label={saving ? 'Guardando…' :
          data.preferencias.participa ? 'Pausar reconocimientos' : 'Activar reconocimientos'} onPress={confirmToggle} />
        {data.preferencias.activa && data.resumen && <>
          <Text style={[styles.body, { fontSize: 14 }]}>{data.resumen.mensaje}</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <View style={[styles.card, { flex: 1, minWidth: 118, backgroundColor: '#ffffffc9' }]}>
              <Text style={styles.body}>Días con registro</Text>
              <Text style={styles.title}>{data.resumen.diasConRegistro}</Text>
            </View>
            <View style={[styles.card, { flex: 1, minWidth: 118, backgroundColor: '#ffffffc9' }]}>
              <Text style={styles.body}>Últimos 14 días</Text>
              <Text style={styles.title}>{data.resumen.diasUltimos14}</Text>
            </View>
          </View>
          {!!data.resumen.actividadReciente?.length && <View style={[styles.card, { backgroundColor: '#fff' }]}>
            <Text accessibilityRole="header" style={styles.cardTitle}>Tu actividad reciente</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {data.resumen.actividadReciente.map(day => <View key={day.fecha} accessible
                accessibilityLabel={activityDate.format(new Date(day.fecha + 'T12:00:00Z')) + (day.conRegistro ? ', con registro' : ', sin registro')}
                style={{ width: '14.285%', padding: 2 }}>
                <View style={{ minHeight: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: day.conRegistro ? colors.green : '#edf4ee' }}>
                  <Text style={{ color: day.conRegistro ? '#fff' : colors.muted, fontWeight: '700' }}>{Number(day.fecha.slice(-2))}</Text>
                </View>
              </View>)}
            </View>
            <Text style={[styles.body, { fontSize: 13 }]}>Los días marcados tienen una experiencia registrada.</Text>
            <Button label="Ir a mi plan" onPress={() => router.navigate('/mi-plan')} />
          </View>}
          {!!data.resumen.rachas && <View style={[styles.card, { backgroundColor: '#e0f0e3' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="flame-outline" color={colors.green} size={23} />
              <Text style={styles.cardTitle}>Rachas de seguimiento</Text>
            </View>
            <Text style={[styles.body, { fontSize: 13 }]}>
              Cuentan los días seguidos con alguna experiencia registrada, sin valorar el contenido de la comida.
            </Text>
            <Text style={styles.body}>Actual: {data.resumen.rachas.actual} días · Mejor: {data.resumen.rachas.maxima} días</Text>
          </View>}
          <Text accessibilityRole="header" style={styles.cardTitle}>Momentos reconocidos</Text>
          {!data.resumen.reconocimientos.length &&
            <Text style={styles.body}>Tu primer reconocimiento aparecerá cuando registres una experiencia.</Text>}
          {data.resumen.reconocimientos.map(item => <View key={item.id}
            style={[styles.card, { flexDirection: 'row', gap: 12, backgroundColor: '#fff' }]}>
            <Ionicons name={icons[item.icono] || 'ribbon-outline'} color={colors.green} size={25} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={[styles.body, { fontSize: 13 }]}>{item.descripcion}</Text>
              <Button label="Compartir reconocimiento" selected={false} onPress={() =>
                void Share.share({ message: 'Desbloqueé «' + item.titulo + '» en Mi camino en NutriA.' })
                  .catch(() => setError('No se pudo abrir la opción de compartir.'))} />
            </View>
          </View>)}
        </>}
      </>)}
  </View>
}
