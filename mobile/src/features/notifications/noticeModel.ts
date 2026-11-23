export type Notice = { id: string; titulo: string; detalle: string; route?: string; seen?: boolean }
export type NoticeData = { avisos?: Notice[] } | { _id: string; titulo?: string; estado?: string; inicio?: string; patient?: { name: string } | null }[]
export function roleNotices(role: string | undefined, data: NoticeData | undefined, now = Date.now()): Notice[] {
  if (!data) return []
  if (role === 'patient') return !Array.isArray(data) && Array.isArray(data.avisos) ? data.avisos : []
  if (!Array.isArray(data)) return []
  if (role === 'admin') return data.map(item => ({ id: 'recipe-' + item._id, titulo: 'Receta pendiente de revisión', detalle: item.titulo || 'Consulta la publicación en moderación.' }))
  if (role === 'nutritionist') return data.filter(item => item.estado === 'programada' && Date.parse(item.inicio || '') > now).map(item => ({
    id: 'appointment-' + item._id + '-' + item.inicio, titulo: 'Cita pendiente de confirmar',
    detalle: (item.patient?.name || 'Paciente') + ' · ' + new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.inicio!)),
  }))
  return []
}

export function noticeDestination(role: string | undefined, route: unknown) {
  if (role === 'patient' && route === '/mis-citas') return '/mis-citas' as const
  if (role === 'patient' && route === '/mi-plan') return '/mi-plan' as const
  if (role === 'nutritionist' && route === '/planes') return '/planes' as const
  if (role === 'nutritionist' && route === '/citas') return '/citas' as const
  if (role === 'nutritionist' && route === '/comunidad') return '/comunidad' as const
  if (role === 'admin' && route === '/moderacion') return '/moderacion' as const
  return null
}
