type Listener = () => void
let interrupted = false
const listeners = new Set<Listener>()

export function getConnectionInterrupted() { return interrupted }
export function subscribeConnection(listener: Listener) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function reportConnection(failed: boolean) {
  if (interrupted === failed) return
  interrupted = failed
  listeners.forEach(listener => listener())
}
