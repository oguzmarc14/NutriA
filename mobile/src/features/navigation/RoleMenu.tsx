import { router } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { Shortcut } from '@/shared/ui/Shortcut'
export function RoleMenu({ close }: { close?: () => void }) {
  const { session } = useAuth()
  const patient = session?.user.role === 'patient'
  const entries = patient ? [
    { title: 'Resumen', path: '/', icon: 'grid-outline' },
    { title: 'Mis citas', path: '/mis-citas', icon: 'calendar-outline' },
    { title: 'Mi plan', path: '/mi-plan', icon: 'nutrition-outline' },
    { title: 'Mi progreso', path: '/progreso', icon: 'stats-chart-outline' },
    { title: 'Mi expediente', path: '/mi-expediente', icon: 'clipboard-outline' },
    { title: 'Mis pagos', path: '/mis-pagos', icon: 'wallet-outline' },
  ] as const : [
    { title: 'Resumen', path: '/', icon: 'grid-outline' },
    { title: 'Usuarios y accesos', path: '/usuarios', icon: 'people-outline' },
    { title: 'Moderación de recetas', path: '/moderacion', icon: 'shield-checkmark-outline' },
    { title: 'NutriA Community', path: '/comunidad', icon: 'book-outline' },
  ] as const
  return <>{entries.map(item => <Shortcut key={item.path} title={item.title} icon={item.icon}
    onPress={() => { close?.(); router.navigate(item.path) }} />)}
    <Shortcut title="Notificaciones" icon="notifications-outline" onPress={() => { close?.(); router.push('/notificaciones') }} />
  </>
}
