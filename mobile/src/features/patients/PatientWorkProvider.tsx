import * as SecureStore from 'expo-secure-store'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'

type ActivePatient = { id: string; name: string }
type ContextValue = {
  active: ActivePatient | null
  start: (patient: { _id: string; name: string }) => void
  stop: () => void
}
const Context = createContext<ContextValue | null>(null)
const validId = (id: string) => /^[a-f\d]{24}$/i.test(id)

export function PatientWorkProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const key = session?.user.role === 'nutritionist' ? 'nutria.patient-work.' + session.user.id : null
  const [saved, setSaved] = useState<{ key: string; patient: ActivePatient } | null>(null)
  useEffect(() => {
    if (!key) return
    let cancelled = false
    void SecureStore.getItemAsync(key).then(raw => {
      if (!raw || cancelled) return
      try {
        const patient = JSON.parse(raw) as ActivePatient
        if (typeof patient.id !== 'string' || !validId(patient.id) ||
          typeof patient.name !== 'string' || !patient.name.trim()) return
        setSaved(old => old?.key === key ? old : { key, patient })
      } catch { /* Ignorar datos locales inválidos */ }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [key])
  // El paciente de otro nutriólogo nunca se muestra ni se utiliza.
  const active = key && saved?.key === key ? saved.patient : null
  const start = useCallback((patient: { _id: string; name: string }) => {
    if (!key || !validId(patient._id) || !patient.name.trim()) return
    const selected = { id: patient._id, name: patient.name.trim() }
    setSaved({ key, patient: selected })
    void SecureStore.setItemAsync(key, JSON.stringify(selected)).catch(() => {})
  }, [key])
  const stop = useCallback(() => {
    setSaved(null)
    if (key) void SecureStore.deleteItemAsync(key).catch(() => {})
  }, [key])
  const value = useMemo(() => ({ active, start, stop }), [active, start, stop])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function usePatientWork() {
  const context = useContext(Context)
  if (!context) throw new Error('PatientWorkProvider requerido')
  return context
}
