import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8')
const build = readFileSync(new URL('../scripts/prepare-pwa.mjs', import.meta.url), 'utf8')
const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

function simularSW(network) {
  const handlers = new Map()
  const cacheMemory = new Map()
  const actions = []
  const caches = {
    open: async name => ({
      put: async (url, value) => { actions.push('put:' + name);cacheMemory.set(String(url), value) },
      add: async () => undefined,
    }),
    match: async url => { actions.push('cache');return cacheMemory.get(String(url)) },
    keys: async () => [],
    delete: async () => true,
  }
  const worker = {
    location: { origin: 'https://nutria.test' },
    addEventListener: (event, handler) => handlers.set(event, handler),
    skipWaiting: async () => {},
    clients: { claim: async () => {}, matchAll: async () => [] },
  }
  runInNewContext(sw, {
    self: worker, caches, URL, Request, Response,
    fetch: (request, options) => { actions.push('network');return network(request, options) },
    console,
  })
  const event = (method, path, mode) => {
    let promised
    handlers.get('fetch')({
      request: { method, url: 'https://nutria.test' + path, mode },
      respondWith: p => { promised = p },
    })
    return promised
  }
  return { event, actions, cacheMemory }
}

test('Vercel y el build evitan HTML y worker obsoletos', () => {
  assert.match(pkg.scripts.build, /prepare-pwa\.mjs && vite build/)
  assert.match(build, /VERCEL_GIT_COMMIT_SHA/)
  assert.match(build, /CACHE_NAME/)
  assert.match(build, /ASSETS_NAME/)
  for (const path of ['/sw.js', '/index.html', '/']) {
    const entry = config.headers.find(item => item.source === path)
    assert.ok(entry, 'Faltan headers para ' + path)
    assert.ok(entry.headers.some(h => h.key === 'Cache-Control' && /no-cache|no-store/.test(h.value)))
  }
  assert.match(main, /updateViaCache: 'none'/)
  assert.match(main, /visibilitychange/)
})

test('el worker no intercepta API ni escrituras', () => {
  const sim = simularSW(async () => ({ ok: true }))
  assert.equal(sim.event('GET', '/api/citas', 'cors'), undefined)
  assert.equal(sim.event('GET', '/api/pacientes', 'cors'), undefined)
  assert.equal(sim.event('GET', '/sw.js', 'cors'), undefined)
  assert.equal(sim.event('POST', '/citas', 'navigate'), undefined)
  assert.deepEqual(sim.actions, [])
})

test('la navegación solicita primero HTML nuevo desde la red', async () => {
  const response = { ok: true, type: 'basic', clone() { return this } }
  const sim = simularSW(async (_req, options) => {
    assert.equal(options.cache, 'no-store')
    return response
  })
  assert.equal(await sim.event('GET', '/citas', 'navigate'), response)
  assert.equal(sim.actions[0], 'network')
})

test('los JS con hash primero consultan red y guardan respaldo', async () => {
  const response = { ok: true, type: 'basic', clone() { return this } }
  const sim = simularSW(async () => response)
  assert.equal(await sim.event('GET', '/assets/app.abcdef.js', 'cors'), response)
  assert.equal(sim.actions[0], 'network')
  assert.ok(sim.actions.some(action => action.startsWith('put:nutria-assets-')))
})

test('sin conexión funciona HTML respaldado', async () => {
  const sim = simularSW(async () => { throw Error('offline') })
  sim.cacheMemory.set('/index.html', 'HTML de respaldo')
  assert.equal(await sim.event('GET', '/citas', 'navigate'), 'HTML de respaldo')
})
