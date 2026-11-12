import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import './theme/dark.css'
import { ThemeProvider } from './theme/ThemeProvider'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const teniaControlador = Boolean(navigator.serviceWorker.controller)
      // Controlar que la PWA avise de una actualizacion sin borrar formularios.
      if (teniaControlador) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.dispatchEvent(new Event('nutria:pwa-update'))
        })
      }
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none',
      })
      await registration.update()
      const revisar = () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {})
      }
      document.addEventListener('visibilitychange', revisar)
      window.addEventListener('pageshow', revisar)
    } catch (error) {
      console.error('No fue posible activar el modo instalable de NutriA', error)
    }
  })
}
