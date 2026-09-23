import { useCallback, useMemo, useState } from 'react'
import { useAuth } from './auth'
import { PacienteTrabajoContext } from './pacienteTrabajo'

const STORAGE_PREFIX = 'nutria_paciente_trabajo'

function obtenerStorageKey(user) {
  if (!user?.id || user.role !== 'nutritionist') return ''
  return `${STORAGE_PREFIX}_${user.id}`
}

function recuperarPaciente(storageKey) {
  if (!storageKey) return null

  try {
    const guardado = JSON.parse(localStorage.getItem(storageKey))

    if (!guardado?.id || !guardado?.name) return null

    return guardado
  } catch {
    localStorage.removeItem(storageKey)
    return null
  }
}

export function PacienteTrabajoProvider({ children }) {
  const { user } = useAuth()
  const storageKey = obtenerStorageKey(user)
  const [pacienteTrabajo, setPacienteTrabajo] = useState(() =>
    recuperarPaciente(storageKey),
  )

  const iniciarTrabajo = useCallback(
    (paciente) => {
      if (!storageKey || !paciente?._id) return

      const pacienteGuardado = {
        id: paciente._id,
        name: paciente.name,
      }

      localStorage.setItem(
        storageKey,
        JSON.stringify(pacienteGuardado),
      )
      setPacienteTrabajo(pacienteGuardado)
    },
    [storageKey],
  )

  const cerrarTrabajo = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey)
    setPacienteTrabajo(null)
  }, [storageKey])

  const value = useMemo(
    () => ({
      cerrarTrabajo,
      iniciarTrabajo,
      pacienteTrabajo,
    }),
    [cerrarTrabajo, iniciarTrabajo, pacienteTrabajo],
  )

  return (
    <PacienteTrabajoContext.Provider value={value}>
      {children}
    </PacienteTrabajoContext.Provider>
  )
}
