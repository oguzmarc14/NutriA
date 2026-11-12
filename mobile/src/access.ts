export const roleLabels = {
  admin: 'Administrador',
  nutritionist: 'Nutriólogo',
  patient: 'Paciente',
} as const

export type Role = keyof typeof roleLabels

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(roleLabels, value)
}

export function canViewClinic(role: Role | undefined) {
  return role === 'nutritionist'
}
