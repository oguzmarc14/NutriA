import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Las herramientas de desarrollo quedan accesibles solo desde este equipo.
  // No exponer Vite a redes públicas mientras la vulnerabilidad de picomatch
  // (GHSA-fc5q-39xc-vjpf) siga sin parche oficial.
  server: {
    host: '127.0.0.1',
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    strictPort: true,
  },
  define: {
    __NUTRIA_BUILD_ID__: JSON.stringify((process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local').slice(0, 8)),
  },
})
