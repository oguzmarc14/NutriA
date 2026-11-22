import { useRef } from 'react'
import { FormField } from '@/shared/ui/FormField'
import { AppDialog } from '@/shared/ui/AppDialog'
import { request } from '@/core/api/client'
import { recipePayload, type RecipeDraft } from '@/features/clinic/recipeModel'
import { useAuth } from '@/features/auth/AuthProvider'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { useList } from '@/shared/hooks/useList'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
type Recipe = { _id: string; titulo: string; descripcion: string; estado: string; porciones: number;
  autor?: { name?: string }; ingredientes: { nombre: string; cantidad: number; unidad: string }[]; instrucciones: string[] }
export default function Community() {
  const { session } = useAuth()
  const canCreate = session?.user.role === 'nutritionist'
  const [own, setOwn] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const blank = ():RecipeDraft=>({title:'',description:'',portions:'1',ingredients:[{name:'',amount:'1',unit:''}],steps:'',tags:''})
  const [form,setForm] = useState(blank), [creating,setCreating] = useState(false), [busy,setBusy] = useState(false), [error,setError] = useState(''), [publish,setPublish] = useState<Recipe|null>(null)
  const lock=useRef(false)
  async function create() {
    if(!session || lock.current)return
    let body:ReturnType<typeof recipePayload>
    try{body=recipePayload(form)}catch(cause){setError(cause instanceof Error?cause.message:'Revisa la receta.');return}
    lock.current=true;setBusy(true);setError('')
    try{await request('/community',{token:session.token,body});setCreating(false);setForm(blank());setOwn(true);list.reload()}
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo crear la receta.')}
    finally{lock.current=false;setBusy(false)}
  }
  async function submitPublication() {
    if(!session || !publish || lock.current)return
    lock.current=true;setBusy(true);setError('')
    try{await request('/community/'+publish._id+'/publicar',{token:session.token,method:'POST'});setPublish(null);list.reload()}
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo enviar la publicación.')}
    finally{lock.current=false;setBusy(false)}
  }
  const list = useList<Recipe>(own && canCreate ? '/community/mias' : '/community')
  const results = list.rows.filter(item => item.titulo.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  return <Page><Text style={styles.title}>NutriA Community</Text>
    <Text style={styles.body}>Recetas compartidas por la comunidad.</Text>
    <View style={styles.row}><Button expand label="Publicadas" selected={!own} onPress={() => { setOwn(false); setExpanded(null) }} />
      {canCreate && <Button expand label="Mis recetas" selected={own} onPress={() => { setOwn(true); setExpanded(null) }} />}</View>
    {canCreate && <Button label="Crear receta" disabled={busy} onPress={()=>setCreating(true)}/>}
    <TextInput accessibilityLabel="Buscar recetas" style={styles.input} placeholder="Buscar receta" value={search} onChangeText={setSearch} />
    {list.loading || list.error || !list.rows.length ? <ListState {...list} empty="Todavía no hay recetas en esta sección." /> :
      !results.length ? <Text style={styles.body}>No encontramos recetas con ese nombre.</Text> : results.map(item => <View key={item._id} style={styles.card}>
        <Text style={styles.cardTitle}>{item.titulo}</Text><Text style={styles.body}>{item.descripcion}</Text>
        <Text style={styles.body}>{item.porciones} porciones · {own ? item.estado : item.autor?.name || 'Comunidad'}</Text>
        {expanded === item._id && <><Text style={styles.cardTitle}>Ingredientes</Text>
          {item.ingredientes.map((part, i) => <Text key={i} style={styles.body}>{part.cantidad} {part.unidad} de {part.nombre}</Text>)}
          <Text style={styles.cardTitle}>Preparación</Text>{item.instrucciones.map((step, i) => <Text key={i} style={styles.body}>{i + 1}. {step}</Text>)}</>}
        {own && ['privada','rechazada'].includes(item.estado) && <Button label="Enviar a publicación" disabled={busy} onPress={()=>setPublish(item)}/>}
        <Button selected={false} label={expanded === item._id ? 'Ocultar receta' : 'Ver receta'} onPress={() => setExpanded(expanded === item._id ? null : item._id)} />
      </View>)}
    <AppDialog visible={creating} title="Nueva receta" message="Se guardará como privada. Después puedes enviarla a publicación." onClose={()=>{if(!busy)setCreating(false)}}>
      <FormField label="Título *" value={form.title} disabled={busy} onChange={title=>setForm({...form,title})}/><FormField label="Descripción" multiline value={form.description} disabled={busy} onChange={description=>setForm({...form,description})}/><FormField label="Porciones *" numeric value={form.portions} disabled={busy} onChange={portions=>setForm({...form,portions})}/>
      <Text style={styles.cardTitle}>Ingredientes</Text>
      {form.ingredients.map((item,index)=><View key={index} style={styles.card}>{(['name','amount','unit'] as const).map(key=><FormField key={key} label={key==='name'?'Ingrediente':key==='amount'?'Cantidad':'Unidad (taza, pieza, g…)'} numeric={key==='amount'} value={item[key]} disabled={busy} onChange={value=>setForm({...form,ingredients:form.ingredients.map((part,i)=>i===index?{...part,[key]:value}:part)})}/>)}<Button label="Quitar ingrediente" selected={false} disabled={busy||form.ingredients.length===1} onPress={()=>setForm({...form,ingredients:form.ingredients.filter((_,i)=>i!==index)})}/></View>)}
      <Button label="Agregar ingrediente" selected={false} disabled={busy||form.ingredients.length>=100} onPress={()=>setForm({...form,ingredients:[...form.ingredients,{name:'',amount:'1',unit:''}]})}/>
      <FormField label="Preparación: un paso por línea *" multiline value={form.steps} disabled={busy} onChange={steps=>setForm({...form,steps})}/><FormField label="Etiquetas separadas por comas (opcional)" value={form.tags} disabled={busy} onChange={tags=>setForm({...form,tags})}/>
      <Button label={busy?'Guardando…':'Guardar receta privada'} disabled={busy} onPress={()=>void create()}/><Button label="Cancelar" selected={false} disabled={busy} onPress={()=>setCreating(false)}/>
    </AppDialog>
    <AppDialog visible={!!publish} title="Enviar a publicación" message={'Se enviará «'+(publish?.titulo||'')+'» a la comunidad. La publicación está sujeta a las reglas de revisión de tu cuenta.'} onClose={()=>{if(!busy)setPublish(null)}}><Button label={busy?'Enviando…':'Confirmar envío'} disabled={busy} onPress={()=>void submitPublication()}/><Button label="Cancelar" selected={false} disabled={busy} onPress={()=>setPublish(null)}/></AppDialog>
    <AppDialog visible={!!error} title="Revisa la receta" message={error} onClose={()=>setError('')}/>

  </Page>
}
