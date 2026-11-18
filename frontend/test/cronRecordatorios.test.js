import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import handler, { autorizaCron, endpointRecordatorios } from '../api/cron/recordatorios.js'

test('cron no acepta secretos vacíos, erróneos o ausentes', () => {
  assert.equal(autorizaCron('Bearer token-seguro', 'token-seguro'), true)
  assert.equal(autorizaCron('Bearer otro', 'token-seguro'), false)
  assert.equal(autorizaCron('Bearer token-seguro', ''), false)
  assert.equal(autorizaCron(undefined, 'token-seguro'), false)
})
test('la URL del backend reutiliza el /api de VITE_API_URL sin duplicarlo', () => {
  assert.equal(endpointRecordatorios('https://api.ejemplo.mx/api'),
    'https://api.ejemplo.mx/api/recordatorios/procesar')
  assert.equal(endpointRecordatorios('https://api.ejemplo.mx/'),
    'https://api.ejemplo.mx/api/recordatorios/procesar')
  assert.throws(()=>endpointRecordatorios('http://api.ejemplo.mx/api'))
})
test('Vercel configura ejecución diaria compatible con plan Hobby', () => {
  const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'))
  assert.deepEqual(config.crons,[{path:'/api/cron/recordatorios',schedule:'17 6 * * *'}])
})
test('sin secreto, cron devuelve 503 sin contactar al backend', async () => {
  const antes=process.env.CRON_SECRET
  delete process.env.CRON_SECRET
  const response={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this},
    status(code){this.statusCode=code;return this},json(data){this.body=data;return this}}
  try {
    await handler({method:'GET',headers:{}},response)
    assert.equal(response.statusCode,503)
    assert.equal(response.headers['Cache-Control'],'no-store')
  } finally {
    if(antes===undefined)delete process.env.CRON_SECRET
    else process.env.CRON_SECRET=antes
  }
})
test('se rechazan métodos distintos de GET y petición sin autorización', async () => {
  const antes=process.env.CRON_SECRET
  process.env.CRON_SECRET='solo-pruebas'
  const response=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this},
    status(code){this.statusCode=code;return this},json(data){this.body=data;return this}})
  try {
    const post=response()
    await handler({method:'POST',headers:{}},post)
    assert.equal(post.statusCode,405)
    const anon=response()
    await handler({method:'GET',headers:{}},anon)
    assert.equal(anon.statusCode,401)
  } finally {
    if(antes===undefined)delete process.env.CRON_SECRET
    else process.env.CRON_SECRET=antes
  }
})

test('petición autorizada reenvía el secreto solo al backend y devuelve conteos', async () => {
  const anteriorSecreto = process.env.CRON_SECRET
  const anteriorApi = process.env.VITE_API_URL
  const anteriorBackend = process.env.NUTRIA_BACKEND_URL
  const anteriorFetch = globalThis.fetch
  let llamadas = 0
  process.env.CRON_SECRET = 'secreto-de-prueba-seguro'
  process.env.VITE_API_URL = 'https://api.ejemplo.mx/api'
  delete process.env.NUTRIA_BACKEND_URL
  globalThis.fetch = async (url, opciones) => {
    llamadas++
    assert.equal(url, 'https://api.ejemplo.mx/api/recordatorios/procesar')
    assert.equal(opciones.method, 'POST')
    assert.equal(opciones.headers['x-cron-secret'], 'secreto-de-prueba-seguro')
    assert.equal(opciones.redirect, 'error')
    return { ok: true, json: async () => ({ enviados: 2, fallidos: 0, omitidos: 3, evaluados: 5 }) }
  }
  const respuesta = { statusCode: 200, headers: {},
    setHeader(k,v){this.headers[k]=v;return this},
    status(code){this.statusCode=code;return this},
    json(data){this.body=data;return this},
  }
  try {
    await handler({method:'GET',headers:{authorization:'Bearer secreto-de-prueba-seguro'}},respuesta)
    assert.equal(respuesta.statusCode,200)
    assert.deepEqual(respuesta.body,{enviados:2,fallidos:0,omitidos:3,evaluados:5})
    assert.equal(llamadas,1)
    assert.equal(JSON.stringify(respuesta.body).includes('secreto-de-prueba-seguro'),false)
  } finally {
    globalThis.fetch=anteriorFetch
    if(anteriorSecreto===undefined)delete process.env.CRON_SECRET
    else process.env.CRON_SECRET=anteriorSecreto
    if(anteriorApi===undefined)delete process.env.VITE_API_URL
    else process.env.VITE_API_URL=anteriorApi
    if(anteriorBackend===undefined)delete process.env.NUTRIA_BACKEND_URL
    else process.env.NUTRIA_BACKEND_URL=anteriorBackend
  }
})
