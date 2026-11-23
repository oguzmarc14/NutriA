export const patientDestinations = {
  record: '/expediente', measurements: '/mediciones', calculation: '/calculo',
  plan: '/planes', 'create-plan': '/dieta', payments: '/pagos-paciente', progress: '/seguimiento-paciente',
} as const
export type PatientIntent = keyof typeof patientDestinations
export function isPatientIntent(value: unknown): value is PatientIntent {
  return typeof value === 'string' && Object.hasOwn(patientDestinations, value)
}
export const clinicMenuSections = [
  { label: 'Inicio', items: [
    { label: 'Resumen', icon: 'grid-outline', path: '/' },
    { label: 'Pacientes', icon: 'people-outline', path: '/pacientes' },
  ] },
  { label: 'Expediente y mediciones', items: [
    { label: 'Expediente clínico', icon: 'clipboard-outline', intent: 'record' },
    { label: 'Mediciones', icon: 'fitness-outline', intent: 'measurements' },
    { label: 'Cálculo nutricional', icon: 'calculator-outline', intent: 'calculation' },
    { label: 'Progreso', icon: 'trending-up-outline', intent: 'progress' },
  ] },
  { label: 'Dietas', items: [
    { label: 'Crear dieta', icon: 'nutrition-outline', intent: 'create-plan' },
    { label: 'Consultar dietas', icon: 'documents-outline', intent: 'plan' },
    { label: 'Mis dietas', icon: 'bookmark-outline', path: '/comunidad', tab: 'dietas' },
  ] },
  { label: 'Citas', items: [
    { label: 'Ver citas', icon: 'calendar-outline', path: '/citas' },
    { label: 'Crear cita', icon: 'calendar-number-outline', path: '/agendar' },
  ] },
  { label: 'Configuración de la clínica', items: [
    { label: 'Mi clínica', icon: 'business-outline', path: '/mi-clinica' },
    { label: 'Horarios y días no laborables', icon: 'time-outline', path: '/horarios' },
    { label: 'Pagos de pacientes', icon: 'wallet-outline', intent: 'payments' },
  ] },
  { label: 'Comunidad', items: [
    { label: 'NutriA Community', icon: 'book-outline', path: '/comunidad' },
  ] },
] as const
