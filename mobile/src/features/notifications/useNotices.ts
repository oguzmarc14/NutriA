import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { appointmentPath } from '@/features/appointments/models'
import { roleNotices, type NoticeData } from './noticeModel'
export function useNotices() {
  const { session } = useAuth()
  const role = session?.user.role
  const key = 'nutria.notices.' + session?.user.id
  const [seen, setSeen] = useState<string[] | null>(null)
  const [storageError, setStorageError] = useState('')
  const [saving, setSaving] = useState(false)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const end = new Date(today); end.setDate(end.getDate() + 14)
  const resource = useResource<NoticeData>(role === 'patient' ? '/mi-perfil/citas' : role === 'admin'
    ? '/community/moderacion/pendientes' : role === 'nutritionist' ? appointmentPath(today, end) : null)
  useFocusEffect(useCallback(() => {
    let active = true
    setSeen(null); setStorageError('')
    void SecureStore.getItemAsync(key).then(value => {
      const parsed: unknown = value ? JSON.parse(value) : []
      if (active) setSeen(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [])
    }).catch(() => { if (active) setStorageError('No se pudieron recuperar los avisos vistos.') })
    return () => { active = false }
  }, [key]))
  const notices = roleNotices(role, resource.data)
  const unread = seen === null ? null : notices.filter(item => !seen.includes(item.id)).length
  async function markSeen() {
    if (saving || seen === null) return
    setSaving(true); setStorageError('')
    try {
      const ids = [...new Set([...seen, ...notices.map(n => n.id)])].slice(-100)
      await SecureStore.setItemAsync(key, JSON.stringify(ids)); setSeen(ids)
    } catch { setStorageError('No se pudo guardar el estado de los avisos.') }
    finally { setSaving(false) }
  }
  return { ...resource, notices, unread, seen, saving, markSeen, storageError }
}
