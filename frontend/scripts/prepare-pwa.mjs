import { readFileSync, writeFileSync } from 'node:fs'
const ruta = new URL('../public/sw.js', import.meta.url)
const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA ||
  process.env.NUTRIA_BUILD_ID || Date.now().toString(36)
const version = commit.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 28)
const original = readFileSync(ruta, 'utf8')
const generado = original
  .replace(/const CACHE_NAME = '[^']+'/,
    "const CACHE_NAME = 'nutria-shell-" + version + "'")
  .replace(/const ASSETS_NAME = '[^']+'/,
    "const ASSETS_NAME = 'nutria-assets-" + version + "'")
if (original === generado) throw new Error('No se pudo asignar version a la PWA')
writeFileSync(ruta, generado)
