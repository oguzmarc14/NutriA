import { createContext, useContext } from 'react'

export const PacienteTrabajoContext = createContext(null)

export function usePacienteTrabajo() {
  const context = useContext(PacienteTrabajoContext)

  if (!context) {
    throw new Error(
      'usePacienteTrabajo debe utilizarse dentro de PacienteTrabajoProvider',
    )
  }

  return context
}
