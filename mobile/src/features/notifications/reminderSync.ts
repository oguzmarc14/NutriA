const listeners = new Set<() => void>()
export function refreshAppointments() { for (const listener of listeners) listener() }
export function onAppointmentsChanged(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
