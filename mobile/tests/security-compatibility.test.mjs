import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
const require=createRequire(import.meta.url)
test('patched URI decoder remains callable by query-string and handles malformed runs without rescanning',()=>{
  const decode=require('decode-uri-component'),query=require('query-string')
  assert.equal(typeof decode,'function');assert.equal(decode('Ma%C3%B1ana'),'Mañana');assert.equal(query.parse('q=Ma%C3%B1ana').q,'Mañana')
  assert.equal(typeof decode('%C0'.repeat(20000)),'string');assert.equal(decode('%'),'%')
})
test('patched image-size preserves Metro default-export usage for the real NutriA icon',()=>{
  const mod=require('image-size'),imageSize=mod.__esModule?mod.default:mod
  const info=imageSize(readFileSync(new URL('../assets/nutria-icon.png',import.meta.url)))
  assert.equal(info.width,info.height);assert.ok(info.width>=512)
})

test('image-size adapter supports the synchronous filename contract used by Metro',()=>{ const dimensions=require('image-size')(fileURLToPath(new URL('../assets/nutria-icon.png',import.meta.url))); assert.ok(dimensions.width>0); assert.equal(dimensions.width,dimensions.height) })
