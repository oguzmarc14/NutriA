import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button, colors, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import { noticeDestination } from '../noticeModel'
import { useNotices } from '../useNotices'

const filters = ['Todos', 'Dietas', 'Citas'] as const
const noticeDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export default function RoleNotifications() {
  const { session } = useAuth()
  const inbox = useNotices()
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos')
  const role = session?.user.role
  const patient = role === 'patient'
  const notices = inbox.notices.map(item => {
    const route = item.route || (patient ? '/mis-citas' : role === 'admin' ? '/moderacion' : '/citas')
    const category = route === '/mi-plan' || route === '/planes' ? 'Dietas'
      : route === '/mis-citas' || route === '/citas' ? 'Citas' : 'Comunidad'
    return { ...item, category, destination: noticeDestination(role, route) }
  }).filter(item => filter === 'Todos' || item.category === filter)

  return <Page bottomInset>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Notificaciones</Text>
      <Text style={styles.body}>{inbox.unread === null ? 'Tus avisos en NutriA' : inbox.unread === 1
        ? '1 aviso sin leer' : inbox.unread + ' avisos sin leer'}</Text>
      <View style={styles.row}>
        <Button expand label="Configuración" selected={false} onPress={() => router.push('/preferencias')} />
        {!!inbox.unread && <Button expand label="Marcar como leídos" disabled={inbox.saving}
          onPress={() => void inbox.markSeen()} />}
      </View>
    </View>
    {role !== 'admin' && <View style={styles.row}>{filters.map(option =>
      <Button key={option} expand label={option} selected={filter === option} onPress={() => setFilter(option)} />
    )}</View>}
    <ListState {...inbox} empty={!notices.length ? 'No hay avisos en esta sección.' : undefined} />
    {!!inbox.storageError && <Text accessibilityRole="alert" style={styles.error}>{inbox.storageError}</Text>}
    {notices.map(item => {
      const unread = inbox.seen !== null && !item.seen && !inbox.seen.includes(item.id)
      const timestamp = Date.parse(item.createdAt || '')
      return <View key={item.id} style={[styles.card, { borderWidth: 1, borderColor: unread ? '#83b49c' : colors.border }]}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ backgroundColor: '#e1efe6', padding: 10, borderRadius: 12 }}>
            <Ionicons name={item.category === 'Dietas' ? 'nutrition-outline' : item.category === 'Citas' ? 'calendar-outline' : 'book-outline'}
              color={colors.green} size={21} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.body, { fontSize: 12 }]}>{item.category}{unread ? ' · Sin leer' : ''}</Text>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
          </View>
        </View>
        <Text style={styles.body}>{item.detalle}</Text>
        {Number.isFinite(timestamp) && <Text style={[styles.body, { fontSize: 12 }]}>{noticeDate.format(timestamp)}</Text>}
        {item.destination && <Pressable accessibilityRole="button" onPress={() => router.push(item.destination!)}
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: colors.green, fontWeight: '800' }}>Ver {item.category === 'Dietas' ? 'planes' : item.category === 'Citas' ? 'citas' : 'publicaciones'}</Text>
          <Ionicons name="arrow-forward" color={colors.green} size={16} />
        </Pressable>}
      </View>
    })}
  </Page>
}
