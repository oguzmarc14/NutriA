import { useNotices } from '../useNotices'
import { PushControls } from '../PushControls'
import { enableReminders, disableReminders } from '../reminders'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { Button, Page, styles } from '@/shared/ui/primitives'

type Notice = { id: string; titulo: string; detalle: string }
type Notices = { avisos: Notice[]; citas: { _id: string; inicio: string; estado: string }[] }

export default function PatientNotificationsScreen() {
  const { session } = useAuth()
  const inbox = useNotices()
  const { data, loading, error, reload } = useResource<Notices>('/mi-perfil/citas')
  const [seen, setSeen] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [storageError, setStorageError] = useState('')
  const key = 'nutria.notices.' + session?.user.id

  useEffect(() => {
    let active = true
    setSeen([])
    setStorageError('')
    void SecureStore.getItemAsync(key).then(value => {
      if (!active || !value) return
      const ids: unknown = JSON.parse(value)
      if (Array.isArray(ids)) setSeen(ids.filter((id): id is string => typeof id === 'string'))
    }).catch(() => { if (active) setStorageError('No se pudieron recuperar los avisos vistos.') })
    return () => { active = false }
  }, [key])

  const notices = data?.avisos || []
  const unread = notices.filter(item => !seen.includes(item.id))

  async function markSeen() {
    if (saving) return
    setSaving(true)
    setStorageError('')
    const ids = [...new Set([...seen, ...notices.map(item => item.id)])].slice(-100)
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(ids))
      setSeen(ids)
    } catch {
      setStorageError('No se pudo guardar el estado de los avisos. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return <Page>
    <Text accessibilityRole="header" style={styles.title}>Mis notificaciones</Text>
    <Text style={styles.body}>Confirmaciones y recordatorios de tus consultas.</Text>
    {loading && <ActivityIndicator accessibilityLabel="Cargando notificaciones"/>}
    {!!(error || storageError) && <Text accessibilityRole="alert" style={styles.error}>{error || storageError}</Text>}
    {data && !notices.length && <Text style={styles.body}>No tienes avisos de citas.</Text>}
    {notices.map(item => <View key={item.id} style={styles.card}>
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.body}>{item.detalle}</Text>
      <Text style={styles.body}>{seen.includes(item.id) ? 'Visto' : 'Nuevo'}</Text>
    </View>)}
    {!!unread.length && <Button label={saving ? 'Guardando…' : 'Marcar como vistos'}
      disabled={saving || loading} selected={false} onPress={() => void markSeen()}/>}
    {inbox.notices.filter(n=>n.route).map(n=><View key={n.id} style={styles.card}>
      <Text style={styles.cardTitle}>{n.titulo}</Text>
      <Text style={styles.body}>{n.detalle}</Text>
      <Button selected={false} label={n.route==='/mi-plan'?'Ver mi dieta':'Ver mis citas'}
        onPress={()=>router.navigate(n.route==='/mi-plan'?'/mi-plan':'/mis-citas')}/>
    </View>)}
    {!!inbox.unread&&<Button label="Marcar avisos de cambios como vistos" disabled={inbox.saving} selected={false} onPress={()=>void inbox.markSeen()}/>}
    {!!inbox.storageError&&<Text style={styles.error}>{inbox.storageError}</Text>}
    <PushControls />
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recordatorios del teléfono</Text>
      <Text style={styles.body}>Programa avisos 24 y 2 horas antes de las citas sincronizadas. Se sincronizan al abrir la app, al recibir cambios con la app abierta y después de confirmar o cancelar. Si cambian citas con la app cerrada, abre NutriA para actualizar los avisos locales.</Text>
      <Button label="Programar recordatorios" disabled={!data || loading || saving} onPress={() => {
        setSaving(true)
        void enableReminders(session!.user.id, data!.citas).then(count => setStorageError(count
          ? 'Recordatorios programados en este teléfono.' : 'No hay recordatorios futuros para programar.'))
          .catch(error => setStorageError(error instanceof Error ? error.message : 'No se pudieron programar los avisos.'))
          .finally(() => setSaving(false))
      }}/>
      <Button label="Desactivar recordatorios" selected={false} disabled={saving} onPress={() => {
        setSaving(true)
        void disableReminders(session!.user.id).then(() => setStorageError('Recordatorios desactivados.'))
          .catch(() => setStorageError('No se pudieron desactivar los recordatorios.'))
          .finally(() => setSaving(false))
      }}/>
    </View>
    <Button label="Ver mis citas" onPress={() => router.navigate('/mis-citas')}/>
  </Page>
}
