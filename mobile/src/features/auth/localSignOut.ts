export async function localSignOut(removeToken:()=>Promise<void>, clearState:()=>void, cleanup:(()=>Promise<unknown>)[]) {
  await removeToken()
  clearState()
  return {cleanup:Promise.allSettled(cleanup.map(task=>Promise.resolve().then(task)))}
}
