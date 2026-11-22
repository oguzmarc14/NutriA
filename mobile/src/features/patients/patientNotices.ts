export type PatientNoticeData = { accountStatus?: string | null; phone?: string; birthDate?: string; notes?: string; tieneExpediente?: boolean; tienePlan?: boolean; ultimaMedicion?: { peso?: number } | null }
export type PatientNotice = { id: string; title: string; detail: string; action?: 'edit' | 'expediente' | 'planes' | 'mediciones' }
export function patientNotices(p: PatientNoticeData): PatientNotice[] {
  const notices: PatientNotice[] = []
  if (p.accountStatus === 'pending') notices.push({ id: 'invitation', title: 'Invitación pendiente', detail: 'La cuenta todavía está pendiente de activación. Puedes revisar el estado o reenviar la invitación desde la tarjeta.' })
  if (!p.phone?.trim()) notices.push({ id: 'phone', title: 'Teléfono por registrar', detail: 'Puedes agregar un número de contacto si el paciente desea compartirlo.', action: 'edit' })
  if (!p.birthDate) notices.push({ id: 'birth', title: 'Fecha de nacimiento por registrar', detail: 'Este dato es opcional. Puedes completarlo cuando corresponda.', action: 'edit' })
  if (p.tieneExpediente === false) notices.push({ id: 'record', title: 'Expediente por iniciar', detail: 'Todavía no hay un expediente clínico registrado.', action: 'expediente' })
  if (p.tienePlan === false) notices.push({ id: 'plan', title: 'Plan alimenticio por preparar', detail: 'Su elaboración depende de la valoración profesional.', action: 'planes' })
  if (p.ultimaMedicion === null) notices.push({ id: 'measurements', title: 'Sin mediciones registradas', detail: 'Puedes registrar mediciones cuando corresponda al seguimiento acordado.', action: 'mediciones' })
  return notices
}
export function weightChange(measurements?: { peso?: number; fecha?: string; createdAt?: string }[]) {
  const sorted = (measurements || []).filter(m => Number.isFinite(m.peso) && m.peso! > 0 && Number.isFinite(Date.parse(m.fecha || m.createdAt || ''))).sort((a, b) => Date.parse(a.fecha || a.createdAt!) - Date.parse(b.fecha || b.createdAt!))
  return sorted.length > 1 ? sorted[sorted.length - 1].peso! - sorted[0].peso! : null
}
