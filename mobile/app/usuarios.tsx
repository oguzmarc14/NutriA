import { useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import { FormField } from '@/shared/ui/FormField'
import { AppDialog } from '@/shared/ui/AppDialog'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import type { StaffUser, Users } from '@/features/admin/models'
export default function UsersScreen() {
  const { session } = useAuth()
  const resource = useResource<Users>('/usuarios')
  const [search,setSearch] = useState(''), [error,setError] = useState(''), [message,setMessage] = useState('')
  const [creating,setCreating] = useState(false), [busy,setBusy] = useState(false)
  const lock = useRef(false)
  const [form,setForm] = useState({name:'',email:'',role:'nutritionist' as StaffUser['role']})
  const [change,setChange] = useState<{user:StaffUser; kind:'role'|'active'} | null>(null)
  const rows = [...(resource.data?.administradores || []),...(resource.data?.nutriologos || [])]
  const results = rows.filter(u=>(u.name+' '+u.email).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  async function persist(path:string,body:object,method:'POST'|'PATCH'='PATCH') {
    if (!session || lock.current) return
    if (creating && (form.name.trim().length<2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))) { setError('Escribe nombre y correo válidos.'); return }
    lock.current=true;setBusy(true);setError('')
    try { await request(path,{token:session.token,method,body});setCreating(false);setChange(null);setForm({name:'',email:'',role:'nutritionist'});resource.reload();setMessage('Los cambios de acceso se guardaron correctamente.') }
    catch(cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el acceso.') }
    finally {lock.current=false;setBusy(false)}
  }
  return <Page><Text style={styles.title}>Usuarios y accesos</Text>
    <FormField label="Buscar usuarios" value={search} onChange={setSearch} />
    <Button label="Autorizar nuevo usuario" onPress={()=>setCreating(true)} disabled={busy} />
    <ListState {...resource} />
    {resource.data && !results.length && <Text style={styles.body}>No hay usuarios que coincidan.</Text>}
    {results.map(user=><View key={user.id} style={styles.card}><Text style={styles.cardTitle}>{user.name}</Text><Text style={styles.body}>{user.email}</Text><Text style={styles.body}>{user.role==='admin'?'Administrador':'Nutriólogo'} · {user.active?'Activo':'Desactivado'}</Text>
      <Text style={styles.body}>{user.googleVerified?'Cuenta vinculada a Google':'Primer acceso con Google pendiente'}</Text>
      {user.id === session?.user.id ? <Text style={styles.body}>Tu cuenta actual. Los cambios de tu propio acceso están protegidos.</Text> : <View style={styles.row}>
        <Button expand selected={false} disabled={busy} label={user.active?'Desactivar acceso':'Activar acceso'} onPress={()=>setChange({user,kind:'active'})} />
        <Button expand selected={false} disabled={busy} label={'Cambiar a '+(user.role==='admin'?'nutriólogo':'administrador')} onPress={()=>setChange({user,kind:'role'})} />
      </View>}
    </View>)}
    <AppDialog visible={creating} title="Autorizar usuario" message="La cuenta iniciará sesión con Google usando este correo." onClose={()=>{if(!busy)setCreating(false)}}>
      <FormField label="Nombre completo" value={form.name} disabled={busy} onChange={name=>setForm({...form,name})}/><FormField label="Correo de Google" value={form.email} disabled={busy} onChange={email=>setForm({...form,email})}/>
      <View style={styles.row}>{(['nutritionist','admin'] as const).map(role=><Button key={role} expand label={role==='admin'?'Administrador':'Nutriólogo'} selected={form.role===role} disabled={busy} onPress={()=>setForm({...form,role})}/>)}</View>
      <Button label={busy?'Guardando…':'Autorizar acceso'} disabled={busy} onPress={()=>void persist('/usuarios',{...form,name:form.name.trim(),email:form.email.trim().toLowerCase()},'POST')}/><Button label="Cancelar" selected={false} disabled={busy} onPress={()=>setCreating(false)}/>
    </AppDialog>
    <AppDialog visible={!!change} title="Confirmar cambio de acceso" message={change ? change.user.name+' · '+change.user.email+'\n'+(change.kind==='active'?(change.user.active?'Se desactivará su acceso.':'Se activará su acceso.'):'Se cambiará su rol a '+(change.user.role==='admin'?'nutriólogo.':'administrador.')) : ''} onClose={()=>{if(!busy)setChange(null)}}>
      <Button label={busy?'Guardando…':'Confirmar cambio'} disabled={busy} onPress={()=>{if(change)void persist('/usuarios/'+change.user.id+(change.kind==='active'?'/estado':'/rol'),change.kind==='active'?{active:!change.user.active}:{role:change.user.role==='admin'?'nutritionist':'admin'})}}/><Button label="Cancelar" selected={false} disabled={busy} onPress={()=>setChange(null)}/>
    </AppDialog>
    <AppDialog visible={!!error} title="Revisa el acceso" message={error} onClose={()=>setError('')}/><AppDialog visible={!!message} success title="Acceso actualizado" message={message} onClose={()=>setMessage('')}/>
  </Page>
}
