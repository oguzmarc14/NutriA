import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
export function loadTS(file, mocks={}, globals={}) {
  const absolute=path.resolve(fileURLToPath(new URL('..',import.meta.url)),file)
  const source=fs.readFileSync(absolute,'utf8')
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText
  const module={exports:{}}
  vm.runInNewContext(code,{module,exports:module.exports,require:name=>{
    if(Object.hasOwn(mocks,name))return mocks[name]
    if(name.startsWith('.'))return loadTS(path.resolve(path.dirname(absolute),name),mocks,globals)
    return require(name)
  },console,Date,setTimeout,clearTimeout,setInterval,clearInterval,AbortController,URL,process,fetch,...globals},{filename:absolute})
  return module.exports
}
